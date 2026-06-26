// storage —— 从 worker.js 拆出的模块（纯机械抽取，逻辑不变）。
import { USAGE_COSTS, buildComfyViewUrl, contentTypeForResult, fetchComfyResponse, frameStatusCounts, layerIdFromFilename, packFrameZipName, packStatusFromCounts, safeString } from "../worker.js";

export async function rememberJobRecord(env, record) {
  if (!env.ASSET_BUCKET) return null;
  try {
    return await putJobRecord(env, record);
  } catch (error) {
    console.warn("R2 job log failed", error);
    return null;
  }
}

export async function patchJobRecordQuietly(env, promptId, patch) {
  if (!env.ASSET_BUCKET) return null;
  try {
    const updated = await patchJobRecord(env, promptId, patch);
    if (updated?.packId) await refreshPackRecordQuietly(env, updated.packId);
    return updated;
  } catch (error) {
    console.warn("R2 job update failed", error);
    return null;
  }
}

export async function rememberPackRecord(env, record) {
  if (!env.ASSET_BUCKET) return null;
  try {
    return await putPackRecord(env, record);
  } catch (error) {
    console.warn("R2 pack log failed", error);
    return null;
  }
}

async function refreshPackRecordQuietly(env, packId) {
  if (!env.ASSET_BUCKET || !packId) return null;
  try {
    return await refreshPackRecord(env, packId);
  } catch (error) {
    console.warn("R2 pack update failed", error);
    return null;
  }
}

async function putJobRecord(env, record) {
  if (!env.ASSET_BUCKET || !record?.promptId) return null;
  const now = new Date().toISOString();
  const existing = await readJobRecord(env, record.promptId);
  const kind = safeString(record.kind || existing?.kind, "2d");
  const stored = {
    ...existing,
    ...record,
    id: record.id || existing?.id || `${kind}:${record.promptId}`,
    kind,
    promptId: record.promptId,
    status: record.status || existing?.status || "queued",
    createdAt: existing?.createdAt || record.createdAt || now,
    updatedAt: now,
  };
  await env.ASSET_BUCKET.put(jobRecordKey(record.promptId), JSON.stringify(stored, null, 2), {
    httpMetadata: {
      contentType: "application/json; charset=utf-8",
      cacheControl: "private, max-age=30",
    },
    customMetadata: {
      kind: stored.kind,
      promptId: stored.promptId,
      status: stored.status,
    },
  });
  return stored;
}

async function patchJobRecord(env, promptId, patch = {}) {
  if (!env.ASSET_BUCKET || !promptId) return null;
  const existing = await readJobRecord(env, promptId);
  const kind = safeString(patch.kind || existing?.kind, "2d");
  return await putJobRecord(env, {
    ...existing,
    ...patch,
    id: patch.id || existing?.id || `${kind}:${promptId}`,
    kind,
    promptId,
  });
}

export async function readJobRecord(env, promptId) {
  if (!env.ASSET_BUCKET || !promptId) return null;
  const object = await env.ASSET_BUCKET.get(jobRecordKey(promptId));
  if (!object) return null;
  return JSON.parse(await object.text());
}

export async function listJobs(env, url) {
  if (!env.ASSET_BUCKET) {
    return { ok: true, configured: false, jobs: [] };
  }

  const kind = safeString(url.searchParams.get("kind"), "all");
  const status = safeString(url.searchParams.get("status"), "all");
  const limit = Math.max(1, Math.min(60, Number(url.searchParams.get("limit")) || 24));
  const listed = await env.ASSET_BUCKET.list({ prefix: "library/jobs/", limit: 1000 });
  const objects = listed.objects
    .filter((object) => object.key.endsWith(".json"))
    .sort((a, b) => Number(b.uploaded || 0) - Number(a.uploaded || 0));
  const jobs = [];

  for (const object of objects) {
    if (jobs.length >= limit) break;
    const stored = await env.ASSET_BUCKET.get(object.key);
    if (!stored) continue;
    const job = JSON.parse(await stored.text());
    if (kind !== "all" && job.kind !== kind && job.groupKind !== kind) continue;
    if (status !== "all" && job.status !== status) continue;
    jobs.push(await withSignedJobRecord(env, job));
  }

  return {
    ok: true,
    configured: true,
    jobs,
    nextCursor: listed.truncated ? listed.cursor : null,
  };
}

