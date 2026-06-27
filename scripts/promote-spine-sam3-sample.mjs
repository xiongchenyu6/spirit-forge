#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKER_URL = "https://lingji-forge.xiongchenyu6.workers.dev";
const DEFAULT_OUTPUT_DIR = "/tmp/lingji-spine-sam3-promotion";
const DEFAULT_QUOTA_WAIT_MS = 8 * 60 * 60 * 1000;
const DEFAULT_QUOTA_POLL_MS = 60 * 1000;
const DEFAULT_QA_TIMEOUT_MS = 30 * 60 * 1000;
const LAYER_COST = 8;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_MANIFEST = join(root, "scripts", "spine-sam3-packs.json");
const qaRunner = join(root, "scripts", "run-spine-sam3-qa.mjs");
const r2SyncScript = join(root, "scripts", "sync-spine-sam3-qa-r2.mjs");

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printUsage();
  process.exit(0);
}

if (options.pushR2Baseline) options.fullDefaultQa = true;
if ((options.fullDefaultQa || options.pushR2Baseline) && !options.promote && !options.dryRunCommands) {
  failFast("--full-default-qa and --push-r2-baseline require --promote so the promoted sample is included in the default QA manifest.");
}

if (options.dryRunCommands) {
  printPostPromotionCommands();
  process.exit(0);
}

const manifest = loadManifest(options.manifestPath);
const sample = selectSample(manifest, options);
if (!sample) failFast("No pending SAM3 sample found. Pass --pack <packId> or add a pending-sam3 entry to the manifest.");

const workerUrl = normalizeWorkerUrl(options.workerUrl || process.env.LINGJI_WORKER_URL || DEFAULT_WORKER_URL);
const token = options.token || process.env.GENERATOR_ACCESS_TOKEN || readTokenFromEnvFile(options.envFile || ".dev.vars");
const outputDir = resolve(options.outputDir || DEFAULT_OUTPUT_DIR);
const frameId = options.frameId || "idle";
const requestId = options.requestId || defaultLayerRequestId(sample.packId, frameId);

if (!token) failFast("Missing access token. Set GENERATOR_ACCESS_TOKEN or keep it in .dev.vars.");

console.log(`SAM3 sample promotion: ${sample.packId} (${sample.label || "unlabeled"})`);
console.log(`Worker: ${workerUrl}`);
console.log(`Frame: ${frameId}`);
console.log(`Request: ${requestId}`);

const packPayload = await apiGet(`/api/packs/${encodeURIComponent(sample.packId)}`);
const pack = packPayload.pack || packPayload;
if (!pack?.packId) failFast(`Pack not found: ${sample.packId}`);
if (pack.spineSam3Layers && !options.force) {
  console.log("Pack already has SAM3 layers; skipping layer submission.");
} else {
  const recovered = options.force ? null : await recoverLayerRequest(requestId, sample.packId);
  if (recovered) {
    console.log(`Recovered layer job: ${recovered.promptId}`);
    await pollLayerJob(recovered.promptId);
  } else {
    await waitForQuotaReady();
    if (options.dryRun) {
      console.log(`Dry run: would POST /api/packs/${sample.packId}/layers/generate with frameId=${frameId}, requestId=${requestId}`);
      process.exit(0);
    }
    const submitted = await apiPost(`/api/packs/${encodeURIComponent(sample.packId)}/layers/generate`, {
      frameId,
      requestId,
    });
    if (!submitted.ok) failFast(submitted.message || submitted.error || "Layer generation submission failed.");
    console.log(`Submitted layer job: ${submitted.promptId}`);
    await pollLayerJob(submitted.promptId);
  }
}

runQa(sample.packId);

if (options.promote) {
  promoteManifestSample(manifest, sample.packId);
  console.log(`Promoted manifest sample: ${sample.packId}`);
} else {
  console.log("Manifest not changed. Re-run with --promote after reviewing QA output.");
}

if (options.fullDefaultQa) {
  runDefaultQa();
}

if (options.pushR2Baseline) {
  pushR2Baseline();
}

