import { ensureComfyInputImage, ensureSpriteReferenceImage, submitComfyWorkflow } from "./comfy-client.js";
import { buildFlux1Img2ImgWorkflow, buildFlux1PoseImg2ImgWorkflow, buildFlux1Workflow } from "./comfy-workflows.js";
import { characterOpenPoseDataUrl } from "./image.js";
import { frameStatusCounts, packItemBrief, packStatusFromCounts } from "./pack-export.js";
import { PACK_PRESETS } from "./pack-presets.js";
import {
  DEFAULT_NEGATIVE,
  denoiseForPackItem,
  localPromptPlan,
  normalizeGenerationInput,
  poseDenoiseForPackItem,
  poseStrengthForPackItem,
  randomSeed,
  titleFromBrief,
} from "./generation-utils.js";
import {
  putPackRecord,
  readPackRecord,
  readPackRequestIndex,
  refreshPackRecord,
  rememberPackFrameJobRecord,
  rememberPackRecord,
  rememberPackRequestIndex,
  withSignedPackRecord,
} from "./storage.js";

export async function recoverSubmitted2DPack(input, env) {
  const requestId = normalizePackRequestId(input);
  if (!requestId) return null;
  return await recover2DPackRequestById(requestId, env);
}

export async function recover2DPackRequestById(requestId, env) {
  const normalizedRequestId = normalizePackRequestId(requestId);
  if (!normalizedRequestId) return null;
  const index = await readPackRequestIndex(env, normalizedRequestId).catch((error) => {
    console.warn("2D pack request index read failed", error);
    return null;
  });
  if (!index?.packId) return null;
  const pack = await refreshPackRecord(env, index.packId).catch(async (error) => {
    console.warn("2D pack request recovery refresh failed", error);
    return await readPackRecord(env, index.packId).catch(() => null);
  });
  if (!pack) return null;
  return await packSubmitResponseFromRecord(env, pack, {
    requestId: normalizedRequestId,
    idempotent: true,
    recovered: true,
  });
}

export async function packSubmitResponseFromRecord(env, pack, extra = {}) {
  return {
    ok: true,
    kind: "2d-pack",
    packId: pack.packId,
    preset: pack.preset,
    packKind: pack.packKind,
    metadata: pack.metadata,
    jobs: (pack.frames || []).map((frame) => ({
      id: frame.id,
      label: frame.label,
      promptId: frame.promptId,
      clientId: frame.clientId,
      seed: frame.seed,
      dimensions: frame.dimensions,
      referenceDenoise: frame.referenceDenoise,
      poseControl: frame.poseControl,
      plan: frame.plan,
      status: frame.status || "queued",
      pollUrl: frame.pollUrl || `/api/jobs/${frame.promptId}?kind=2d`,
      index: frame.index,
      row: frame.row,
      column: frame.column,
    })),
    pack: await withSignedPackRecord(env, pack).catch(() => pack),
    ...extra,
  };
}