export async function putPackRecord(env, record) {
  if (!env.ASSET_BUCKET || !record?.packId) return null;
  const now = new Date().toISOString();
  const existing = await readPackRecord(env, record.packId);
  const stored = {
    ...existing,
    ...record,
    id: record.id || existing?.id || `2d-pack:${record.packId}`,
    kind: "2d-pack",
    packId: record.packId,
    status: record.status || existing?.status || "queued",
    createdAt: existing?.createdAt || record.createdAt || now,
    updatedAt: now,
  };
  await env.ASSET_BUCKET.put(packRecordKey(record.packId), JSON.stringify(stored, null, 2), {
    httpMetadata: {
      contentType: "application/json; charset=utf-8",
      cacheControl: "private, max-age=30",
    },
    customMetadata: {
      kind: stored.kind,
      packId: stored.packId,
      status: stored.status,
      preset: safeString(stored.preset || stored.packPreset),
    },
  });
  return stored;
}

export async function readPackRecord(env, packId) {
  if (!env.ASSET_BUCKET || !packId) return null;
  const object = await env.ASSET_BUCKET.get(packRecordKey(packId));
  if (!object) return null;
  return JSON.parse(await object.text());
}

export async function refreshPackRecord(env, packId) {
  const existing = await readPackRecord(env, packId);
  if (!existing) return null;

  const frames = await Promise.all((existing.frames || []).map(async (frame) => {
    const job = await readJobRecord(env, frame.promptId);
    return {
      ...frame,
      status: job?.status || frame.status || "queued",
      updatedAt: job?.updatedAt || frame.updatedAt || existing.updatedAt,
      completedAt: job?.completedAt || frame.completedAt || null,
      result: job?.result || frame.result || null,
      rawStatus: job?.rawStatus || frame.rawStatus || null,
    };
  }));
  const counts = frameStatusCounts(frames);
  const now = new Date().toISOString();
  const terminal = counts.complete + counts.failed >= counts.total && counts.total > 0;
  const status = packStatusFromCounts(counts);
  return await putPackRecord(env, {
    ...existing,
    status,
    counts,
    frames,
    completedAt: terminal ? existing.completedAt || now : existing.completedAt || null,
    updatedAt: now,
  });
}

export async function listPacks(env, url) {
  if (!env.ASSET_BUCKET) {
    return { ok: true, configured: false, packs: [] };
  }

  const preset = safeString(url.searchParams.get("preset"), "all");
  const status = safeString(url.searchParams.get("status"), "all");
  const limit = Math.max(1, Math.min(40, Number(url.searchParams.get("limit")) || 12));
  const listed = await env.ASSET_BUCKET.list({ prefix: "library/packs/", limit: 1000 });
  const objects = listed.objects
    .filter((object) => object.key.endsWith(".json"))
    .sort((a, b) => Number(b.uploaded || 0) - Number(a.uploaded || 0));
  const packs = [];
  const layerJobsByPack = await latestLayerSeparationJobsByPack(env);

  for (const object of objects) {
    if (packs.length >= limit) break;
    const stored = await env.ASSET_BUCKET.get(object.key);
    if (!stored) continue;
    const pack = JSON.parse(await stored.text());
    if (preset !== "all" && pack.preset !== preset) continue;
    if (status !== "all" && pack.status !== status) continue;
    packs.push(await withSignedPackRecord(env, pack, { layerJobsByPack }));
  }

  return {
    ok: true,
    configured: true,
    packs,
    nextCursor: listed.truncated ? listed.cursor : null,
  };
}

export async function getPack(packId, env) {
  const pack = await readPackRecord(env, packId);
  if (!pack) {
    const error = new Error("Pack not found.");
    error.status = 404;
    error.code = "not_found";
    throw error;
  }
  const refreshed = await refreshPackRecord(env, packId).catch((error) => {
    console.warn("R2 pack refresh failed", error);
    return pack;
  });
  return {
    ok: true,
    configured: true,
    pack: await withSignedPackRecord(env, refreshed || pack),
  };
}