function runQa(packId) {
  const args = [
    qaRunner,
    "--mode",
    options.qaMode || "preview",
    "--pack",
    packId,
    "--output-dir",
    outputDir,
    "--min-score",
    String(options.minScore ?? 75),
    "--no-html",
  ];
  if (options.skipZip || options.qaMode !== "full") args.push("--skip-zip");
  if (options.workerUrl) args.push("--worker-url", options.workerUrl);
  if (options.envFile) args.push("--env-file", options.envFile);
  console.log("");
  console.log(`Running QA: ${[process.execPath, ...args].map(shellQuote).join(" ")}`);
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    timeout: qaTimeoutMs(),
  });
  if (result.error) failFast(result.error.message);
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);
}

function runDefaultQa() {
  const args = [
    qaRunner,
    "--mode",
    "full",
    "--output-dir",
    outputDir,
    "--no-html",
  ];
  if (options.workerUrl) args.push("--worker-url", options.workerUrl);
  if (options.envFile) args.push("--env-file", options.envFile);
  runNodeScript(args, "Running default full QA");
}

function pushR2Baseline() {
  const args = [
    r2SyncScript,
    "push",
    "--output-dir",
    outputDir,
  ];
  if (options.remote) args.push("--remote");
  runNodeScript(args, "Pushing QA artifacts to R2");
}

function runNodeScript(args, label) {
  console.log("");
  console.log(`${label}: ${[process.execPath, ...args].map(shellQuote).join(" ")}`);
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    timeout: qaTimeoutMs(),
  });
  if (result.error) failFast(result.error.message);
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);
}

async function pollLayerJob(promptId) {
  const timeoutMs = options.timeoutMs ?? 20 * 60 * 1000;
  const intervalMs = options.intervalMs ?? 8000;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const job = await apiGet(`/api/jobs/${encodeURIComponent(promptId)}?kind=layer-separation`);
    const status = job.status || (job.completed ? "complete" : "running");
    console.log(`Layer job ${promptId}: ${status}`);
    if (status === "complete") return job;
    if (status === "failed" || status === "error" || job.error) {
      failFast(job.message || job.error || `Layer job failed: ${status}`);
    }
    await sleep(intervalMs);
  }
  failFast(`Layer job timed out after ${Math.round(timeoutMs / 1000)}s: ${promptId}`);
}

async function recoverLayerRequest(requestId, packId) {
  const recovered = await apiGet(`/api/requests/layer-separation/${encodeURIComponent(requestId)}`, { allowNotFound: true });
  if (!recovered?.ok) return null;
  if (packId && recovered.packId !== packId) return null;
  return recovered;
}

async function waitForQuotaReady() {
  const started = Date.now();
  const maxWaitMs = Number.isFinite(options.maxWaitMs) ? Math.max(0, options.maxWaitMs) : DEFAULT_QUOTA_WAIT_MS;
  const pollMs = Number.isFinite(options.quotaPollMs) ? Math.max(1000, options.quotaPollMs) : DEFAULT_QUOTA_POLL_MS;
  while (true) {
    const usage = await apiGet("/api/usage");
    const dailyRemaining = Number(usage.daily?.remaining ?? 0);
    const hourlyRemaining = Number(usage.hourly?.remaining ?? 0);
    if (dailyRemaining >= LAYER_COST && hourlyRemaining >= LAYER_COST) {
      console.log(`Quota ready: hourly=${hourlyRemaining}, daily=${dailyRemaining}, required=${LAYER_COST}`);
      return usage;
    }
    console.log(`Quota not ready: hourly=${hourlyRemaining}, daily=${dailyRemaining}, required=${LAYER_COST}`);
    console.log(`Reset: hourly=${usage.hourly?.resetAt || "-"}, daily=${usage.daily?.resetAt || "-"}`);
    if (!options.waitForQuota || options.dryRun) {
      process.exit(options.allowQuotaFailure ? 0 : 1);
    }
    const elapsed = Date.now() - started;
    if (elapsed >= maxWaitMs) {
      console.log(`Quota wait timed out after ${Math.round(elapsed / 1000)}s.`);
      process.exit(options.allowQuotaFailure ? 0 : 1);
    }
    const sleepMs = Math.min(pollMs, maxWaitMs - elapsed);
    console.log(`Waiting ${Math.round(sleepMs / 1000)}s for quota...`);
    await sleep(sleepMs);
  }
}

