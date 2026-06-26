#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";

const DEFAULT_WORKER_URL = "https://lingji-forge.xiongchenyu6.workers.dev";
const REQUIRED_PARTS = ["head", "torso", "hips", "arm_l", "arm_r", "leg_l", "leg_r"];
const REQUIRED_STATIC_ENTRIES = [
  "metadata.json",
  "manifest/engine-import.json",
  "spine/sam3-layers/skeleton.json",
  "spine/sam3-layers/parts.atlas",
  "spine/sam3-layers/parts.png",
  "spine/sam3-layers/parts.json",
  "spine/sam3-layers/quality.json",
  "spine/sam3-layers/cleanup.json",
  "spine/sam3-layers/cleaned-skeleton.json",
  "spine/sam3-layers/cleaned-parts.atlas",
  "spine/sam3-layers/cleaned-parts.png",
];
const DEFAULT_DRIFT_THRESHOLDS = {
  maxScoreDrop: 5,
  maxRiskyIncrease: 0,
  maxWarningsIncrease: 0,
  maxTrimmedIncrease: 2000,
  maxPartByteChangeRatio: 0.5,
};

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printUsage();
  process.exit(0);
}

const workerUrl = normalizeWorkerUrl(args.workerUrl || process.env.LINGJI_WORKER_URL || DEFAULT_WORKER_URL);
const token = args.token
  || process.env.GENERATOR_ACCESS_TOKEN
  || readTokenFromEnvFile(args.envFile || ".dev.vars");
const minScore = Number.isFinite(args.minScore) ? args.minScore : 75;
const minPacks = Number.isFinite(args.minPacks) ? args.minPacks : 1;
const listLimit = Number.isFinite(args.listLimit) ? args.listLimit : 50;
const driftThresholds = resolveDriftThresholds(args);
const previewSnapshotMode = args.htmlReportPath
  ? "visual"
  : args.historyDir || args.baselineReportPath || driftThresholds.enabled
    ? "metrics"
    : "none";

if (!token) {
  failFast("Missing access token. Set GENERATOR_ACCESS_TOKEN or keep GENERATOR_ACCESS_TOKEN in .dev.vars.");
}

const packIds = [...args.packIds];
const discovery = {
  attempted: false,
  availableSam3Packs: 0,
};

if (packIds.length === 0) {
  discovery.attempted = true;
  const packs = await discoverSam3Packs({ workerUrl, token, listLimit });
  discovery.availableSam3Packs = packs.length;
  packIds.push(...packs.map((pack) => pack.packId || pack.id).filter(Boolean));
}

if (packIds.length === 0) {
  failFast("No SAM3 Spine packs found. Pass --pack <packId> after generating layer separation for a sprite-actions pack.");
}

const report = {
  ok: true,
  workerUrl,
  checkedAt: new Date().toISOString(),
  minScore,
  minPacks,
  discovery,
  packs: [],
  summary: {
    packs: 0,
    pass: 0,
    fail: 0,
    warn: 0,
  },
};

for (const packId of packIds) {
  const packReport = await verifyPack({
    workerUrl,
    token,
    packId,
    minScore,
    skipZip: args.skipZip,
    previewSnapshotMode,
  });
  report.packs.push(packReport);
  report.summary.packs += 1;
  if (packReport.ok) {
    report.summary.pass += 1;
  } else {
    report.summary.fail += 1;
    report.ok = false;
  }
  if (packReport.warnings.length > 0) report.summary.warn += 1;
}

if (report.summary.packs < minPacks) {
  report.ok = false;
  report.summary.fail += 1;
  report.packs.push({
    packId: null,
    ok: false,
    checks: [],
    warnings: [],
    failures: [`Expected at least ${minPacks} SAM3 Spine pack(s), checked ${report.summary.packs}.`],
  });
}

const baselineReport = args.baselineReportPath
  ? readJsonFile(args.baselineReportPath)
  : args.historyDir
    ? readLatestHistoryReport(args.historyDir)
    : null;
if (baselineReport) {
  attachBaselineComparison(report, baselineReport, args.baselineReportPath || baselineReport.historyPath || null);
}
applyDriftThresholds(report, driftThresholds, args.requireBaseline);

if (args.historyDir) {
  const historyWrite = writeHistorySnapshot(args.historyDir, report);
  report.history = historyWrite;
}

if (args.reportPath) {
  writeFileSync(args.reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

if (args.htmlReportPath) {
  writeFileSync(args.htmlReportPath, renderHtmlReport(report));
}

printReport(report, args.json);
process.exit(report.ok ? 0 : 1);

function parseArgs(argv) {
  const parsed = {
    packIds: [],
    workerUrl: null,
    envFile: ".dev.vars",
    token: null,
    reportPath: null,
    htmlReportPath: null,
    historyDir: null,
    baselineReportPath: null,
    failOnDrift: false,
    requireBaseline: false,
    maxScoreDrop: null,
    maxRiskyIncrease: null,
    maxWarningsIncrease: null,
    maxTrimmedIncrease: null,
    maxPartByteChangeRatio: null,
    minScore: 75,
    minPacks: 1,
    listLimit: 50,
    skipZip: false,
    json: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--pack") {
      parsed.packIds.push(requiredValue(argv, i += 1, "--pack"));
    } else if (arg === "--worker-url") {
      parsed.workerUrl = requiredValue(argv, i += 1, "--worker-url");
    } else if (arg === "--env-file") {
      parsed.envFile = requiredValue(argv, i += 1, "--env-file");
    } else if (arg === "--token") {
      parsed.token = requiredValue(argv, i += 1, "--token");
    } else if (arg === "--report") {
      parsed.reportPath = requiredValue(argv, i += 1, "--report");
    } else if (arg === "--html-report" || arg === "--report-html") {
      parsed.htmlReportPath = requiredValue(argv, i += 1, arg);
    } else if (arg === "--history-dir") {
      parsed.historyDir = requiredValue(argv, i += 1, "--history-dir");
    } else if (arg === "--baseline-report") {
      parsed.baselineReportPath = requiredValue(argv, i += 1, "--baseline-report");
    } else if (arg === "--fail-on-drift") {
      parsed.failOnDrift = true;
    } else if (arg === "--require-baseline") {
      parsed.requireBaseline = true;
    } else if (arg === "--max-score-drop") {
      parsed.maxScoreDrop = Number(requiredValue(argv, i += 1, "--max-score-drop"));
    } else if (arg === "--max-risky-increase") {
      parsed.maxRiskyIncrease = Number(requiredValue(argv, i += 1, "--max-risky-increase"));
    } else if (arg === "--max-warnings-increase") {
      parsed.maxWarningsIncrease = Number(requiredValue(argv, i += 1, "--max-warnings-increase"));
    } else if (arg === "--max-trimmed-increase") {
      parsed.maxTrimmedIncrease = Number(requiredValue(argv, i += 1, "--max-trimmed-increase"));
    } else if (arg === "--max-part-byte-change-ratio") {
      parsed.maxPartByteChangeRatio = Number(requiredValue(argv, i += 1, "--max-part-byte-change-ratio"));
    } else if (arg === "--min-score") {
      parsed.minScore = Number(requiredValue(argv, i += 1, "--min-score"));
    } else if (arg === "--min-packs") {
      parsed.minPacks = Number(requiredValue(argv, i += 1, "--min-packs"));
    } else if (arg === "--list-limit") {
      parsed.listLimit = Number(requiredValue(argv, i += 1, "--list-limit"));
    } else if (arg === "--skip-zip") {
      parsed.skipZip = true;
    } else if (arg === "--json") {
      parsed.json = true;
    } else if (arg.startsWith("--")) {
      failFast(`Unknown argument: ${arg}`);
    } else {
      parsed.packIds.push(arg);
    }
  }
  return parsed;
}

function requiredValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) failFast(`${flag} requires a value.`);
  return value;
}