export function normalizePackRequestId(input) {
  const value = typeof input === "string"
    ? input
    : input?.requestId || input?.clientRequestId || input?.idempotencyKey;
  const text = stringValue(value).trim();
  if (!text) return "";
  return text
    .replace(/[^a-z0-9._:-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export async function loadPackFrameRerunTarget(packId, frameId, input, env) {
  if (!env.ASSET_BUCKET) throw httpError(503, "Storage is not configured.", "storage_not_configured");
  const pack = await readPackRecord(env, packId);
  if (!pack) throw httpError(404, "Pack not found.", "not_found");
  const refreshed = await refreshPackRecord(env, packId).catch((error) => {
    console.warn("R2 pack refresh failed", error);
    return pack;
  });
  const current = refreshed || pack;
  const preset = PACK_PRESETS[current.preset];
  if (!preset) throw httpError(400, "Pack preset is not rerunnable.", "pack_unavailable");
  const index = preset.items.findIndex((item) => item.id === frameId);
  if (index < 0) throw httpError(404, "Pack frame not found.", "frame_not_found");
  const frame = (current.frames || []).find((item) => item.id === frameId) || null;
  if (!frame) throw httpError(404, "Pack frame not found.", "frame_not_found");
  return {
    pack: current,
    frame,
    preset,
    item: preset.items[index],
    index,
    normalized: normalizeGenerationInput({ ...(current.input || {}), preset: current.preset }),
    seed: Number.isFinite(Number(input.seed)) ? Number(input.seed) : randomSeed(),
  };
}

export async function rerunPackFrame(target, input, env) {
  const { pack, frame, preset, item, index, normalized, seed } = target;
  const referenceImage = pack.reference?.mode?.startsWith("img2img") ? safeString(pack.reference.source) : null;
  const poseImage = safeString(frame?.poseControl?.poseImage);
  const poseControl = poseImage && (frame?.poseControl?.model || pack.reference?.poseControl?.model)
    ? { model: frame?.poseControl?.model || pack.reference.poseControl.model }
    : null;
  const job = await submitPackItemJob({
    env,
    normalized,
    rawInput: { ...(pack.input || {}), ...input },
    preset,
    item,
    index,
    seed,
    referenceImage,
    poseImage,
    poseControl,
  });
  const packReference = pack.reference || { mode: referenceImage ? "img2img" : "text-to-image" };
  const frames = (pack.frames || []).map((candidate) => {
    if (candidate.id !== item.id) return candidate;
    return {
      ...candidate,
      promptId: job.promptId,
      clientId: job.clientId,
      seed: job.seed,
      dimensions: job.dimensions,
      status: "queued",
      pollUrl: job.pollUrl,
      result: null,
      rawStatus: null,
      completedAt: null,
      referenceDenoise: job.referenceDenoise,
      poseControl: job.poseControl,
      previous: candidate.promptId
        ? {
            promptId: candidate.promptId,
            seed: candidate.seed ?? null,
            result: candidate.result || null,
            completedAt: candidate.completedAt || null,
          }
        : candidate.previous || null,
      rerunAt: new Date().toISOString(),
    };
  });
  const counts = frameStatusCounts(frames);
  const updated = await putPackRecord(env, {
    ...pack,
    status: packStatusFromCounts(counts),
    counts,
    frames,
    completedAt: null,
    metadata: {
      ...(pack.metadata || {}),
      lastRerunAt: new Date().toISOString(),
      lastRerunFrameId: item.id,
    },
  });
  await rememberPackFrameJobRecord(env, {
    job,
    normalized,
    preset,
    packId: pack.packId,
    packReference,
    rerunOfPromptId: frame?.promptId || null,
  });
  return {
    ok: true,
    kind: "2d-pack-frame-rerun",
    packId: pack.packId,
    frameId: item.id,
    job,
    pack: await withSignedPackRecord(env, updated),
  };
}

export async function submit2DPack(input, env, options = {}) {
  const requestId = normalizePackRequestId(input);
  const recovered = requestId ? await recover2DPackRequestById(requestId, env) : null;
  if (recovered) return recovered;
  const normalized = normalizeGenerationInput(input);
  const preset = PACK_PRESETS[normalized.preset];
  if (!preset) {
    return {
      ok: false,
      error: "pack_unavailable",
      message: "This preset does not have a multi-job asset pack workflow yet.",
      supportedPresets: Object.keys(PACK_PRESETS),
    };
  }

  const seedBase = Number.isFinite(Number(input.seed)) ? Number(input.seed) : randomSeed();
  const packId = crypto.randomUUID();
  const shouldUseReference = Boolean(input.referenceImage?.filename && preset.kind === "sprite-actions");
  const referenceImage = shouldUseReference
    ? await ensureSpriteReferenceImage({ comfyImage: input.referenceImage }, env, "lingji_pack_reference.png")
    : null;
  const shouldUsePoseControl = Boolean(referenceImage && normalized.preset === "character-actions");
  const poseControl = shouldUsePoseControl && typeof options.getCapabilities === "function"
    ? (await options.getCapabilities(env)).poseControl
    : null;
  const jobs = await Promise.all(
    preset.items.map(async (item, index) => {
      const seed = (seedBase + index) >>> 0;
      const poseDataUrl = poseControl?.available
        ? safeString(input.poseImages?.[item.id]) || await characterOpenPoseDataUrl(item.id)
        : "";
      const poseImage = poseDataUrl
        ? await ensureComfyInputImage({ imageDataUrl: poseDataUrl }, env, `lingji_pose_${item.id}.png`)
        : null;
      return await submitPackItemJob({
        env,
        normalized,
        rawInput: input,
        preset,
        item,
        index,
        seed,
        referenceImage,
        poseImage,
        poseControl,
      });
    }),
  );
  const usedPoseControl = jobs.some((job) => job.poseControl);
  const packReference = referenceImage
    ? {
        mode: usedPoseControl ? "img2img+pose" : "img2img",
        source: referenceImage,
        actionStrength: normalized.actionStrength,
        poseControl: usedPoseControl
          ? {
              model: poseControl.model,
              type: "openpose",
            }
          : null,
      }
    : {
        mode: "text-to-image",
      };
  const packMetadata = {
    output: "separate-images",
    reference: packReference,
    columns: preset.columns,
    rows: preset.rows,
    cellWidth: preset.cell[0],
    cellHeight: preset.cell[1],
    items: preset.items.map((item, index) => ({
      id: item.id,
      label: item.label,
      index,
      row: Math.floor(index / preset.columns),
      column: index % preset.columns,
    })),
    notes: [
      "Images are generated as separate jobs first to improve action/item control.",
      "Cloud ZIP downloads compose sheet.png, import manifests, and transparent frames where suitable.",
    ],
  };
  const storedPack = await rememberPackRecord(env, {
    id: `2d-pack:${packId}`,
    kind: "2d-pack",
    packId,
    status: "queued",
    preset: normalized.preset,
    packKind: preset.kind,
    input: normalized,
    reference: packReference,
    metadata: packMetadata,
    counts: {
      total: jobs.length,
      complete: 0,
      failed: 0,
      pending: jobs.length,
    },
    frames: jobs.map((job) => {
      const itemMeta = packMetadata.items.find((item) => item.id === job.id) || {};
      return {
        id: job.id,
        label: job.label,
        promptId: job.promptId,
        clientId: job.clientId,
        seed: job.seed,
        dimensions: job.dimensions,
        referenceDenoise: job.referenceDenoise,
        poseControl: job.poseControl,
        plan: job.plan,
        status: "queued",
        pollUrl: job.pollUrl,
        index: itemMeta.index ?? job.index,
        row: itemMeta.row ?? job.row,
        column: itemMeta.column ?? job.column,
      };
    }),
  });
  if (requestId) {
    await rememberPackRequestIndex(env, requestId, packId, {
      preset: normalized.preset,
      packKind: preset.kind,
    }).catch((error) => {
      console.warn("2D pack request index write failed", error);
    });
  }
  await Promise.all(jobs.map((job) => rememberPackFrameJobRecord(env, {
    job,
    normalized,
    preset,
    packId,
    packReference,
  })));

  return {
    ok: true,
    kind: "2d-pack",
    packId,
    preset: normalized.preset,
    packKind: preset.kind,
    metadata: packMetadata,
    jobs,
    pack: storedPack ? await withSignedPackRecord(env, storedPack).catch(() => storedPack) : null,
    requestId: requestId || null,
  };
}

async function submitPackItemJob({
  env,
  normalized,
  rawInput = {},
  preset,
  item,
  index,
  seed,
  referenceImage = null,
  poseImage = null,
  poseControl = null,
}) {
  const packInput = {
    ...normalized,
    assetType: item.assetType || preset.assetType || normalized.assetType,
    style: item.style || preset.style || normalized.style,
    camera: item.camera || preset.camera || normalized.camera,
    preset: item.preset || (
      preset.kind === "tile-pack"
        ? "map-tile"
        : preset.kind === "icon-pack"
            ? "icon"
            : preset.kind === "ui-pack"
            ? "ui-component"
            : "sprite"
    ),
    brief: packItemBrief(normalized, preset, item),
  };
  const plan = {
    ...localPromptPlan(packInput),
    title: `${titleFromBrief(normalized.brief)}_${item.id}`,
    source: "local-pack",
  };
  const [width, height] = preset.cell;
  const referenceDenoise = poseImage
    ? poseDenoiseForPackItem(rawInput, normalized, item)
    : referenceImage
      ? denoiseForPackItem(rawInput, normalized, item)
      : null;
  const workflow = referenceImage && poseImage && poseControl?.model
    ? buildFlux1PoseImg2ImgWorkflow({
        prompt: plan.prompt,
        negativePrompt: plan.negativePrompt || DEFAULT_NEGATIVE,
        width,
        height,
        seed,
        filename: referenceImage,
        poseFilename: poseImage,
        controlNetName: poseControl.model,
        denoise: referenceDenoise,
        controlStrength: poseStrengthForPackItem(item),
      })
    : referenceImage
      ? buildFlux1Img2ImgWorkflow({
          prompt: plan.prompt,
          negativePrompt: plan.negativePrompt || DEFAULT_NEGATIVE,
          width,
          height,
          seed,
          filename: referenceImage,
          denoise: referenceDenoise,
        })
      : buildFlux1Workflow({
          prompt: plan.prompt,
          negativePrompt: plan.negativePrompt || DEFAULT_NEGATIVE,
          width,
          height,
          seed,
        });
  const submitted = await submitComfyWorkflow(env, workflow);
  return {
    id: item.id,
    label: item.label,
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    seed,
    referenceDenoise,
    poseControl: poseImage && poseControl?.model
      ? {
          model: poseControl.model,
          poseImage,
          strength: poseStrengthForPackItem(item),
          type: "openpose",
        }
      : null,
    dimensions: { width, height },
    plan,
    pollUrl: `/api/jobs/${submitted.prompt_id}?kind=2d`,
    index,
    row: Math.floor(index / preset.columns),
    column: index % preset.columns,
  };
}

function stringValue(value) {
  return value === undefined || value === null ? "" : String(value);
}

function safeString(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function httpError(status, message, code = "bad_request") {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}