export async function readPackCompletedFrameFiles(env, pack) {
  const completedFrameFiles = [];
  for (const [index, frame] of (pack.frames || []).entries()) {
    const fileKey = frame.result?.fileKey;
    if (!fileKey || invalidLibraryFileKey(fileKey)) continue;
    const object = await env.ASSET_BUCKET.get(fileKey);
    if (!object) continue;
    const bytes = new Uint8Array(await object.arrayBuffer());
    completedFrameFiles.push({
      frame,
      index,
      path: `frames/original/${packFrameZipName(frame, index)}`,
      bytes,
    });
  }
  return completedFrameFiles;
}

async function latestLayerSeparationJobsByPack(env) {
  const byPack = new Map();
  if (!env.ASSET_BUCKET) return byPack;
  const listed = await env.ASSET_BUCKET.list({ prefix: "library/jobs/", limit: 1000 });
  for (const object of listed.objects || []) {
    if (!object.key.endsWith(".json")) continue;
    const stored = await env.ASSET_BUCKET.get(object.key);
    if (!stored) continue;
    const job = JSON.parse(await stored.text());
    if (job.kind !== "layer-separation") continue;
    if (!job.packId) continue;
    if (job.status !== "complete") continue;
    if (!Array.isArray(job.result?.files) || job.result.files.length === 0) continue;
    const current = byPack.get(job.packId);
    const currentTime = Date.parse(current?.completedAt || current?.updatedAt || current?.createdAt || 0);
    const jobTime = Date.parse(job.completedAt || job.updatedAt || job.createdAt || 0);
    if (!current || jobTime >= currentTime) byPack.set(job.packId, job);
  }
  return byPack;
}

export async function latestPackLayerSeparationJob(env, packId) {
  if (!packId) return null;
  const byPack = await latestLayerSeparationJobsByPack(env);
  return byPack.get(packId) || null;
}

export async function sourceImageForLayerJob(env, job, frameFiles) {
  const matchingFrame = frameFiles.find((file) => file.frame?.id === job.frameId || file.frame?.promptId === job.frameId);
  if (matchingFrame) return matchingFrame;
  const sourceKey = safeString(job.sourceFileKey);
  if (sourceKey && !invalidLibraryFileKey(sourceKey)) {
    const object = await env.ASSET_BUCKET.get(sourceKey);
    if (object) {
      return {
        path: sourceKey,
        bytes: new Uint8Array(await object.arrayBuffer()),
      };
    }
  }
  return frameFiles[0] || null;
}

export async function readLayerSeparationMasks(env, job) {
  const masks = [];
  for (const file of job.result.files || []) {
    const fileKey = safeString(file.fileKey);
    if (!fileKey || invalidLibraryFileKey(fileKey)) continue;
    const object = await env.ASSET_BUCKET.get(fileKey);
    if (!object) continue;
    const bytes = new Uint8Array(await object.arrayBuffer());
    masks.push({
      layerId: safeLibrarySegment(file.layerId || layerIdFromFilename(file.filename)),
      label: safeString(file.label, spineLayerLabel(file.layerId)),
      filename: file.filename,
      fileKey,
      bytes,
      image: await decodePngRgba(bytes),
    });
  }
  const order = new Map(SPINE_LAYER_PROMPTS.map((item, index) => [item.id, index]));
  masks.sort((a, b) => (order.get(a.layerId) ?? 999) - (order.get(b.layerId) ?? 999));
  return masks;
}

export async function rememberPackFrameJobRecord(env, { job, normalized, preset, packId, packReference, rerunOfPromptId = null }) {
  return await rememberJobRecord(env, {
    id: `2d-pack:${job.promptId}`,
    kind: "2d",
    groupKind: "2d-pack",
    status: "queued",
    promptId: job.promptId,
    clientId: job.clientId,
    seed: job.seed,
    dimensions: job.dimensions,
    input: normalized,
    plan: job.plan,
    cost: USAGE_COSTS.generate2dPackFrame,
    packId,
    packPreset: normalized.preset,
    packKind: preset.kind,
    frameId: job.id,
    frameLabel: job.label,
    frameIndex: job.index,
    frameRow: job.row,
    frameColumn: job.column,
    reference: packReference,
    rerunOfPromptId,
    pollUrl: job.pollUrl,
  });
}