function promoteManifestSample(manifest, packId) {
  const target = manifest.data.packs.find((item) => item.packId === packId);
  if (!target) failFast(`Cannot promote missing manifest sample: ${packId}`);
  target.status = "active";
  target.hasSam3 = true;
  target.enabled = true;
  target.promotedAt = new Date().toISOString();
  target.tags = Array.from(new Set((target.tags || []).filter((tag) => tag !== "pending").concat("sam3")));
  target.notes = "SAM3 layer job completed and QA passed.";
  manifest.data.updatedAt = new Date().toISOString().slice(0, 10);
  writeFileSync(manifest.path, `${JSON.stringify(manifest.data, null, 2)}\n`);
}

function selectSample(manifest, options) {
  if (options.packId) {
    const existing = manifest.data.packs.find((item) => item.packId === options.packId);
    return existing || { packId: options.packId, label: "manual pack" };
  }
  return manifest.data.packs.find((item) => item.enabled !== false && (item.status === "pending-sam3" || item.hasSam3 === false));
}

function loadManifest(path) {
  const manifestPath = resolve(path || DEFAULT_MANIFEST);
  let data;
  try {
    data = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    failFast(`Failed to read manifest ${manifestPath}: ${error.message}`);
  }
  if (!Array.isArray(data?.packs)) failFast(`Invalid manifest ${manifestPath}: expected packs array.`);
  return { path: manifestPath, data };
}

async function apiGet(path, options = {}) {
  return await apiFetch(path, { method: "GET" }, options);
}

