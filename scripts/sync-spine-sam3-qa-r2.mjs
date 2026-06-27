#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, extname, join, resolve } from "node:path";

const DEFAULT_BUCKET = "lingji-forge-assets";
const DEFAULT_PREFIX = "qa/spine-sam3";
const DEFAULT_OUTPUT_DIR = "/tmp/lingji-spine-sam3-qa";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.command) {
  printUsage();
  process.exit(args.help ? 0 : 2);
}

const bucket = args.bucket || process.env.SPINE_SAM3_QA_R2_BUCKET || DEFAULT_BUCKET;
const prefix = trimSlashes(args.prefix || process.env.SPINE_SAM3_QA_R2_PREFIX || DEFAULT_PREFIX);
const outputDir = resolve(args.outputDir || process.env.SPINE_SAM3_QA_DIR || DEFAULT_OUTPUT_DIR);
const historyDir = resolve(args.historyDir || process.env.SPINE_SAM3_HISTORY_DIR || join(outputDir, "history"));
const latestOkPath = resolve(args.latestOkPath || join(historyDir, "r2-latest-ok.json"));

if (args.command === "pull-baseline") {
  pullBaseline({ bucket, prefix, latestOkPath, optional: args.optional, dryRun: args.dryRun, remote: args.remote });
} else if (args.command === "push") {
  pushArtifacts({ bucket, prefix, outputDir, historyDir, dryRun: args.dryRun, remote: args.remote });
} else {
  failFast(`Unknown command: ${args.command}`);
}

function pullBaseline({ bucket, prefix, latestOkPath, optional, dryRun, remote }) {
  mkdirSync(dirname(latestOkPath), { recursive: true });
  const objectPath = `${bucket}/${prefix}/history/latest-ok.json`;
  const command = ["r2", "object", "get", objectPath, "--file", latestOkPath, ...remoteFlags(remote)];
  const result = runWrangler(command, { dryRun, allowFailure: optional });
  if (result.ok) {
    console.log(`Pulled SAM3 QA baseline: ${objectPath} -> ${latestOkPath}`);
  } else if (optional) {
    console.log(`No SAM3 QA baseline pulled from ${objectPath}; continuing because --optional was set.`);
  }
}

function pushArtifacts({ bucket, prefix, outputDir, historyDir, dryRun, remote }) {
  const uploads = collectUploads({ outputDir, historyDir, prefix });
  if (uploads.length === 0) failFast(`No SAM3 QA artifacts found under ${outputDir}`);

  for (const upload of uploads) {
    putObject({ bucket, localPath: upload.localPath, key: upload.key, contentType: upload.contentType, dryRun, remote });
  }

  const latestOk = findLatestOkHistorySnapshot(historyDir);
  if (latestOk) {
    putObject({
      bucket,
      localPath: latestOk,
      key: `${prefix}/history/latest-ok.json`,
      contentType: "application/json",
      dryRun,
      remote,
    });
  } else {
    console.log("No ok history snapshot found; latest-ok.json was not updated.");
  }
  console.log(`SAM3 QA R2 sync complete: ${uploads.length}${latestOk ? " + latest-ok" : ""} object(s).`);
}

function collectUploads({ outputDir, historyDir, prefix }) {
  const uploads = [];
  for (const file of listFiles(outputDir, { recursive: false })) {
    const name = basename(file);
    if (/^spine-sam3-.*\.json$/.test(name)) {
      uploads.push({
        localPath: file,
        key: `${prefix}/reports/${name}`,
        contentType: "application/json",
      });
    } else if (/^spine-sam3-.*\.html$/.test(name)) {
      uploads.push({
        localPath: file,
        key: `${prefix}/html/${name}`,
        contentType: "text/html; charset=utf-8",
      });
    }
  }
  for (const file of listFiles(historyDir, { recursive: false })) {
    const name = basename(file);
    if (name === "index.json" || /^sam3-spine-\d{4}-\d{2}-\d{2}T.*\.json$/.test(name)) {
      uploads.push({
        localPath: file,
        key: `${prefix}/history/${name}`,
        contentType: "application/json",
      });
    }
  }
  uploads.sort((left, right) => left.key.localeCompare(right.key));
  return uploads;
}

function listFiles(dir, { recursive }) {
  if (!existsSync(dir)) return [];
  const entries = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isFile()) {
      entries.push(path);
    } else if (recursive && stat.isDirectory()) {
      entries.push(...listFiles(path, { recursive }));
    }
  }
  return entries;
}

