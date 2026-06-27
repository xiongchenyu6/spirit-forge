#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const verifyScript = join(root, "scripts", "verify-spine-sam3-regression.mjs");
const DEFAULT_PACK_MANIFEST = join(root, "scripts", "spine-sam3-packs.json");
const DEFAULT_OUTPUT_DIR = "/tmp/lingji-spine-sam3-qa";
const DEFAULT_VERIFY_TIMEOUT_MS = 30 * 60 * 1000;
const MODES = new Set(["history", "gate", "full", "preview"]);

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printUsage();
  process.exit(0);
}

if (options.listSamples) {
  printPackSamples(options);
  process.exit(0);
}

const mode = options.mode || "history";
if (!MODES.has(mode)) failFast(`Unknown mode: ${mode}`);

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = resolve(options.outputDir || process.env.SPINE_SAM3_QA_DIR || DEFAULT_OUTPUT_DIR);
const historyDir = resolve(options.historyDir || process.env.SPINE_SAM3_HISTORY_DIR || join(outputDir, "history"));
mkdirSync(outputDir, { recursive: true });

const verifyArgs = [verifyScript];
const defaultSamples = !options.discover && options.packIds.length === 0 ? selectDefaultPackSamples(options) : [];
const packIds = options.discover ? [] : options.packIds.length > 0 ? options.packIds : defaultSamples.map((sample) => sample.packId);
if (!options.discover && packIds.length === 0) failFast("No SAM3 pack ids selected.");
for (const packId of packIds) {
  verifyArgs.push("--pack", packId);
}

verifyArgs.push("--min-score", String(options.minScore ?? 75));
if (options.workerUrl) verifyArgs.push("--worker-url", options.workerUrl);
if (options.envFile) verifyArgs.push("--env-file", options.envFile);
if (options.listLimit) verifyArgs.push("--list-limit", String(options.listLimit));

const reportPath = resolve(options.reportPath || join(outputDir, `spine-sam3-${mode}-${timestamp}.json`));
verifyArgs.push("--report", reportPath);

const shouldWriteHtml = options.htmlReportPath || (options.html && !options.noHtml) || (!options.noHtml && (mode === "history" || mode === "preview"));
if (shouldWriteHtml) {
  verifyArgs.push("--html-report", resolve(options.htmlReportPath || join(outputDir, `spine-sam3-${mode}-${timestamp}.html`)));
}

const shouldSkipZip = options.skipZip || ((mode === "history" || mode === "preview") && !options.fullZip);
if (shouldSkipZip) verifyArgs.push("--skip-zip");

if (mode === "history" || mode === "full") {
  verifyArgs.push("--history-dir", historyDir);
}

if (mode === "gate") {
  const baselineReport = options.baselineReportPath
    ? resolve(options.baselineReportPath)
    : findLatestOkHistorySnapshot(historyDir);
  if (baselineReport) verifyArgs.push("--baseline-report", baselineReport);
  if (options.writeHistory) verifyArgs.push("--history-dir", historyDir);
  verifyArgs.push("--fail-on-drift", "--require-baseline");
}

for (const [flag, value] of options.driftFlags) {
  verifyArgs.push(flag, value);
}

console.log(`SAM3 QA runner: mode=${mode}`);
console.log(`Output: ${outputDir}`);
console.log(`History: ${historyDir}`);
if (defaultSamples.length) {
  console.log(`Samples: ${defaultSamples.map((sample) => `${sample.label} (${sample.packId})`).join(", ")}`);
}
if (mode === "gate") {
  const baselineIndex = verifyArgs.indexOf("--baseline-report");
  console.log(`Baseline: ${baselineIndex >= 0 ? verifyArgs[baselineIndex + 1] : "missing"}`);
}
console.log(`Report: ${reportPath}`);
console.log("");

if (options.dryRun) {
  console.log([process.execPath, ...verifyArgs].map(shellQuote).join(" "));
  process.exit(0);
}

const result = spawnSync(process.execPath, verifyArgs, {
  cwd: root,
  env: process.env,
  stdio: "inherit",
  timeout: verifyTimeoutMs(options.verifyTimeoutMs),
});

if (result.error) failFast(result.error.message);
process.exit(result.status ?? 1);