function printUsage() {
  console.log(`Usage:
  node scripts/verify-spine-sam3-regression.mjs [--pack <packId> ...]

Options:
  --pack <id>           Verify a specific pack. Repeat for multiple packs.
  --worker-url <url>    Worker base URL. Defaults to ${DEFAULT_WORKER_URL}
  --env-file <path>     Env file used to read GENERATOR_ACCESS_TOKEN. Defaults to .dev.vars
  --min-score <score>   Minimum acceptable SAM3 quality score. Defaults to 75
  --min-packs <count>   Minimum verified SAM3 packs required. Defaults to 1
  --list-limit <count>  Pack discovery page size when --pack is omitted. Defaults to 50
  --skip-zip            Only verify pack metadata and preview.json.
  --report <path>       Write a JSON report.
  --html-report <path>  Write a self-contained visual QA HTML report.
  --history-dir <path>  Write a compact history snapshot and compare with the previous snapshot.
  --baseline-report <path>
                        Compare this run with a previous JSON/history report.
  --fail-on-drift       Fail on baseline drift using default thresholds.
  --require-baseline    Fail when drift gating is requested but no baseline is available.
  --max-score-drop <n>  Fail if preview score drops by more than n points.
  --max-risky-increase <n>
                        Fail if cleanup remaining risky pairs increase by more than n.
  --max-warnings-increase <n>
                        Fail if cleanup remaining warnings increase by more than n.
  --max-trimmed-increase <n>
                        Fail if cleanup trimmed pixels increase by more than n.
  --max-part-byte-change-ratio <n>
                        Fail if a part preview byte size changes by more than this ratio.
  --json                Print the JSON report instead of a compact summary.
`);
}

function normalizeWorkerUrl(value) {
  return String(value || "").replace(/\/+$/, "");
}

function readTokenFromEnvFile(path) {
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^GENERATOR_ACCESS_TOKEN=(.*)$/);
      if (!match) continue;
      let value = match[1].trim();
      if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      return value;
    }
  } catch {
    return null;
  }
  return null;
}

async function discoverSam3Packs({ workerUrl, token, listLimit }) {
  const data = await fetchJson(`${workerUrl}/api/packs?limit=${encodeURIComponent(String(listLimit))}`, token);
  return (data.packs || [])
    .filter((pack) => pack.status === "complete")
    .filter((pack) => pack.packKind === "sprite-actions")
    .filter((pack) => pack.spineSam3Layers?.available && pack.spineSam3Layers?.cleanup);
}