export async function signedLayerResultFiles(env, files, archived) {
  const archivedFiles = new Map((archived?.files || []).map((file) => [file.filename, file]));
  return await Promise.all((files || []).map(async (file) => {
    const archivedFile = archivedFiles.get(file.filename);
    return {
      ...file,
      url: archivedFile?.url || buildComfyViewUrl(file),
      comfyUrl: buildComfyViewUrl(file),
      fileKey: archivedFile?.fileKey || null,
      libraryId: archived?.id || null,
      contentType: archivedFile?.contentType || contentTypeForResult(file),
      bytes: archivedFile?.bytes || null,
    };
  }));
}

export async function archiveResultSet(env, { promptId, kind, results, entry }) {
  if (!env.ASSET_BUCKET) return null;

  const itemKey = libraryItemKey(kind, promptId);
  const existing = await env.ASSET_BUCKET.get(itemKey);
  if (existing) return await withSignedLibraryItem(env, JSON.parse(await existing.text()));

  const files = [];
  for (const result of results || []) {
    const response = await fetchComfyResponse(env, result);
    if (!response.ok || !response.body) {
      throw new Error(`Comfy archive source failed: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || contentTypeForResult(result);
    const contentLength = Number(response.headers.get("content-length") || 0) || null;
    const fileKey = libraryFileKey(kind, promptId, result.filename);
    await env.ASSET_BUCKET.put(fileKey, response.body, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        kind,
        promptId,
        filename: result.filename,
        layerId: result.layerId || "",
      },
    });
    files.push({
      ...result,
      contentType,
      bytes: contentLength,
      fileKey,
      comfyUrl: buildComfyViewUrl(result),
    });
  }

  const item = {
    id: `${kind}:${promptId}`,
    kind,
    promptId,
    createdAt: new Date().toISOString(),
    status: entry.status?.status_str || "success",
    filename: files[0]?.filename || null,
    subfolder: files[0]?.subfolder || "",
    type: files[0]?.type || "output",
    contentType: files[0]?.contentType || "image/png",
    bytes: files.reduce((sum, file) => sum + (file.bytes || 0), 0) || null,
    fileKey: files[0]?.fileKey || null,
    comfyUrl: files[0]?.comfyUrl || null,
    files,
  };

  await env.ASSET_BUCKET.put(itemKey, JSON.stringify(item, null, 2), {
    httpMetadata: {
      contentType: "application/json; charset=utf-8",
      cacheControl: "private, max-age=60",
    },
    customMetadata: {
      kind,
      promptId,
      filename: item.filename || "",
    },
  });
  return await withSignedLibraryItem(env, item);
}

export async function archiveResult(env, { promptId, kind, result, entry }) {
  if (!env.ASSET_BUCKET) return null;

  const itemKey = libraryItemKey(kind, promptId);
  const existing = await env.ASSET_BUCKET.get(itemKey);
  if (existing) return await withSignedLibraryItem(env, JSON.parse(await existing.text()));

  const response = await fetchComfyResponse(env, result);
  if (!response.ok || !response.body) {
    throw new Error(`Comfy archive source failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || contentTypeForResult(result);
  const contentLength = Number(response.headers.get("content-length") || 0) || null;
  const fileKey = libraryFileKey(kind, promptId, result.filename);
  const createdAt = new Date().toISOString();
  await env.ASSET_BUCKET.put(fileKey, response.body, {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      kind,
      promptId,
      filename: result.filename,
    },
  });

  const item = {
    id: `${kind}:${promptId}`,
    kind,
    promptId,
    createdAt,
    status: entry.status?.status_str || "success",
    filename: result.filename,
    subfolder: result.subfolder || "",
    type: result.type || "output",
    contentType,
    bytes: contentLength,
    fileKey,
    comfyUrl: buildComfyViewUrl(result),
  };

  await env.ASSET_BUCKET.put(itemKey, JSON.stringify(item, null, 2), {
    httpMetadata: {
      contentType: "application/json; charset=utf-8",
      cacheControl: "private, max-age=60",
    },
    customMetadata: {
      kind,
      promptId,
      filename: result.filename,
    },
  });
  return await withSignedLibraryItem(env, item);
}

export async function listLibrary(env, url) {
  if (!env.ASSET_BUCKET) {
    return { ok: true, configured: false, items: [] };
  }

  const kind = safeString(url.searchParams.get("kind"), "all");
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit")) || 48));
  const listed = await env.ASSET_BUCKET.list({ prefix: "library/items/", limit: 1000 });
  const objects = listed.objects
    .filter((object) => object.key.endsWith(".json"))
    .sort((a, b) => Number(b.uploaded || 0) - Number(a.uploaded || 0));
  const items = [];

  for (const object of objects) {
    if (items.length >= limit) break;
    const stored = await env.ASSET_BUCKET.get(object.key);
    if (!stored) continue;
    const item = JSON.parse(await stored.text());
    if (kind !== "all" && item.kind !== kind) continue;
    items.push(await withSignedLibraryItem(env, item));
  }

  return {
    ok: true,
    configured: true,
    items,
    nextCursor: listed.truncated ? listed.cursor : null,
  };
}

async function withSignedLibraryItem(env, item) {
  const files = item.files
    ? await Promise.all(item.files.map(async (file) => ({
        ...file,
        url: file.fileKey ? await buildSignedLibraryViewUrl(env, file.fileKey) : file.url || null,
      })))
    : null;
  return {
    ...item,
    ...(files ? { files } : {}),
    url: item.fileKey ? await buildSignedLibraryViewUrl(env, item.fileKey) : files?.[0]?.url || null,
  };
}

async function withSignedJobRecord(env, job) {
  if (!job?.result) return job;
  const result = { ...job.result };
  if (Array.isArray(result.files)) {
    result.files = await Promise.all(result.files.map(async (file) => ({
      ...file,
      url: file.fileKey ? await buildSignedLibraryViewUrl(env, file.fileKey) : file.url || file.comfyUrl || null,
    })));
  }
  if (result.fileKey) {
    result.url = await buildSignedLibraryViewUrl(env, result.fileKey);
  } else if (result.files?.[0]?.url) {
    result.url = result.files[0].url;
  } else if (result.comfyUrl) {
    result.url = result.comfyUrl;
  }
  return {
    ...job,
    result,
  };
}

export async function withSignedPackRecord(env, pack, options = {}) {
  const frames = await Promise.all((pack.frames || []).map(async (frame) => {
    if (!frame.result) return frame;
    const signed = await withSignedJobRecord(env, { result: frame.result });
    return {
      ...frame,
      result: signed.result,
    };
  }));
  const cover = frames.find((frame) => frame.result?.url)?.result || null;
  const layerJob = options.layerJobsByPack?.get?.(pack.packId)
    || await latestPackLayerSeparationJob(env, pack.packId).catch((error) => {
      console.warn("Layer-separation pack metadata lookup failed", error);
      return null;
    });
  return {
    ...pack,
    frames,
    cover,
    spineSam3Layers: packSpineSam3LayerSummary(layerJob),
  };
}

export async function buildSignedLibraryViewUrl(env, key, ttlSeconds = 86_400) {
  const params = new URLSearchParams();
  params.set("key", key);
  const secret = libraryViewSecret(env);
  if (secret) {
    const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
    params.set("exp", String(exp));
    params.set("sig", await signLibraryViewKey(secret, key, exp));
  }
  return `/api/library/view?${params.toString()}`;
}

export function libraryViewSecret(env) {
  return safeString(env.LIBRARY_VIEW_SECRET || env.GENERATOR_ACCESS_TOKEN);
}

export async function signLibraryViewKey(secret, key, exp) {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(`${key}.${exp}`));
  return base64UrlEncode(new Uint8Array(signature));
}

function libraryItemKey(kind, promptId) {
  return `library/items/${safeLibrarySegment(kind)}-${safeLibrarySegment(promptId)}.json`;
}

function jobRecordKey(promptId) {
  return `library/jobs/${safeLibrarySegment(promptId)}.json`;
}

function packRecordKey(packId) {
  return `library/packs/${safeLibrarySegment(packId)}.json`;
}

function libraryFileKey(kind, promptId, filename) {
  return `library/files/${safeLibrarySegment(kind)}/${safeLibrarySegment(promptId)}/${safeLibrarySegment(filename)}`;
}

export function safeLibrarySegment(value) {
  return safeString(value, "asset")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "asset";
}

export function invalidLibraryFileKey(key) {
  if (!key || key.length > 360) return "Invalid library key.";
  if (!key.startsWith("library/files/")) return "Invalid library key.";
  if (key.includes("..") || key.includes("\\") || key.includes("//")) return "Invalid library key.";
  return "";
}