function parseArgs(argv) {
  const parsed = {
    mode: null,
    packIds: [],
    outputDir: null,
    historyDir: null,
    baselineReportPath: null,
    reportPath: null,
    htmlReportPath: null,
    manifestPath: null,
    workerUrl: null,
    envFile: null,
    minScore: null,
    listLimit: null,
    tags: [],
    driftFlags: [],
    verifyTimeoutMs: null,
    discover: false,
    dryRun: false,
    fullZip: false,
    help: false,
    html: false,
    includePending: false,
    listSamples: false,
    noHtml: false,
    skipZip: false,
    writeHistory: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--mode") {
      parsed.mode = requiredValue(argv, i += 1, "--mode");
    } else if (arg === "--pack") {
      parsed.packIds.push(requiredValue(argv, i += 1, "--pack"));
    } else if (arg === "--discover") {
      parsed.discover = true;
    } else if (arg === "--output-dir") {
      parsed.outputDir = requiredValue(argv, i += 1, "--output-dir");
    } else if (arg === "--history-dir") {
      parsed.historyDir = requiredValue(argv, i += 1, "--history-dir");
    } else if (arg === "--baseline-report") {
      parsed.baselineReportPath = requiredValue(argv, i += 1, "--baseline-report");
    } else if (arg === "--report") {
      parsed.reportPath = requiredValue(argv, i += 1, "--report");
    } else if (arg === "--html-report") {
      parsed.htmlReportPath = requiredValue(argv, i += 1, "--html-report");
    } else if (arg === "--manifest") {
      parsed.manifestPath = requiredValue(argv, i += 1, "--manifest");
    } else if (arg === "--worker-url") {
      parsed.workerUrl = requiredValue(argv, i += 1, "--worker-url");
    } else if (arg === "--env-file") {
      parsed.envFile = requiredValue(argv, i += 1, "--env-file");
    } else if (arg === "--min-score") {
      parsed.minScore = Number(requiredValue(argv, i += 1, "--min-score"));
    } else if (arg === "--list-limit") {
      parsed.listLimit = Number(requiredValue(argv, i += 1, "--list-limit"));
    } else if (arg === "--verify-timeout-ms") {
      parsed.verifyTimeoutMs = Number(requiredValue(argv, i += 1, "--verify-timeout-ms"));
    } else if (arg === "--tag") {
      parsed.tags.push(requiredValue(argv, i += 1, "--tag"));
    } else if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--full-zip") {
      parsed.fullZip = true;
    } else if (arg === "--html") {
      parsed.html = true;
    } else if (arg === "--include-pending") {
      parsed.includePending = true;
    } else if (arg === "--list-samples") {
      parsed.listSamples = true;
    } else if (arg === "--no-html") {
      parsed.noHtml = true;
    } else if (arg === "--skip-zip") {
      parsed.skipZip = true;
    } else if (arg === "--write-history") {
      parsed.writeHistory = true;
    } else if (isDriftFlag(arg)) {
      parsed.driftFlags.push([arg, requiredValue(argv, i += 1, arg)]);
    } else if (arg.startsWith("--")) {
      failFast(`Unknown argument: ${arg}`);
    } else {
      parsed.packIds.push(arg);
    }
  }
  return parsed;
}

function selectDefaultPackSamples(options) {
  const manifest = loadPackManifest(options.manifestPath);
  const seen = new Set();
  const samples = [];
  for (const sample of manifest.packs) {
    const packId = typeof sample.packId === "string" ? sample.packId.trim() : "";
    if (!packId) failFast(`Invalid pack sample in ${manifest.path}: missing packId.`);
    if (seen.has(packId)) failFast(`Duplicate packId in ${manifest.path}: ${packId}`);
    seen.add(packId);
    if (sample.enabled === false) continue;
    if (!options.includePending && (sample.hasSam3 === false || sample.status === "pending-sam3")) continue;
    if (!matchesTags(sample, options.tags)) continue;
    samples.push({ ...sample, packId });
  }
  return samples;
}

function loadPackManifest(manifestPath) {
  const path = resolve(manifestPath || DEFAULT_PACK_MANIFEST);
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    failFast(`Failed to read SAM3 pack manifest ${path}: ${error.message}`);
  }
  if (!Array.isArray(data?.packs)) failFast(`Invalid SAM3 pack manifest ${path}: expected packs array.`);
  return { path, packs: data.packs };
}

function matchesTags(sample, requiredTags) {
  if (requiredTags.length === 0) return true;
  const tags = new Set(Array.isArray(sample.tags) ? sample.tags : []);
  return requiredTags.every((tag) => tags.has(tag));
}