async function verifyPack({ workerUrl, token, packId, minScore, skipZip, previewSnapshotMode }) {
  const result = {
    packId,
    ok: true,
    checks: [],
    warnings: [],
    failures: [],
    metrics: {},
  };
  const check = (condition, label, details = {}) => {
    result.checks.push({ label, ok: Boolean(condition), ...details });
    if (!condition) {
      result.ok = false;
      result.failures.push(label);
    }
  };
  const warn = (label, details = {}) => {
    result.warnings.push({ label, ...details });
  };

  try {
    const pack = await fetchJson(`${workerUrl}/api/packs/${encodeURIComponent(packId)}`, token, {
      retries: 2,
      retryDelayMs: 2500,
    });
    const packRecord = pack.pack || pack;
    check(packRecord.status === "complete", "pack status is complete", { status: packRecord.status });
    check(packRecord.packKind === "sprite-actions", "pack is sprite-actions", { packKind: packRecord.packKind });
    check(packRecord.spineSam3Layers?.available === true, "pack exposes spineSam3Layers.available");
    check(Boolean(packRecord.spineSam3Layers?.cleanup), "pack exposes SAM3 cleanup metadata");

    const preview = await fetchJson(`${workerUrl}/api/packs/${encodeURIComponent(packId)}/spine-sam3/preview.json`, token, {
      retries: 5,
      retryDelayMs: 5000,
    });
    const previewParts = Array.isArray(preview.parts) ? preview.parts : [];
    const previewByName = new Map(previewParts.map((part) => [part.name, part]));
    result.metrics.previewParts = previewParts.length;
    result.metrics.previewQualityStatus = preview.quality?.status || null;
    result.metrics.previewQualityScore = preview.quality?.score ?? null;
    result.metrics.previewCleanup = preview.cleanup?.summary || null;
    if (previewSnapshotMode !== "none") {
      result.preview = buildPreviewSnapshot(preview, previewParts, previewSnapshotMode === "visual");
    }

    check(preview.ok === true, "preview.json reports ok");
    check(previewParts.length === REQUIRED_PARTS.length, "preview.json has 7 body parts", { count: previewParts.length });
    for (const partName of REQUIRED_PARTS) {
      const part = previewByName.get(partName);
      check(Boolean(part), `preview has ${partName}`);
      if (!part) continue;
      const original = parseImageDataUrl(part.original?.dataUrl);
      const cleaned = parseImageDataUrl(part.cleaned?.dataUrl);
      check(original.valid, `preview ${partName} original is PNG data URL`, { bytes: original.bytes });
      check(cleaned.valid, `preview ${partName} cleaned is PNG data URL`, { bytes: cleaned.bytes });
      check(cleaned.bytes > 128, `preview ${partName} cleaned has image content`, { bytes: cleaned.bytes });
      if (cleaned.bytes > original.bytes * 1.25) {
        warn(`preview ${partName} cleaned is much larger than original`, {
          originalBytes: original.bytes,
          cleanedBytes: cleaned.bytes,
        });
      }
    }
    check(preview.quality?.status !== "fail", "preview quality status is not fail", { status: preview.quality?.status });
    check((preview.quality?.score ?? 0) >= minScore, "preview quality score meets threshold", { score: preview.quality?.score, minScore });
    check((preview.quality?.summary?.emptyParts ?? 0) === 0, "preview quality has no empty parts", {
      emptyParts: preview.quality?.summary?.emptyParts,
    });
    check((preview.cleanup?.summary?.emptyParts ?? 0) === 0, "cleanup has no empty parts", {
      emptyParts: preview.cleanup?.summary?.emptyParts,
    });
    check((preview.cleanup?.summary?.remainingRiskyPairs ?? 0) === 0, "cleanup has no remaining risky pairs", {
      remainingRiskyPairs: preview.cleanup?.summary?.remainingRiskyPairs,
    });
    check((preview.cleanup?.summary?.remainingWarnings ?? 0) === 0, "cleanup has no remaining overlap warnings", {
      remainingWarnings: preview.cleanup?.summary?.remainingWarnings,
    });

    if (skipZip) return result;

    const zipBuffer = await fetchBytes(`${workerUrl}/api/packs/${encodeURIComponent(packId)}/download.zip`, token, {
      retries: 4,
      retryDelayMs: 5000,
    });
    const zip = parseZip(zipBuffer);
    result.metrics.zipEntries = zip.entries.size;
    for (const entry of requiredZipEntries()) {
      check(zip.entries.has(entry), `zip contains ${entry}`);
    }

    const metadata = readZipJson(zip, "metadata.json", check);
    const engine = readZipJson(zip, "manifest/engine-import.json", check);
    const parts = readZipJson(zip, "spine/sam3-layers/parts.json", check);
    const quality = readZipJson(zip, "spine/sam3-layers/quality.json", check);
    const cleanup = readZipJson(zip, "spine/sam3-layers/cleanup.json", check);
    const skeleton = readZipJson(zip, "spine/sam3-layers/skeleton.json", check);
    const cleanedSkeleton = readZipJson(zip, "spine/sam3-layers/cleaned-skeleton.json", check);

    result.metrics.zipQualityStatus = quality?.status || null;
    result.metrics.zipQualityScore = quality?.score ?? null;
    result.metrics.zipCleanup = cleanup?.summary || null;

    check(metadata?.spineSam3Layers?.cleanup?.manifest === "spine/sam3-layers/cleanup.json", "metadata points to cleanup manifest");
    check(engine?.spineSam3Layers?.cleanup?.skeleton === "spine/sam3-layers/cleaned-skeleton.json", "engine manifest points to cleaned skeleton");
    check(parts?.schema === "lingji-forge.spine-sam3-layers.v1", "parts manifest schema matches SAM3");
    check(Array.isArray(parts?.parts) && parts.parts.length === REQUIRED_PARTS.length, "parts manifest has 7 parts", {
      count: parts?.parts?.length,
    });
    check(quality?.schema === "lingji-forge.spine-sam3-layers-quality.v1", "quality schema matches SAM3");
    check(quality?.status !== "fail", "zip quality status is not fail", { status: quality?.status });
    check((quality?.score ?? 0) >= minScore, "zip quality score meets threshold", { score: quality?.score, minScore });
    check((quality?.summary?.emptyParts ?? 0) === 0, "zip quality has no empty parts", {
      emptyParts: quality?.summary?.emptyParts,
    });
    check((quality?.summary?.missingRequiredParts ?? 0) === 0, "zip quality has no missing required parts", {
      missingRequiredParts: quality?.summary?.missingRequiredParts,
    });
    check((quality?.summary?.cleanupRemainingRiskyPairs ?? 0) === 0, "zip quality has no cleanup remaining risky pairs", {
      cleanupRemainingRiskyPairs: quality?.summary?.cleanupRemainingRiskyPairs,
    });
    check(cleanup?.method === "sam3-overlap-cleanup-v1", "cleanup method is sam3-overlap-cleanup-v1");
    check((cleanup?.summary?.emptyParts ?? 0) === 0, "zip cleanup has no empty parts", {
      emptyParts: cleanup?.summary?.emptyParts,
    });
    check((cleanup?.summary?.remainingRiskyPairs ?? 0) === 0, "zip cleanup has no remaining risky pairs", {
      remainingRiskyPairs: cleanup?.summary?.remainingRiskyPairs,
    });
    check((cleanup?.summary?.remainingWarnings ?? 0) === 0, "zip cleanup has no remaining warnings", {
      remainingWarnings: cleanup?.summary?.remainingWarnings,
    });
    check(skeleton?.skeleton?.images === "./parts/", "SAM3 skeleton uses parts image folder", {
      images: skeleton?.skeleton?.images,
    });
    check(cleanedSkeleton?.skeleton?.images === "./cleaned-parts/", "cleaned skeleton uses cleaned-parts image folder", {
      images: cleanedSkeleton?.skeleton?.images,
    });

    const missingParts = REQUIRED_PARTS.filter((partName) => !parts?.parts?.some((part) => part.name === partName));
    check(missingParts.length === 0, "parts manifest includes all required body parts", { missingParts });
  } catch (error) {
    result.ok = false;
    result.failures.push(error.message);
  }
  return result;
}

function buildPreviewSnapshot(preview, previewParts, includeDataUrl) {
  const previewByName = new Map(previewParts.map((part) => [part.name, part]));
  return {
    quality: preview.quality || null,
    cleanup: preview.cleanup?.summary || null,
    parts: REQUIRED_PARTS.map((partName) => {
      const part = previewByName.get(partName) || { name: partName };
      return {
        name: partName,
        label: part.label || partName,
        original: previewPayloadForHtml(part.original, includeDataUrl),
        cleaned: previewPayloadForHtml(part.cleaned, includeDataUrl),
        quality: part.quality || null,
        cleanup: part.cleanup || null,
      };
    }),
  };
}

function previewPayloadForHtml(payload, includeDataUrl) {
  if (!payload || typeof payload !== "object") return null;
  const parsed = parseImageDataUrl(payload.dataUrl);
  return {
    dataUrl: includeDataUrl && parsed.valid ? payload.dataUrl : null,
    width: finiteOrNull(payload.width),
    height: finiteOrNull(payload.height),
    bytes: parsed.valid ? parsed.bytes : 0,
    quality: payload.quality || null,
    cleanup: payload.cleanup || null,
    sourceRect: payload.sourceRect || null,
  };
}