async function apiPost(path, body) {
  return await apiFetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function apiFetch(path, init, options = {}) {
  const response = await fetch(`${workerUrl}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      accept: "application/json",
      "x-lingji-access-token": token,
    },
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 500) };
  }
  if (!response.ok && options.allowNotFound && response.status === 404) return null;
  if (!response.ok) {
    const message = data.message || data.error || data.raw || `HTTP ${response.status}`;
    failFast(`${init.method || "GET"} ${path} failed: ${response.status} ${message}`);
  }
  return data;
}

function readTokenFromEnvFile(path) {
  if (!path || !existsSync(path)) return "";
  const text = readFileSync(path, "utf8");
  const match = text.match(/^GENERATOR_ACCESS_TOKEN=(.*)$/m);
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}

function parseArgs(argv) {
  const parsed = {
    allowQuotaFailure: false,
    dryRun: false,
    dryRunCommands: false,
    envFile: null,
    force: false,
    frameId: null,
    fullDefaultQa: false,
    help: false,
    intervalMs: null,
    manifestPath: null,
    maxWaitMs: null,
    minScore: null,
    outputDir: null,
    packId: null,
    promote: false,
    pushR2Baseline: false,
    qaMode: null,
    quotaPollMs: null,
    qaTimeoutMs: null,
    remote: false,
    skipZip: false,
    timeoutMs: null,
    token: null,
    workerUrl: null,
    waitForQuota: false,
    requestId: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--allow-quota-failure") parsed.allowQuotaFailure = true;
    else if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--env-file") parsed.envFile = requiredValue(argv, i += 1, arg);
    else if (arg === "--force") parsed.force = true;
    else if (arg === "--frame-id") parsed.frameId = requiredValue(argv, i += 1, arg);
    else if (arg === "--full-default-qa") parsed.fullDefaultQa = true;
    else if (arg === "--interval-ms") parsed.intervalMs = Number(requiredValue(argv, i += 1, arg));
    else if (arg === "--manifest") parsed.manifestPath = requiredValue(argv, i += 1, arg);
    else if (arg === "--max-wait-ms") parsed.maxWaitMs = Number(requiredValue(argv, i += 1, arg));
    else if (arg === "--min-score") parsed.minScore = Number(requiredValue(argv, i += 1, arg));
    else if (arg === "--output-dir") parsed.outputDir = requiredValue(argv, i += 1, arg);
    else if (arg === "--pack") parsed.packId = requiredValue(argv, i += 1, arg);
    else if (arg === "--promote") parsed.promote = true;
    else if (arg === "--push-r2-baseline") parsed.pushR2Baseline = true;
    else if (arg === "--qa-mode") parsed.qaMode = requiredValue(argv, i += 1, arg);
    else if (arg === "--quota-poll-ms") parsed.quotaPollMs = Number(requiredValue(argv, i += 1, arg));
    else if (arg === "--qa-timeout-ms") parsed.qaTimeoutMs = Number(requiredValue(argv, i += 1, arg));
    else if (arg === "--remote") parsed.remote = true;
    else if (arg === "--skip-zip") parsed.skipZip = true;
    else if (arg === "--timeout-ms") parsed.timeoutMs = Number(requiredValue(argv, i += 1, arg));
    else if (arg === "--token") parsed.token = requiredValue(argv, i += 1, arg);
    else if (arg === "--worker-url") parsed.workerUrl = requiredValue(argv, i += 1, arg);
    else if (arg === "--wait-for-quota") parsed.waitForQuota = true;
    else if (arg === "--request-id") parsed.requestId = requiredValue(argv, i += 1, arg);
    else if (arg === "--dry-run-commands") parsed.dryRunCommands = true;
    else if (arg.startsWith("--")) failFast(`Unknown argument: ${arg}`);
    else if (!parsed.packId) parsed.packId = arg;
    else failFast(`Unexpected argument: ${arg}`);
  }
  return parsed;
}

function printPostPromotionCommands() {
  const commandOutputDir = resolve(options.outputDir || DEFAULT_OUTPUT_DIR);
  const args = [
    qaRunner,
    "--mode",
    "full",
    "--output-dir",
    commandOutputDir,
    "--no-html",
  ];
  const syncArgs = [
    r2SyncScript,
    "push",
    "--output-dir",
    commandOutputDir,
    ...(options.remote ? ["--remote"] : []),
  ];
  console.log([process.execPath, ...args].map(shellQuote).join(" "));
  console.log([process.execPath, ...syncArgs].map(shellQuote).join(" "));
}

function requiredValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) failFast(`${flag} requires a value.`);
  return value;
}

function normalizeWorkerUrl(url) {
  return String(url || "").replace(/\/+$/, "");
}

function defaultLayerRequestId(packId, frameId) {
  return `promote-sam3-${safeSegment(packId)}-${safeSegment(frameId)}`;
}

function safeSegment(value) {
  return String(value || "item")
    .trim()
    .replace(/[^a-z0-9._:-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "item";
}

function shellQuote(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(text)) return text;
  return `'${text.replaceAll("'", "'\\''")}'`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function qaTimeoutMs() {
  const fromOption = Number(options.qaTimeoutMs);
  if (Number.isFinite(fromOption) && fromOption > 0) return fromOption;
  const fromEnv = Number(process.env.SPINE_SAM3_QA_TIMEOUT_MS);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  return DEFAULT_QA_TIMEOUT_MS;
}

function failFast(message) {
  console.error(message);
  process.exit(1);
}

function printUsage() {
  console.log(`Usage:
  node scripts/promote-spine-sam3-sample.mjs [--pack <id>] [--promote]

Promotes a pending SAM3 sample by submitting /layers/generate, polling the layer job,
running QA, and optionally updating scripts/spine-sam3-packs.json.

Options:
  --pack <id>              Pack id. Defaults to first pending-sam3 manifest sample.
  --frame-id <id>          Source frame for layer separation. Defaults to idle.
  --promote                Update manifest to active after QA passes.
  --full-default-qa        After --promote, run full QA for all default active samples.
  --push-r2-baseline       Requires --promote; push QA artifacts and latest ok baseline to R2.
  --remote                 Pass --remote to the R2 sync script.
  --dry-run                Check quota/pack and print the layer submission only.
  --dry-run-commands       Print post-promotion full QA/R2 commands and exit.
  --force                  Submit a new layer job even if the pack already has SAM3.
  --qa-mode <mode>         preview or full. Defaults to preview.
  --skip-zip               Skip ZIP check when QA mode is full.
  --allow-quota-failure    Exit 0 instead of 1 when quota is not ready.
  --wait-for-quota         Poll /api/usage until enough quota is available.
  --max-wait-ms <ms>       Max wait when --wait-for-quota is set. Defaults to 8h.
  --quota-poll-ms <ms>     Usage polling interval. Defaults to 60000.
  --qa-timeout-ms <ms>     Max runtime for each QA child process. Defaults to 30m.
  --worker-url <url>       Worker base URL.
  --request-id <id>        Layer request id. Defaults to promote-sam3-<pack>-<frame>.
  --env-file <path>        Env file for GENERATOR_ACCESS_TOKEN. Defaults to .dev.vars.
  --output-dir <path>      QA output directory. Defaults to ${DEFAULT_OUTPUT_DIR}.
  --manifest <path>        Manifest path. Defaults to scripts/spine-sam3-packs.json.
  --min-score <score>      QA minimum score. Defaults to 75.
`);
}