function printPackSamples(options) {
  const manifest = loadPackManifest(options.manifestPath);
  console.log(`SAM3 pack manifest: ${manifest.path}`);
  for (const sample of manifest.packs) {
    const tags = Array.isArray(sample.tags) ? sample.tags.join(",") : "";
    console.log([
      sample.hasSam3 === false || sample.status === "pending-sam3" ? "pending" : "active",
      sample.enabled === false ? "disabled" : "enabled",
      sample.packId,
      sample.label || "unlabeled",
      tags ? `[${tags}]` : "",
    ].filter(Boolean).join(" | "));
  }
}

function requiredValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) failFast(`${flag} requires a value.`);
  return value;
}

function isDriftFlag(arg) {
  return arg === "--max-score-drop"
    || arg === "--max-risky-increase"
    || arg === "--max-warnings-increase"
    || arg === "--max-trimmed-increase"
    || arg === "--max-part-byte-change-ratio";
}

function verifyTimeoutMs(value) {
  const fromOption = Number(value);
  if (Number.isFinite(fromOption) && fromOption > 0) return fromOption;
  const fromEnv = Number(process.env.SPINE_SAM3_VERIFY_TIMEOUT_MS);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  return DEFAULT_VERIFY_TIMEOUT_MS;
}

function findLatestOkHistorySnapshot(historyDir) {
  if (!existsSync(historyDir)) return null;
  for (const file of ["r2-latest-ok.json", "latest-ok.json"]) {
    const path = join(historyDir, file);
    if (isOkHistorySnapshot(path)) return path;
  }
  let files = [];
  try {
    files = readdirSync(historyDir)
      .filter((file) => /^sam3-spine-\d{4}-\d{2}-\d{2}T/.test(file) && file.endsWith(".json"))
      .sort()
      .reverse();
  } catch {
    return null;
  }
  for (const file of files) {
    const path = join(historyDir, file);
    if (isOkHistorySnapshot(path)) return path;
  }
  return null;
}

function isOkHistorySnapshot(path) {
  if (!existsSync(path)) return false;
  try {
    const data = JSON.parse(readFileSync(path, "utf8"));
    return data?.ok === true && Array.isArray(data.packs) && data.packs.length > 0;
  } catch {
    return false;
  }
}

function shellQuote(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(text)) return text;
  return `'${text.replaceAll("'", "'\\''")}'`;
}

function printUsage() {
  console.log(`Usage:
  node scripts/run-spine-sam3-qa.mjs [--mode history|gate|full|preview]

Modes:
  history   Fast preview QA, writes compact history and HTML visual report. Default.
  gate      Runs drift gate against --baseline-report or latest ok history snapshot.
  full      Full ZIP QA and compact history write.
  preview   Fast preview-only QA without history.

Defaults:
  Manifest: ${DEFAULT_PACK_MANIFEST}
  Output: ${DEFAULT_OUTPUT_DIR}

Options:
  --pack <id>             Override default pack list. Repeat for multiple packs.
  --manifest <path>       Pack manifest. Defaults to scripts/spine-sam3-packs.json.
  --list-samples          Print manifest samples and exit.
  --tag <tag>             Select default samples by tag. Repeat for multiple tags.
  --include-pending       Include manifest samples marked pending-sam3.
  --discover              Let the verifier discover SAM3 packs instead of using defaults.
  --output-dir <path>     Artifact output directory.
  --history-dir <path>    History snapshot directory.
  --baseline-report <p>   Explicit baseline report for gate mode.
  --report <path>         Explicit JSON report path.
  --html-report <path>    Explicit HTML report path.
  --html / --no-html      Force or disable HTML output.
  --full-zip              Include cloud ZIP checks in history/preview modes.
  --skip-zip              Skip cloud ZIP checks in gate/full modes.
  --write-history         In gate mode, also write a history snapshot.
  --dry-run               Print the underlying verifier command without running it.
  --worker-url <url>      Worker base URL.
  --env-file <path>       Env file used by the verifier. Defaults there to .dev.vars.
  --min-score <score>     Minimum SAM3 quality score. Defaults to 75.
  --list-limit <count>    Discovery page size when --discover is used.
  --verify-timeout-ms <n> Max verifier runtime before the child process is killed. Defaults to 30m.
  --max-score-drop <n>    Override drift score drop threshold.
  --max-risky-increase <n>
  --max-warnings-increase <n>
  --max-trimmed-increase <n>
  --max-part-byte-change-ratio <n>
`);
}

function failFast(message) {
  console.error(message);
  process.exit(2);
}