function finiteOrNull(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function requiredZipEntries() {
  return [
    ...REQUIRED_STATIC_ENTRIES,
    ...REQUIRED_PARTS.map((part) => `spine/sam3-layers/parts/${part}.png`),
    ...REQUIRED_PARTS.map((part) => `spine/sam3-layers/cleaned-parts/${part}.png`),
  ];
}

async function fetchJson(url, token, options = {}) {
  return await withRetries(options, async () => {
    const response = await fetch(url, {
      headers: authHeaders(token),
      signal: AbortSignal.timeout(90000),
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw requestError(response.status, `Expected JSON from ${url}, got ${response.status}: ${text.slice(0, 160)}`);
    }
    if (!response.ok) {
      throw requestError(response.status, `Request failed ${response.status} for ${url}: ${JSON.stringify(data).slice(0, 240)}`);
    }
    return data;
  });
}

async function fetchBytes(url, token, options = {}) {
  return await withRetries(options, async () => {
    const response = await fetch(url, {
      headers: authHeaders(token),
      signal: AbortSignal.timeout(120000),
    });
    const arrayBuffer = await response.arrayBuffer();
    if (!response.ok) {
      const text = Buffer.from(arrayBuffer).toString("utf8");
      throw requestError(response.status, `Request failed ${response.status} for ${url}: ${text.slice(0, 240)}`);
    }
    return Buffer.from(arrayBuffer);
  });
}

async function withRetries(options, operation) {
  const retries = options.retries ?? 0;
  const retryDelayMs = options.retryDelayMs ?? 1000;
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !isRetryableError(error)) break;
      await sleep(retryDelayMs * (attempt + 1));
    }
  }
  throw lastError;
}

function requestError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isRetryableError(error) {
  if (error?.name === "TimeoutError" || error?.name === "AbortError") return true;
  const status = Number(error?.status);
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function authHeaders(token) {
  return {
    "x-lingji-access-token": token,
  };
}

function parseImageDataUrl(value) {
  if (typeof value !== "string" || !value.startsWith("data:image/png;base64,")) {
    return { valid: false, bytes: 0 };
  }
  const base64 = value.slice("data:image/png;base64,".length);
  const bytes = Buffer.from(base64, "base64");
  const valid = bytes.length >= 8
    && bytes[0] === 0x89
    && bytes[1] === 0x50
    && bytes[2] === 0x4e
    && bytes[3] === 0x47;
  return { valid, bytes: bytes.length };
}

function parseZip(buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  if (eocdOffset < 0) throw new Error("Could not find ZIP end of central directory.");
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = new Map();
  let offset = centralDirectoryOffset;
  for (let index = 0; index < totalEntries; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error(`Invalid ZIP central directory entry at ${offset}.`);
    }
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    const content = readZipEntryContent(buffer, localHeaderOffset, method, compressedSize);
    entries.set(name, {
      name,
      method,
      compressedSize,
      uncompressedSize,
      content,
    });
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return { entries };
}

function findEndOfCentralDirectory(buffer) {
  const minOffset = Math.max(0, buffer.length - 66000);
  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  return -1;
}

function readZipEntryContent(buffer, localHeaderOffset, method, compressedSize) {
  if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
    throw new Error(`Invalid ZIP local header at ${localHeaderOffset}.`);
  }
  const fileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
  const extraLength = buffer.readUInt16LE(localHeaderOffset + 28);
  const dataStart = localHeaderOffset + 30 + fileNameLength + extraLength;
  const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
  if (method === 0) return compressed;
  if (method === 8) return inflateRawSync(compressed);
  throw new Error(`Unsupported ZIP compression method ${method}.`);
}

function readZipJson(zip, path, check) {
  const entry = zip.entries.get(path);
  check(Boolean(entry), `zip JSON exists ${path}`);
  if (!entry) return null;
  try {
    return JSON.parse(entry.content.toString("utf8"));
  } catch (error) {
    check(false, `zip JSON parses ${path}`, { error: error.message });
    return null;
  }
}

function readJsonFile(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    failFast(`Could not read JSON report ${path}: ${error.message}`);
  }
}

function readLatestHistoryReport(historyDir) {
  if (!existsSync(historyDir)) return null;
  let files = [];
  try {
    files = readdirSync(historyDir)
      .filter((file) => /^sam3-spine-\d{4}-\d{2}-\d{2}T/.test(file) && file.endsWith(".json"))
      .sort();
  } catch {
    return null;
  }
  const latest = files.at(-1);
  if (!latest) return null;
  const path = join(historyDir, latest);
  const data = readJsonFile(path);
  data.historyPath = path;
  return data;
}

function writeHistorySnapshot(historyDir, report) {
  mkdirSync(historyDir, { recursive: true });
  const safeTimestamp = report.checkedAt.replace(/[:.]/g, "-");
  const fileName = `sam3-spine-${safeTimestamp}.json`;
  const snapshotPath = join(historyDir, fileName);
  const indexPath = join(historyDir, "index.json");
  const snapshot = compactHistoryReport(report);
  writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);

  let index = {
    schema: "lingji-forge.sam3-spine-regression-history-index.v1",
    latest: null,
    entries: [],
  };
  if (existsSync(indexPath)) {
    try {
      const existing = JSON.parse(readFileSync(indexPath, "utf8"));
      if (existing && Array.isArray(existing.entries)) index = existing;
    } catch {
      index = { ...index, entries: [] };
    }
  }
  index.latest = fileName;
  index.entries = [
    ...index.entries.filter((entry) => entry.path !== fileName),
    {
      checkedAt: report.checkedAt,
      path: fileName,
      ok: report.ok,
      workerUrl: report.workerUrl,
      packs: report.summary?.packs ?? 0,
      pass: report.summary?.pass ?? 0,
      fail: report.summary?.fail ?? 0,
      warn: report.summary?.warn ?? 0,
    },
  ]
    .sort((left, right) => String(left.checkedAt).localeCompare(String(right.checkedAt)))
    .slice(-100);
  writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
  return { snapshotPath, indexPath };
}