function findLatestOkHistorySnapshot(historyDir) {
  const files = listFiles(historyDir, { recursive: false })
    .filter((file) => /^sam3-spine-\d{4}-\d{2}-\d{2}T.*\.json$/.test(basename(file)))
    .sort()
    .reverse();
  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(file, "utf8"));
      if (data?.ok === true && Array.isArray(data.packs) && data.packs.length > 0) return file;
    } catch {
      // Ignore corrupt or partial snapshots and continue.
    }
  }
  return null;
}

function putObject({ bucket, localPath, key, contentType, dryRun, remote }) {
  const objectPath = `${bucket}/${key}`;
  runWrangler([
    "r2",
    "object",
    "put",
    objectPath,
    "--file",
    localPath,
    "--content-type",
    contentType || contentTypeForPath(localPath),
    ...remoteFlags(remote),
  ], { dryRun });
}

function runWrangler(command, { dryRun, allowFailure = false } = {}) {
  const fullCommand = ["wrangler", ...command];
  if (dryRun) {
    console.log(fullCommand.map(shellQuote).join(" "));
    return { ok: true };
  }
  const result = spawnSync("wrangler", command, {
    stdio: "inherit",
  });
  if (result.error) {
    if (allowFailure) return { ok: false };
    failFast(result.error.message);
  }
  if ((result.status ?? 1) !== 0) {
    if (allowFailure) return { ok: false };
    process.exit(result.status ?? 1);
  }
  return { ok: true };
}

function remoteFlags(remote) {
  return remote ? ["--remote"] : [];
}

function contentTypeForPath(path) {
  const extension = extname(path).toLowerCase();
  if (extension === ".html") return "text/html; charset=utf-8";
  if (extension === ".json") return "application/json";
  return "application/octet-stream";
}

function parseArgs(argv) {
  const parsed = {
    command: null,
    bucket: null,
    dryRun: false,
    help: false,
    historyDir: null,
    latestOkPath: null,
    optional: false,
    outputDir: null,
    prefix: null,
    remote: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--bucket") {
      parsed.bucket = requiredValue(argv, i += 1, "--bucket");
    } else if (arg === "--prefix") {
      parsed.prefix = requiredValue(argv, i += 1, "--prefix");
    } else if (arg === "--output-dir") {
      parsed.outputDir = requiredValue(argv, i += 1, "--output-dir");
    } else if (arg === "--history-dir") {
      parsed.historyDir = requiredValue(argv, i += 1, "--history-dir");
    } else if (arg === "--latest-ok") {
      parsed.latestOkPath = requiredValue(argv, i += 1, "--latest-ok");
    } else if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--optional") {
      parsed.optional = true;
    } else if (arg === "--remote") {
      parsed.remote = true;
    } else if (arg.startsWith("--")) {
      failFast(`Unknown argument: ${arg}`);
    } else if (!parsed.command) {
      parsed.command = arg;
    } else {
      failFast(`Unexpected argument: ${arg}`);
    }
  }
  return parsed;
}

function requiredValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) failFast(`${flag} requires a value.`);
  return value;
}

function trimSlashes(value) {
  return String(value || "").replace(/^\/+|\/+$/g, "");
}

function shellQuote(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(text)) return text;
  return `'${text.replaceAll("'", "'\\''")}'`;
}

function printUsage() {
  console.log(`Usage:
  node scripts/sync-spine-sam3-qa-r2.mjs pull-baseline [options]
  node scripts/sync-spine-sam3-qa-r2.mjs push [options]

Commands:
  pull-baseline  Download ${DEFAULT_PREFIX}/history/latest-ok.json for gate mode.
  push           Upload reports, HTML reports, history snapshots, and latest-ok.json.

Options:
  --bucket <name>       R2 bucket. Defaults to ${DEFAULT_BUCKET}.
  --prefix <key>        R2 key prefix. Defaults to ${DEFAULT_PREFIX}.
  --output-dir <path>   Runner artifact directory. Defaults to ${DEFAULT_OUTPUT_DIR}.
  --history-dir <path>  History directory. Defaults to <output-dir>/history.
  --latest-ok <path>    Destination path for pull-baseline.
  --optional            Do not fail pull-baseline when no object exists yet.
  --remote              Force remote R2 mode for wrangler.
  --dry-run             Print wrangler commands without running them.
`);
}

function failFast(message) {
  console.error(message);
  process.exit(2);
}