function compactHistoryReport(report) {
  return {
    schema: "lingji-forge.sam3-spine-regression-history.v1",
    ok: report.ok,
    workerUrl: report.workerUrl,
    checkedAt: report.checkedAt,
    minScore: report.minScore,
    minPacks: report.minPacks,
    summary: report.summary,
    packs: (report.packs || []).map((pack) => ({
      packId: pack.packId,
      ok: pack.ok,
      metrics: pack.metrics || {},
      warnings: pack.warnings || [],
      failures: pack.failures || [],
      preview: compactPreviewSnapshot(pack.preview),
    })),
  };
}

function compactPreviewSnapshot(preview) {
  if (!preview) return null;
  return {
    quality: preview.quality || null,
    cleanup: preview.cleanup || null,
    parts: (preview.parts || []).map((part) => ({
      name: part.name,
      label: part.label,
      original: compactPreviewPayload(part.original),
      cleaned: compactPreviewPayload(part.cleaned),
      quality: part.quality || null,
      cleanup: part.cleanup || null,
    })),
  };
}

function compactPreviewPayload(payload) {
  if (!payload) return null;
  return {
    width: payload.width ?? null,
    height: payload.height ?? null,
    bytes: payload.bytes ?? 0,
    quality: payload.quality || null,
    cleanup: payload.cleanup || null,
    sourceRect: payload.sourceRect || null,
  };
}

function attachBaselineComparison(report, baselineReport, baselineSource) {
  const baselineByPack = new Map(
    (baselineReport.packs || [])
      .filter((pack) => pack?.packId)
      .map((pack) => [pack.packId, pack]),
  );
  const comparison = {
    baselineCheckedAt: baselineReport.checkedAt || null,
    baselineSource,
    matchedPacks: 0,
    missingPacks: [],
  };
  for (const pack of report.packs || []) {
    const baselinePack = baselineByPack.get(pack.packId);
    if (!baselinePack) {
      pack.comparison = {
        available: false,
        reason: "missing baseline pack",
      };
      if (pack.packId) comparison.missingPacks.push(pack.packId);
      continue;
    }
    comparison.matchedPacks += 1;
    pack.comparison = comparePackToBaseline(pack, baselinePack, baselineReport.checkedAt || null);
  }
  report.comparison = comparison;
}

function comparePackToBaseline(pack, baselinePack, baselineCheckedAt) {
  const baselineParts = new Map((baselinePack.preview?.parts || []).map((part) => [part.name, part]));
  const score = numberOrNull(pack.preview?.quality?.score ?? pack.metrics?.previewQualityScore);
  const baselineScore = numberOrNull(baselinePack.preview?.quality?.score ?? baselinePack.metrics?.previewQualityScore);
  const cleanup = pack.preview?.cleanup || pack.metrics?.previewCleanup || {};
  const baselineCleanup = baselinePack.preview?.cleanup || baselinePack.metrics?.previewCleanup || {};
  for (const part of pack.preview?.parts || []) {
    const baselinePart = baselineParts.get(part.name);
    if (!baselinePart) continue;
    part.comparison = {
      originalBytesDelta: deltaNumber(part.original?.bytes, baselinePart.original?.bytes),
      cleanedBytesDelta: deltaNumber(part.cleaned?.bytes, baselinePart.cleaned?.bytes),
      originalBytesChangeRatio: changeRatio(part.original?.bytes, baselinePart.original?.bytes),
      cleanedBytesChangeRatio: changeRatio(part.cleaned?.bytes, baselinePart.cleaned?.bytes),
      cleanedWidthDelta: deltaNumber(part.cleaned?.width, baselinePart.cleaned?.width),
      cleanedHeightDelta: deltaNumber(part.cleaned?.height, baselinePart.cleaned?.height),
    };
  }
  return {
    available: true,
    baselineCheckedAt,
    scoreDelta: deltaNumber(score, baselineScore),
    cleanupActionsDelta: deltaNumber(cleanup.actions, baselineCleanup.actions),
    trimmedPixelsDelta: deltaNumber(cleanup.trimmedPixels, baselineCleanup.trimmedPixels),
    remainingRiskyPairsDelta: deltaNumber(cleanup.remainingRiskyPairs, baselineCleanup.remainingRiskyPairs),
    remainingWarningsDelta: deltaNumber(cleanup.remainingWarnings, baselineCleanup.remainingWarnings),
  };
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function deltaNumber(current, baseline) {
  const currentNumber = numberOrNull(current);
  const baselineNumber = numberOrNull(baseline);
  if (currentNumber === null || baselineNumber === null) return null;
  return currentNumber - baselineNumber;
}

function changeRatio(current, baseline) {
  const currentNumber = numberOrNull(current);
  const baselineNumber = numberOrNull(baseline);
  if (currentNumber === null || baselineNumber === null || baselineNumber <= 0) return null;
  return Math.abs(currentNumber - baselineNumber) / baselineNumber;
}

function resolveDriftThresholds(parsedArgs) {
  const explicit = {
    maxScoreDrop: finiteThreshold(parsedArgs.maxScoreDrop, "--max-score-drop"),
    maxRiskyIncrease: finiteThreshold(parsedArgs.maxRiskyIncrease, "--max-risky-increase"),
    maxWarningsIncrease: finiteThreshold(parsedArgs.maxWarningsIncrease, "--max-warnings-increase"),
    maxTrimmedIncrease: finiteThreshold(parsedArgs.maxTrimmedIncrease, "--max-trimmed-increase"),
    maxPartByteChangeRatio: finiteThreshold(parsedArgs.maxPartByteChangeRatio, "--max-part-byte-change-ratio"),
  };
  const hasExplicit = Object.values(explicit).some((value) => value !== null);
  if (!parsedArgs.failOnDrift && !hasExplicit && !parsedArgs.requireBaseline) {
    return { enabled: false, thresholds: {} };
  }
  const thresholds = {};
  for (const [key, defaultValue] of Object.entries(DEFAULT_DRIFT_THRESHOLDS)) {
    thresholds[key] = explicit[key] !== null
      ? explicit[key]
      : parsedArgs.failOnDrift
        ? defaultValue
        : null;
  }
  return {
    enabled: parsedArgs.failOnDrift || hasExplicit,
    failOnDrift: parsedArgs.failOnDrift,
    thresholds,
  };
}

function finiteThreshold(value, label) {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value < 0) failFast(`${label} must be a non-negative number.`);
  return value;
}

function applyDriftThresholds(report, driftThresholds, requireBaseline) {
  report.drift = {
    enabled: driftThresholds.enabled,
    requireBaseline: Boolean(requireBaseline),
    thresholds: driftThresholds.thresholds || {},
    failures: [],
    warnings: [],
  };
  if (!driftThresholds.enabled && !requireBaseline) return;

  if (!report.comparison) {
    const message = "drift baseline is not available";
    if (requireBaseline) {
      report.drift.failures.push(message);
      addReportFailure(report, "drift-baseline", message);
    } else if (driftThresholds.enabled) {
      report.drift.warnings.push(message);
    }
    return;
  }

  for (const pack of report.packs || []) {
    if (!pack.packId) continue;
    const comparison = pack.comparison;
    if (!comparison?.available) {
      const message = `drift baseline missing for pack ${pack.packId}`;
      report.drift.failures.push(message);
      markPackFailure(report, pack, message);
      continue;
    }
    for (const failure of driftFailuresForPack(pack, driftThresholds.thresholds || {})) {
      report.drift.failures.push(failure);
      markPackFailure(report, pack, failure);
    }
  }
}

function driftFailuresForPack(pack, thresholds) {
  const failures = [];
  const comparison = pack.comparison || {};
  if (thresholdSet(thresholds.maxScoreDrop) && comparison.scoreDelta !== null && comparison.scoreDelta < -thresholds.maxScoreDrop) {
    failures.push(`drift score dropped ${formatSignedNumber(comparison.scoreDelta)} below max drop ${thresholds.maxScoreDrop}`);
  }
  if (thresholdSet(thresholds.maxRiskyIncrease) && comparison.remainingRiskyPairsDelta !== null && comparison.remainingRiskyPairsDelta > thresholds.maxRiskyIncrease) {
    failures.push(`drift risky pairs increased ${formatSignedNumber(comparison.remainingRiskyPairsDelta)} above max ${thresholds.maxRiskyIncrease}`);
  }
  if (thresholdSet(thresholds.maxWarningsIncrease) && comparison.remainingWarningsDelta !== null && comparison.remainingWarningsDelta > thresholds.maxWarningsIncrease) {
    failures.push(`drift cleanup warnings increased ${formatSignedNumber(comparison.remainingWarningsDelta)} above max ${thresholds.maxWarningsIncrease}`);
  }
  if (thresholdSet(thresholds.maxTrimmedIncrease) && comparison.trimmedPixelsDelta !== null && comparison.trimmedPixelsDelta > thresholds.maxTrimmedIncrease) {
    failures.push(`drift trimmed pixels increased ${formatSignedNumber(comparison.trimmedPixelsDelta)} above max ${thresholds.maxTrimmedIncrease}`);
  }
  if (thresholdSet(thresholds.maxPartByteChangeRatio)) {
    for (const part of pack.preview?.parts || []) {
      const partComparison = part.comparison || {};
      const originalRatio = partComparison.originalBytesChangeRatio;
      const cleanedRatio = partComparison.cleanedBytesChangeRatio;
      if (originalRatio !== null && originalRatio > thresholds.maxPartByteChangeRatio) {
        failures.push(`drift ${part.name} original bytes changed ${formatPercent(originalRatio)} above max ${formatPercent(thresholds.maxPartByteChangeRatio)}`);
      }
      if (cleanedRatio !== null && cleanedRatio > thresholds.maxPartByteChangeRatio) {
        failures.push(`drift ${part.name} cleaned bytes changed ${formatPercent(cleanedRatio)} above max ${formatPercent(thresholds.maxPartByteChangeRatio)}`);
      }
    }
  }
  return failures;
}

function thresholdSet(value) {
  return Number.isFinite(Number(value));
}

function markPackFailure(report, pack, message) {
  if (!pack.failures.includes(message)) pack.failures.push(message);
  if (pack.ok) {
    pack.ok = false;
    report.summary.pass = Math.max(0, report.summary.pass - 1);
    report.summary.fail += 1;
  }
  report.ok = false;
}

function addReportFailure(report, label, message) {
  report.packs.push({
    packId: null,
    ok: false,
    checks: [],
    warnings: [],
    failures: [message],
    metrics: {},
    label,
  });
  report.summary.fail += 1;
  report.ok = false;
}

function renderHtmlReport(report) {
  const packsHtml = report.packs.map((pack) => renderHtmlPack(pack)).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SAM3 Spine Visual QA</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f2e8;
      --panel: #fffaf0;
      --ink: #211912;
      --muted: #6b5b4b;
      --line: #d9c8aa;
      --pass: #1d7d45;
      --warn: #9b6414;
      --fail: #a9372a;
      --chip: #efe2c8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font: 14px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      max-width: 1280px;
      margin: 0 auto;
      padding: 32px 20px 48px;
    }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 30px; line-height: 1.15; }
    h2 { font-size: 19px; line-height: 1.25; }
    h3 { font-size: 13px; line-height: 1.25; }
    .hero, .pack {
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 8px;
    }
    .hero {
      padding: 20px;
      margin-bottom: 18px;
    }
    .meta, .chips, .part-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .meta {
      margin-top: 12px;
      color: var(--muted);
    }
    .chip {
      border: 1px solid var(--line);
      background: var(--chip);
      border-radius: 999px;
      padding: 5px 10px;
      color: var(--ink);
      font-size: 12px;
      white-space: nowrap;
    }
    .chip.pass { color: var(--pass); }
    .chip.warn { color: var(--warn); }
    .chip.fail { color: var(--fail); }
    .delta {
      font-weight: 700;
    }
    .delta.positive { color: var(--warn); }
    .delta.negative { color: var(--pass); }
    .delta.neutral { color: var(--muted); }
    .pack {
      padding: 18px;
      margin-top: 16px;
    }
    .pack-head {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 14px;
    }
    .pack-title {
      display: grid;
      gap: 5px;
    }
    code {
      font: 12px/1.4 "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      color: var(--muted);
      overflow-wrap: anywhere;
    }
    .status {
      min-width: 68px;
      text-align: center;
      border-radius: 999px;
      padding: 6px 11px;
      font-weight: 700;
      font-size: 12px;
      border: 1px solid currentColor;
    }
    .status.pass { color: var(--pass); }
    .status.fail { color: var(--fail); }
    .issues {
      margin: 12px 0;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: #fff6df;
    }
    .issues.failures { background: #fff0ec; border-color: #e0ada5; }
    .issues ul {
      margin: 7px 0 0;
      padding-left: 18px;
    }
    .part-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
      margin-top: 14px;
    }
    .part-card {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fffdf7;
      padding: 10px;
      display: grid;
      gap: 10px;
    }
    .part-card-head {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: center;
    }
    .thumbs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .thumb {
      display: grid;
      gap: 6px;
    }
    .thumb-label {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      color: var(--muted);
      font-size: 12px;
    }
    .image-box {
      min-height: 118px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background:
        linear-gradient(45deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%),
        linear-gradient(-45deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, rgba(0, 0, 0, 0.05) 75%),
        linear-gradient(-45deg, transparent 75%, rgba(0, 0, 0, 0.05) 75%);
      background-size: 18px 18px;
      background-position: 0 0, 0 9px, 9px -9px, -9px 0;
      display: grid;
      place-items: center;
      overflow: hidden;
    }
    img {
      display: block;
      max-width: 100%;
      max-height: 160px;
      object-fit: contain;
      image-rendering: pixelated;
    }
    .missing {
      color: var(--muted);
      font-size: 12px;
    }
    .part-meta {
      color: var(--muted);
      font-size: 12px;
    }
    .no-preview {
      border: 1px dashed var(--line);
      border-radius: 8px;
      color: var(--muted);
      padding: 18px;
      margin-top: 12px;
    }
    @media (max-width: 680px) {
      main { padding: 20px 12px 32px; }
      .pack-head { display: grid; }
      .thumbs { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <h1>SAM3 Spine Visual QA</h1>
      <div class="meta">
        <span class="chip ${report.ok ? "pass" : "fail"}">${report.ok ? "PASS" : "FAIL"}</span>
        <span class="chip">checked ${htmlEscape(report.checkedAt)}</span>
        <span class="chip">packs ${metricValue(report.summary?.packs)}</span>
        <span class="chip">pass ${metricValue(report.summary?.pass)}</span>
        <span class="chip">fail ${metricValue(report.summary?.fail)}</span>
        <span class="chip">warnings ${metricValue(report.summary?.warn)}</span>
        <span class="chip">min score ${metricValue(report.minScore)}</span>
      </div>
      <div class="meta">
        <code>${htmlEscape(report.workerUrl)}</code>
      </div>
      ${renderComparisonMeta(report)}
      ${renderDriftMeta(report)}
    </section>
    ${packsHtml}
  </main>
</body>
</html>
`;
}

function renderHtmlPack(pack) {
  const preview = pack.preview || null;
  const quality = preview?.quality || null;
  const cleanup = preview?.cleanup || pack.metrics?.previewCleanup || null;
  const comparison = pack.comparison || null;
  const partsHtml = (preview?.parts || []).map((part) => renderHtmlPart(part)).join("\n");
  return `<section class="pack">
  <div class="pack-head">
    <div class="pack-title">
      <h2>${htmlEscape(pack.packId || "Pack count check")}</h2>
      <code>${htmlEscape(pack.packId || "no-pack-id")}</code>
    </div>
    <div class="status ${pack.ok ? "pass" : "fail"}">${pack.ok ? "PASS" : "FAIL"}</div>
  </div>
  <div class="chips">
    ${renderMetricChip("preview", statusScore(quality?.status || pack.metrics?.previewQualityStatus, quality?.score ?? pack.metrics?.previewQualityScore), quality?.status || pack.metrics?.previewQualityStatus)}
    ${renderMetricChip("parts", metricValue(pack.metrics?.previewParts))}
    ${renderMetricChip("cleanup actions", metricValue(cleanup?.actions))}
    ${renderMetricChip("trimmed", metricValue(cleanup?.trimmedPixels))}
    ${renderMetricChip("risky left", metricValue(cleanup?.remainingRiskyPairs))}
    ${renderMetricChip("zip", statusScore(pack.metrics?.zipQualityStatus, pack.metrics?.zipQualityScore), pack.metrics?.zipQualityStatus)}
    ${renderMetricChip("zip entries", metricValue(pack.metrics?.zipEntries))}
    ${comparison?.available ? renderMetricChip("score d", formatSignedNumber(comparison.scoreDelta)) : ""}
    ${comparison?.available ? renderMetricChip("trimmed d", formatSignedNumber(comparison.trimmedPixelsDelta)) : ""}
    ${comparison?.available ? renderMetricChip("risky d", formatSignedNumber(comparison.remainingRiskyPairsDelta)) : ""}
    ${comparison && !comparison.available ? renderMetricChip("baseline", comparison.reason || "missing") : ""}
  </div>
  ${renderIssueList("failures", pack.failures)}
  ${renderIssueList("warnings", pack.warnings)}
  ${partsHtml ? `<div class="part-grid">${partsHtml}</div>` : `<div class="no-preview">No visual preview data was captured for this pack.</div>`}
</section>`;
}

function renderHtmlPart(part) {
  const original = part.original || null;
  const cleaned = part.cleaned || null;
  const comparison = part.comparison || {};
  const delta = Number.isFinite(cleaned?.bytes) && Number.isFinite(original?.bytes)
    ? cleaned.bytes - original.bytes
    : null;
  return `<article class="part-card">
  <div class="part-card-head">
    <h3>${htmlEscape(part.label || part.name)}</h3>
    <code>${htmlEscape(part.name)}</code>
  </div>
  <div class="thumbs">
    ${renderHtmlThumb("Original", original)}
    ${renderHtmlThumb("Cleaned", cleaned)}
  </div>
  <div class="part-meta">
    <span>${htmlEscape(sizeText(cleaned || original))}</span>
    <span>delta ${htmlEscape(formatByteDelta(delta))}</span>
    <span class="delta ${deltaClass(comparison.originalBytesDelta)}">orig d ${htmlEscape(formatByteDelta(comparison.originalBytesDelta))}</span>
    <span class="delta ${deltaClass(comparison.cleanedBytesDelta)}">clean d ${htmlEscape(formatByteDelta(comparison.cleanedBytesDelta))}</span>
    <span>rect ${htmlEscape(rectText((cleaned || original)?.sourceRect))}</span>
  </div>
</article>`;
}

function renderComparisonMeta(report) {
  const comparison = report.comparison;
  if (!comparison) return "";
  const baseline = comparison.baselineCheckedAt || "unknown";
  const source = comparison.baselineSource || "history";
  return `<div class="meta">
    <span class="chip">baseline ${htmlEscape(baseline)}</span>
    <span class="chip">matched ${metricValue(comparison.matchedPacks)}</span>
    <code>${htmlEscape(source)}</code>
  </div>`;
}

function renderDriftMeta(report) {
  const drift = report.drift;
  if (!drift || (!drift.enabled && !drift.requireBaseline)) return "";
  const status = drift.failures?.length ? "FAIL" : "PASS";
  return `<div class="meta">
    <span class="chip ${status === "PASS" ? "pass" : "fail"}">drift ${status}</span>
    <span class="chip">drift failures ${metricValue(drift.failures?.length || 0)}</span>
    <span class="chip">score drop ${metricValue(drift.thresholds?.maxScoreDrop)}</span>
    <span class="chip">risky inc ${metricValue(drift.thresholds?.maxRiskyIncrease)}</span>
    <span class="chip">part ratio ${metricValue(drift.thresholds?.maxPartByteChangeRatio)}</span>
  </div>`;
}

function renderHtmlThumb(label, payload) {
  return `<div class="thumb">
  <div class="thumb-label">
    <span>${htmlEscape(label)}</span>
    <span>${htmlEscape(formatBytes(payload?.bytes))}</span>
  </div>
  <div class="image-box">
    ${payload?.dataUrl ? `<img src="${htmlAttr(payload.dataUrl)}" alt="${htmlAttr(label)} preview" loading="lazy">` : `<span class="missing">missing</span>`}
  </div>
</div>`;
}

function renderMetricChip(label, value, status = null) {
  const statusClass = status === "pass" ? "pass" : status === "warn" ? "warn" : status === "fail" ? "fail" : "";
  return `<span class="chip ${statusClass}">${htmlEscape(label)} ${htmlEscape(value)}</span>`;
}

function renderIssueList(kind, issues) {
  if (!Array.isArray(issues) || issues.length === 0) return "";
  const items = issues.map((issue) => `<li>${htmlEscape(issueText(issue))}</li>`).join("");
  return `<div class="issues ${htmlAttr(kind)}"><h3>${htmlEscape(kind)}</h3><ul>${items}</ul></div>`;
}

function issueText(issue) {
  if (typeof issue === "string") return issue;
  if (!issue || typeof issue !== "object") return String(issue);
  const detailEntries = Object.entries(issue)
    .filter(([key]) => key !== "label")
    .filter(([, value]) => value !== undefined);
  if (detailEntries.length === 0) return issue.label || JSON.stringify(issue);
  const details = detailEntries
    .map(([key, value]) => `${key}=${shortJson(value)}`)
    .join(", ");
  return `${issue.label || "issue"} (${details})`;
}

function shortJson(value) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function statusScore(status, score) {
  const statusText = status || "n/a";
  if (!Number.isFinite(Number(score))) return statusText;
  return `${statusText} ${Number(score)}/100`;
}

function metricValue(value) {
  return value === null || value === undefined || value === "" ? "n/a" : String(value);
}

function sizeText(payload) {
  if (!payload) return "size n/a";
  const width = Number.isFinite(payload.width) ? payload.width : "n/a";
  const height = Number.isFinite(payload.height) ? payload.height : "n/a";
  return `${width}x${height}`;
}

function rectText(rect) {
  if (!rect || typeof rect !== "object") return "n/a";
  const x = Number.isFinite(Number(rect.x)) ? Number(rect.x) : 0;
  const y = Number.isFinite(Number(rect.y)) ? Number(rect.y) : 0;
  const width = Number.isFinite(Number(rect.width)) ? Number(rect.width) : 0;
  const height = Number.isFinite(Number(rect.height)) ? Number(rect.height) : 0;
  return `${x},${y} ${width}x${height}`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(Number(bytes))) return "n/a";
  const value = Number(bytes);
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}

function formatByteDelta(delta) {
  if (!Number.isFinite(delta)) return "n/a";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${formatBytes(Math.abs(delta))}`;
}

function formatPercent(value) {
  if (!Number.isFinite(Number(value))) return "n/a";
  return `${Math.round(Number(value) * 1000) / 10}%`;
}

function formatSignedNumber(value) {
  if (!Number.isFinite(Number(value))) return "n/a";
  const number = Number(value);
  const sign = number > 0 ? "+" : "";
  return `${sign}${number}`;
}

function deltaClass(value) {
  if (!Number.isFinite(Number(value)) || Number(value) === 0) return "neutral";
  return Number(value) > 0 ? "positive" : "negative";
}

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function htmlAttr(value) {
  return htmlEscape(value);
}

function printReport(report, asJson) {
  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(`SAM3 Spine regression: ${report.ok ? "PASS" : "FAIL"}`);
  console.log(`Worker: ${report.workerUrl}`);
  console.log(`Packs checked: ${report.summary.packs}, pass: ${report.summary.pass}, fail: ${report.summary.fail}, warnings: ${report.summary.warn}`);
  if (report.discovery.attempted) {
    console.log(`Discovered SAM3 packs: ${report.discovery.availableSam3Packs}`);
  }
  if (report.comparison) {
    console.log(`Baseline: ${report.comparison.baselineCheckedAt || "unknown"} (${report.comparison.matchedPacks} matched)`);
  }
  if (report.drift && (report.drift.enabled || report.drift.requireBaseline)) {
    console.log(`Drift gate: ${report.drift.failures.length === 0 ? "PASS" : "FAIL"} (${report.drift.failures.length} failures)`);
  }
  if (report.history?.snapshotPath) {
    console.log(`History: ${report.history.snapshotPath}`);
  }
  for (const pack of report.packs) {
    console.log("");
    console.log(`${pack.ok ? "PASS" : "FAIL"} ${pack.packId || "pack-count"}`);
    if (pack.metrics?.previewQualityStatus) {
      console.log(`  preview: ${pack.metrics.previewQualityStatus} ${pack.metrics.previewQualityScore}/100, parts=${pack.metrics.previewParts}`);
    }
    if (pack.metrics?.zipQualityStatus) {
      console.log(`  zip: ${pack.metrics.zipQualityStatus} ${pack.metrics.zipQualityScore}/100, entries=${pack.metrics.zipEntries}`);
    }
    if (pack.metrics?.previewCleanup) {
      console.log(`  cleanup: actions=${pack.metrics.previewCleanup.actions}, trimmed=${pack.metrics.previewCleanup.trimmedPixels}, remainingRiskyPairs=${pack.metrics.previewCleanup.remainingRiskyPairs}`);
    }
    if (pack.comparison?.available) {
      console.log(`  delta: score=${formatSignedNumber(pack.comparison.scoreDelta)}, trimmed=${formatSignedNumber(pack.comparison.trimmedPixelsDelta)}, risky=${formatSignedNumber(pack.comparison.remainingRiskyPairsDelta)}`);
    } else if (pack.comparison) {
      console.log(`  delta: ${pack.comparison.reason || "no baseline"}`);
    }
    for (const warning of pack.warnings) {
      console.log(`  WARN ${warning.label}`);
    }
    for (const failure of pack.failures) {
      console.log(`  FAIL ${failure}`);
    }
  }
}

function failFast(message) {
  console.error(message);
  process.exit(2);
}
