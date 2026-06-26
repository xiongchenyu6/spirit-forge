// spine-sam3 —— 从 worker.js 拆出的模块（纯机械抽取，逻辑不变）。
import { alphaBounds, alphaBoundsInRect, averageNumbers, composePackTransparentFrames, jsonResponse, latestPackLayerSeparationJob, packAnimations, packFrameRect, packGridMetrics, packZipFrames, pngBytesFromDataUrl, positiveNumber, readLayerSeparationMasks, readPackCompletedFrameFiles, readPackRecord, refreshPackRecord, safeLibrarySegment, safeString, shouldPackUseTransparentFrames, sourceImageForLayerJob, withSignedPackRecord } from "../worker.js";

export const SPINE_LAYER_PROMPTS = [
  { id: "subject", label: "Subject", prompt: "", mode: "bbox" },
  { id: "head", label: "Head", prompt: "character head, hair, face, horns, helmet" },
  { id: "torso", label: "Torso", prompt: "upper body torso, chest, coat, armor" },
  { id: "hips", label: "Hips", prompt: "waist, hips, pelvis, belt" },
  { id: "arm_l", label: "Left arm", prompt: "left arm, left hand, left weapon arm" },
  { id: "arm_r", label: "Right arm", prompt: "right arm, right hand, right weapon arm" },
  { id: "leg_l", label: "Left leg", prompt: "left leg, left foot, left boot" },
  { id: "leg_r", label: "Right leg", prompt: "right leg, right foot, right boot" },
];

const SPINE_RIG_REQUIRED_PARTS = ["head", "torso", "hips", "arm_l", "arm_r", "leg_l", "leg_r"];

const SPINE_SAM3_PART_RULES = {
  head: { share: [0.06, 0.38], verticalBand: [0, 0.62], role: "head" },
  torso: { share: [0.12, 0.48], verticalBand: [0.18, 0.78], role: "torso" },
  hips: { share: [0.03, 0.24], verticalBand: [0.32, 0.86], role: "hips" },
  arm_l: { share: [0.015, 0.22], verticalBand: [0.18, 0.88], role: "limb" },
  arm_r: { share: [0.015, 0.22], verticalBand: [0.18, 0.88], role: "limb" },
  leg_l: { share: [0.02, 0.26], verticalBand: [0.42, 1], role: "limb" },
  leg_r: { share: [0.02, 0.26], verticalBand: [0.42, 1], role: "limb" },
};

const SPINE_SAM3_DRAW_ORDER = ["leg_l", "leg_r", "hips", "torso", "arm_l", "arm_r", "head"];

const SPINE_SAM3_ALLOWED_OVERLAPS = new Set([
  "torso/head",
  "hips/torso",
  "torso/arm_l",
  "torso/arm_r",
  "leg_l/hips",
  "leg_r/hips",
]);

const SPINE_SAM3_CRITICAL_OVERLAP_PAIRS = new Set([
  "arm_l/arm_r",
  "leg_l/leg_r",
  "leg_l/arm_l",
  "leg_r/arm_l",
  "leg_l/arm_r",
  "leg_r/arm_r",
  "hips/head",
  "leg_l/head",
  "leg_r/head",
]);

const SPINE_SAM3_MONSTER_REGION_WINDOWS = {
  head: { x: [0.04, 0.68], y: [0, 0.38] },
  torso: { x: [0.12, 0.78], y: [0.16, 0.66] },
  hips: { x: [0.10, 0.82], y: [0.40, 0.82] },
  arm_l: { x: [0, 0.62], y: [0.18, 0.78] },
  arm_r: { x: [0.36, 1], y: [0.18, 0.78] },
  leg_l: { x: [0, 0.58], y: [0.52, 1] },
  leg_r: { x: [0.38, 0.94], y: [0.52, 1] },
};

export async function servePackSpineSam3Part(packId, variant, partName, env) {
  if (!env.ASSET_BUCKET) return jsonResponse({ error: "storage_not_configured" }, 503);
  const allowedParts = new Set(SPINE_RIG_REQUIRED_PARTS);
  const safePart = safeLibrarySegment(partName);
  if (!allowedParts.has(safePart)) {
    return jsonResponse({ error: "part_not_found", message: "Unknown SAM3 Spine part." }, 404);
  }
  let preview;
  try {
    preview = await getPackSpineSam3Preview(packId, env);
  } catch (error) {
    if (error?.code === "sam3_layers_not_ready" || error?.status === 404) {
      return jsonResponse({ error: "sam3_layers_not_ready", message: "This pack does not have SAM3 Spine layers yet." }, 404);
    }
    throw error;
  }
  const item = (preview.parts || []).find((part) => part.name === safePart);
  const payload = variant === "cleaned-parts" ? item?.cleaned : item?.original;
  if (!payload?.dataUrl) {
    return jsonResponse({ error: "part_not_found", message: "The requested SAM3 Spine part is not available." }, 404);
  }
  const bytes = pngBytesFromDataUrl(payload.dataUrl);
  return new Response(bytes, {
    headers: {
      "content-type": "image/png",
      "cache-control": "private, max-age=300",
      "access-control-allow-origin": "*",
      "x-lingji-spine-sam3-variant": variant,
      "x-lingji-spine-sam3-part": safePart,
    },
  });
}

export async function getPackSpineSam3Preview(packId, env) {
  if (!env.ASSET_BUCKET) {
    return { ok: true, configured: false, parts: [] };
  }
  const cached = await readPackSpineSam3PreviewCache(packId, env);
  if (cached) return cached;
  const template = await buildPackSpineSam3PreviewTemplate(packId, env);
  if (!template) {
    const error = new Error("This pack does not have SAM3 Spine layers yet.");
    error.status = 404;
    error.code = "sam3_layers_not_ready";
    throw error;
  }
  const originalByName = new Map((template.parts || []).map((part) => [part.name, part]));
  const cleanedByName = new Map((template.cleanup?.parts || []).map((part) => [part.name, part]));
  const parts = SPINE_RIG_REQUIRED_PARTS.map((name) => {
    const original = originalByName.get(name);
    const cleaned = cleanedByName.get(name);
    return {
      name,
      label: spineLayerLabel(name),
      original: original ? spineSam3PreviewPartPayload(original, "parts") : null,
      cleaned: cleaned ? spineSam3PreviewPartPayload(cleaned, "cleaned-parts") : null,
    };
  });
  const preview = {
    ok: true,
    configured: true,
    packId,
    jobId: template.job.promptId,
    frameId: template.job.frameId || null,
    cleanup: template.cleanup?.report || null,
    quality: {
      status: template.quality.status,
      score: template.quality.score,
      summary: template.quality.summary,
    },
    parts,
  };
  await writePackSpineSam3PreviewCache(packId, preview, env).catch((error) => {
    console.warn("Spine SAM3 preview cache write failed", error);
  });
  return preview;
}

async function readPackSpineSam3PreviewCache(packId, env) {
  if (!env.ASSET_BUCKET) return null;
  const job = await latestPackLayerSeparationJob(env, packId).catch((error) => {
    console.warn("Spine SAM3 preview cache lookup failed", error);
    return null;
  });
  if (!job?.promptId) return null;
  const object = await env.ASSET_BUCKET.get(packSpineSam3PreviewCacheKey(packId, job.promptId));
  if (!object) return null;
  try {
    const cached = JSON.parse(await object.text());
    if (cached?.packId === packId && cached?.jobId === job.promptId && Array.isArray(cached.parts)) {
      return cached;
    }
  } catch (error) {
    console.warn("Spine SAM3 preview cache parse failed", error);
  }
  return null;
}

async function writePackSpineSam3PreviewCache(packId, preview, env) {
  if (!env.ASSET_BUCKET || !preview?.jobId) return;
  await env.ASSET_BUCKET.put(
    packSpineSam3PreviewCacheKey(packId, preview.jobId),
    JSON.stringify(preview, null, 2),
    {
      httpMetadata: { contentType: "application/json; charset=utf-8" },
      customMetadata: {
        packId,
        jobId: preview.jobId,
        kind: "spine-sam3-preview",
      },
    },
  );
}

function packSpineSam3PreviewCacheKey(packId, jobId) {
  return `library/packs/${safeLibrarySegment(packId)}/spine-sam3/preview-v3-${safeLibrarySegment(jobId)}.json`;
}

function spineSam3PreviewPartPayload(part, variant) {
  return {
    variant,
    path: `${variant}/${part.name}.png`,
    dataUrl: `data:image/png;base64,${bytesToBase64(part.bytes)}`,
    width: part.width,
    height: part.height,
    sourceRect: part.sourceRect,
    quality: part.quality,
    cleanup: part.cleanup || null,
  };
}

async function buildPackSpineSam3PreviewTemplate(packId, env) {
  const pack = await readPackRecord(env, packId);
  if (!pack) return null;
  const refreshed = await refreshPackRecord(env, packId).catch((error) => {
    console.warn("R2 pack refresh failed", error);
    return pack;
  });
  const signed = await withSignedPackRecord(env, refreshed || pack);
  if (signed.packKind !== "sprite-actions") return null;
  const completedFrameFiles = await readPackCompletedFrameFiles(env, signed);
  if (completedFrameFiles.length === 0) return null;
  const shouldUseTransparentFrames = shouldPackUseTransparentFrames(signed);
  const transparentFrameFiles = shouldUseTransparentFrames
    ? await composePackTransparentFrames(completedFrameFiles).catch((error) => {
        console.warn("Pack transparent frames compose failed", error);
        return [];
      })
    : [];
  const sourceFiles = shouldUseTransparentFrames && transparentFrameFiles.length === completedFrameFiles.length
    ? transparentFrameFiles
    : completedFrameFiles;
  return await buildSpineSam3LayersTemplate(env, signed, sourceFiles).catch((error) => {
    console.warn("Spine SAM3 preview template failed", error);
    return null;
  });
}

export function shouldIncludeSpineExport(pack) {
  return pack?.packKind === "sprite-actions" && Boolean(pack.zipSheet);
}

export function packSpineSkeletonJson(pack) {
  const frames = packZipFrames(pack).filter((frame) => frame.path);
  const grid = packGridMetrics(pack, frames);
  const animation = packAnimations(pack, frames)[0] || {
    key: safeLibrarySegment(pack.preset || "sprite-actions"),
    frameRate: 8,
    repeat: -1,
    frames,
  };
  const frameRate = positiveNumber(animation.frameRate, 8);
  const defaultFrame = frames[0] || null;
  const slotName = "sprite";
  const attachments = {};

  frames.forEach((frame) => {
    attachments[frame.key] = {
      type: "region",
      path: frame.key,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      width: grid.cellWidth,
      height: grid.cellHeight,
    };
  });

  const attachmentKeys = animation.frames.map((frame, index) => ({
    time: Number((index / frameRate).toFixed(4)),
    name: frame.key,
  }));
  if (animation.frames.length > 1 && defaultFrame) {
    attachmentKeys.push({
      time: Number((animation.frames.length / frameRate).toFixed(4)),
      name: defaultFrame.key,
    });
  }

  return {
    skeleton: {
      hash: safeLibrarySegment(pack.packId || "lingji-pack"),
      spine: "4.1.00",
      x: -grid.cellWidth / 2,
      y: -grid.cellHeight / 2,
      width: grid.cellWidth,
      height: grid.cellHeight,
      images: "./",
      audio: "./",
    },
    bones: [
      {
        name: "root",
      },
    ],
    slots: [
      {
        name: slotName,
        bone: "root",
        attachment: defaultFrame?.key || null,
      },
    ],
    skins: [
      {
        name: "default",
        attachments: {
          [slotName]: attachments,
        },
      },
    ],
    animations: {
      [animation.key]: {
        slots: {
          [slotName]: {
            attachment: attachmentKeys,
          },
        },
      },
    },
  };
}

export function packSpineAtlas(pack) {
  const frames = packZipFrames(pack).filter((frame) => frame.path);
  const grid = packGridMetrics(pack, frames);
  const filter = pack.input?.style === "pixel" ? "Nearest,Nearest" : "Linear,Linear";
  const lines = [
    "../sheet.png",
    `size: ${grid.imageWidth},${grid.imageHeight}`,
    "format: RGBA8888",
    `filter: ${filter}`,
    "repeat: none",
  ];

  frames.forEach((frame, index) => {
    const rect = packFrameRect(frame, index, grid);
    lines.push(
      frame.key,
      "  rotate: false",
      `  xy: ${rect.x}, ${rect.y}`,
      `  size: ${rect.width}, ${rect.height}`,
      `  orig: ${rect.width}, ${rect.height}`,
      "  offset: 0, 0",
      "  index: -1",
    );
  });

  return `${lines.join("\n")}\n`;
}

export function packSpineReadme(pack) {
  const frames = packZipFrames(pack).filter((frame) => frame.path);
  const animation = packAnimations(pack, frames)[0] || null;
  return [
    "# Lingji Forge Spine Export",
    "",
    "This folder contains a Spine-compatible attachment-swap export for the generated sprite action pack.",
    "",
    "Files:",
    "- skeleton.json: one root bone, one sprite slot, and one region attachment per generated frame.",
    "- skeleton.atlas: regions mapped to ../sheet.png.",
    "- rig-template/: heuristic editable rig template with bones, slots, part PNGs, and transform keyframes.",
    "- ../sheet.png: composed sprite sheet used by the atlas.",
    "",
    "Import notes:",
    "- This is an attachment-swap animation MVP, not a layered editable bone rig.",
    "- The rig-template folder is a first-frame editable scaffold. Its part crops are heuristic and should be replaced by precise AI or artist-authored layers for production rigs.",
    "- The root bone is centered on the frame; each frame is a full-region attachment.",
    `- Animation: ${animation?.key || safeLibrarySegment(pack.preset || "sprite-actions")} at ${animation?.frameRate || 8} fps.`,
    `- Frames: ${frames.length}.`,
    "- For production Spine authoring, use this as a runtime bridge or tracing reference before building separated limbs and weights.",
    "",
  ].join("\n");
}

export async function buildSpineRigTemplate(pack, frameFiles) {
  const sourceFile = frameFiles.find((file) => file.image) || frameFiles[0];
  if (!sourceFile) return null;
  const image = sourceFile.image || await decodePngRgba(sourceFile.bytes);
  const parts = await spineRigTemplateParts(image);
  const sheet = await composeSpineRigPartsSheet(parts);
  const timelineQa = packSpineTimelineQuality(pack, parts);
  return {
    parts,
    sheet,
    atlas: packSpineRigAtlas(sheet, parts),
    skeleton: packSpineRigSkeletonJson(pack, parts, image),
    partsManifest: packSpineRigPartsManifest(pack, parts, image, sheet, timelineQa),
    quality: packSpineRigQuality(pack, parts, image, timelineQa),
    readme: packSpineRigReadme(pack, parts),
  };
}

export async function buildSpineSam3LayersTemplate(env, pack, frameFiles) {
  const job = await latestPackLayerSeparationJob(env, pack.packId);
  if (!job?.result?.files?.length) return null;
  const sourceFile = await sourceImageForLayerJob(env, job, frameFiles);
  if (!sourceFile) return null;
  const image = sourceFile.image || await decodePngRgba(sourceFile.bytes);
  const masks = await readLayerSeparationMasks(env, job);
  const cutoutOptions = spineSam3CutoutOptionsForPack(pack, image);
  const cutouts = await spineSam3CutoutParts(image, masks, cutoutOptions);
  if (cutouts.length === 0) return null;
  const semantic = spineSam3SemanticReport(cutouts, image);
  applySpineSam3SemanticHints(cutouts, semantic);
  const overlap = spineSam3PartOverlapReport(cutouts, image.width, image.height, "sam3-cutout-overlap-v1");
  const cleanup = await buildSpineSam3CleanupExport(pack, image, masks, overlap, cutoutOptions);
  const sheet = await composeSpineRigPartsSheet(cutouts);
  const timelineQa = packSpineTimelineQuality(pack, cutouts);
  return {
    job,
    masks,
    parts: cutouts,
    cleanup,
    sheet,
    atlas: packSpineRigAtlas(sheet, cutouts),
    skeleton: packSpineRigSkeletonJson(pack, cutouts, image),
    partsManifest: packSpineSam3LayersManifest(pack, job, cutouts, masks, image, sheet, sourceFile, semantic, timelineQa, overlap, cleanup),
    quality: packSpineSam3LayerQuality(pack, job, cutouts, masks, image, sourceFile, semantic, timelineQa, overlap, cleanup),
    readme: packSpineSam3LayersReadme(pack, job, cutouts),
  };
}

export function packSpineSam3LayerSummary(job) {
  if (!job) return null;
  return {
    available: true,
    mode: "sam3-text-mask-cutouts",
    jobId: job.promptId,
    frameId: job.frameId || null,
    completedAt: job.completedAt || null,
    files: Array.isArray(job.result?.files) ? job.result.files.length : 0,
    skeleton: "spine/sam3-layers/skeleton.json",
    atlas: "spine/sam3-layers/parts.atlas",
    sheet: "spine/sam3-layers/parts.png",
    parts: "spine/sam3-layers/parts.json",
    quality: "spine/sam3-layers/quality.json",
    imageFolder: "spine/sam3-layers/parts/",
    maskFolder: "spine/sam3-layers/masks/",
    preview: {
      parts: "api:/api/packs/{packId}/spine-sam3/parts/{part}.png",
      cleanedParts: "api:/api/packs/{packId}/spine-sam3/cleaned-parts/{part}.png",
    },
    cleanup: {
      manifest: "spine/sam3-layers/cleanup.json",
      skeleton: "spine/sam3-layers/cleaned-skeleton.json",
      atlas: "spine/sam3-layers/cleaned-parts.atlas",
      sheet: "spine/sam3-layers/cleaned-parts.png",
      imageFolder: "spine/sam3-layers/cleaned-parts/",
    },
  };
}

function spineSam3CutoutOptionsForPack(pack, image) {
  if (pack?.preset !== "monster-actions") return {};
  const subjectBounds = alphaBounds(image.data, image.width, image.height, 8);
  if (!subjectBounds) return {};
  return {
    semanticClamp: "monster-anatomy-window-v1",
    subjectBounds,
  };
}

async function spineSam3CutoutParts(source, masks, options = {}) {
  const rigBones = new Set(["head", "torso", "hips", "arm_l", "arm_r", "leg_l", "leg_r"]);
  const counterpartByName = new Map([
    ["arm_l", "arm_r"],
    ["arm_r", "arm_l"],
    ["leg_l", "leg_r"],
    ["leg_r", "leg_l"],
  ]);
  const maskByName = new Map(masks.map((mask) => [mask.layerId, mask]));
  const parts = [];
  for (const mask of masks) {
    if (!rigBones.has(mask.layerId)) continue;
    let part = await spineSam3CutoutPart(source, mask, options);
    const counterpart = options.semanticClamp && counterpartByName.has(mask.layerId)
      ? maskByName.get(counterpartByName.get(mask.layerId))
      : null;
    if (counterpart && spineSam3WeakSemanticPart(part)) {
      const fallback = await spineSam3CutoutPart(source, counterpart, {
        ...options,
        outputLayerId: mask.layerId,
        outputLabel: mask.label,
        semanticFallbackFrom: counterpart.layerId,
      });
      if ((fallback.quality?.alphaPixels || 0) > (part.quality?.alphaPixels || 0)) {
        part = fallback;
      }
    }
    parts.push(part);
  }
  return parts;
}

async function spineSam3CutoutPart(source, mask, options = {}) {
  const full = new Uint8Array(source.width * source.height * 4);
  const trimAgainst = options.trimAgainst || new Set();
  const maskByName = options.maskByName || new Map();
  const cleanupStats = options.cleanupStats || null;
  const outputLayerId = options.outputLayerId || mask.layerId;
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const sourceIndex = ((y * source.width) + x) * 4;
      const targetIndex = sourceIndex;
      let maskAlpha = sampleMaskAlpha(mask.image, x, y, source.width, source.height);
      if (maskAlpha > 24 && !spineSam3SemanticPixelAllowed(outputLayerId, x, y, options)) {
        maskAlpha = 0;
      }
      if (maskAlpha > 24 && trimAgainst.size > 0) {
        for (const frontName of trimAgainst) {
          const frontMask = maskByName.get(frontName);
          if (!frontMask) continue;
          const frontAlpha = sampleMaskAlpha(frontMask.image, x, y, source.width, source.height);
          if (frontAlpha <= 24 || !spineSam3SemanticPixelAllowed(frontName, x, y, options)) continue;
          maskAlpha = 0;
          if (cleanupStats) cleanupStats.trimmedPixels += 1;
          break;
        }
      }
      full[targetIndex] = source.data[sourceIndex];
      full[targetIndex + 1] = source.data[sourceIndex + 1];
      full[targetIndex + 2] = source.data[sourceIndex + 2];
      full[targetIndex + 3] = Math.round((source.data[sourceIndex + 3] / 255) * maskAlpha);
    }
  }
  const bounds = alphaBounds(full, source.width, source.height, 8) || {
    x: Math.round(source.width / 2),
    y: Math.round(source.height / 2),
    width: 1,
    height: 1,
  };
  const pad = bounds.width > 1 || bounds.height > 1 ? 6 : 0;
  const cropX = Math.max(0, bounds.x - pad);
  const cropY = Math.max(0, bounds.y - pad);
  const cropRight = Math.min(source.width, bounds.x + bounds.width + pad);
  const cropBottom = Math.min(source.height, bounds.y + bounds.height + pad);
  const width = Math.max(1, cropRight - cropX);
  const height = Math.max(1, cropBottom - cropY);
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = (((cropY + y) * source.width) + cropX + x) * 4;
      const targetIndex = ((y * width) + x) * 4;
      data[targetIndex] = full[sourceIndex];
      data[targetIndex + 1] = full[sourceIndex + 1];
      data[targetIndex + 2] = full[sourceIndex + 2];
      data[targetIndex + 3] = full[sourceIndex + 3];
    }
  }
  const centerX = cropX + (width / 2);
  const centerY = cropY + (height / 2);
  const quality = spineRigPartQuality(data, width, height, 8);
  if (options.semanticClamp && !options.disableSemanticClampFallback && quality.empty) {
    return await spineSam3CutoutPart(source, mask, {
      ...options,
      semanticClamp: null,
      disableSemanticClampFallback: true,
    });
  }
  return {
    name: outputLayerId,
    bone: outputLayerId,
    label: options.outputLabel || mask.label,
    width,
    height,
    sourceRect: {
      x: cropX,
      y: cropY,
      width,
      height,
    },
    canvasCenter: {
      x: centerX,
      y: centerY,
    },
    spineCenter: {
      x: roundSpineNumber(centerX - (source.width / 2)),
      y: roundSpineNumber((source.height / 2) - centerY),
    },
    quality,
    semanticClamp: options.semanticClamp
      ? {
          method: options.semanticClamp,
          subjectBounds: options.subjectBounds,
          sourceLayerId: mask.layerId,
          fallbackFrom: options.semanticFallbackFrom || null,
        }
      : null,
    cleanup: cleanupStats
      ? {
          trimmedPixels: cleanupStats.trimmedPixels,
          trimAgainst: [...trimAgainst],
        }
      : null,
    data,
    bytes: await encodePngRgba(width, height, data),
  };
}

function spineSam3WeakSemanticPart(part) {
  if (!part || part.quality?.empty) return true;
  if ((part.quality?.alphaPixels || 0) < 512) return true;
  const bounds = part.quality?.bounds;
  return Boolean(bounds && (bounds.width <= 8 || bounds.height <= 24));
}

function spineSam3SemanticPixelAllowed(partName, x, y, options = {}) {
  if (options.semanticClamp !== "monster-anatomy-window-v1") return true;
  const bounds = options.subjectBounds;
  const window = SPINE_SAM3_MONSTER_REGION_WINDOWS[partName];
  if (!bounds || !window) return true;
  const normalizedX = (x - bounds.x) / Math.max(1, bounds.width);
  const normalizedY = (y - bounds.y) / Math.max(1, bounds.height);
  return normalizedX >= window.x[0]
    && normalizedX <= window.x[1]
    && normalizedY >= window.y[0]
    && normalizedY <= window.y[1];
}

function sampleMaskAlpha(mask, x, y, sourceWidth, sourceHeight) {
  const mx = Math.max(0, Math.min(mask.width - 1, Math.round((x / Math.max(1, sourceWidth - 1)) * (mask.width - 1))));
  const my = Math.max(0, Math.min(mask.height - 1, Math.round((y / Math.max(1, sourceHeight - 1)) * (mask.height - 1))));
  const offset = ((my * mask.width) + mx) * 4;
  const r = mask.data[offset];
  const g = mask.data[offset + 1];
  const b = mask.data[offset + 2];
  return Math.max(r, g, b);
}

async function spineRigTemplateParts(image) {
  const bounds = alphaBounds(image.data, image.width, image.height) || {
    x: Math.round(image.width * 0.22),
    y: Math.round(image.height * 0.08),
    width: Math.round(image.width * 0.56),
    height: Math.round(image.height * 0.84),
  };
  const specs = spineRigPartSpecs(bounds);
  const parts = [];

  for (const spec of specs) {
    const part = cropSpineRigPart(image, spec, bounds);
    part.bytes = await encodePngRgba(part.width, part.height, part.data);
    delete part.data;
    parts.push(part);
  }
  return parts;
}

function spineRigPartSpecs(bounds) {
  const rect = (name, bone, x, y, width, height) => ({
    name,
    bone,
    x: bounds.x + Math.round(bounds.width * x),
    y: bounds.y + Math.round(bounds.height * y),
    width: Math.max(1, Math.round(bounds.width * width)),
    height: Math.max(1, Math.round(bounds.height * height)),
  });
  return [
    rect("head", "head", 0.28, 0, 0.44, 0.27),
    rect("torso", "torso", 0.20, 0.20, 0.60, 0.38),
    rect("hips", "hips", 0.25, 0.52, 0.50, 0.22),
    rect("arm_l", "arm_l", 0, 0.22, 0.36, 0.44),
    rect("arm_r", "arm_r", 0.64, 0.22, 0.36, 0.44),
    rect("leg_l", "leg_l", 0.18, 0.64, 0.30, 0.36),
    rect("leg_r", "leg_r", 0.52, 0.64, 0.30, 0.36),
  ];
}

function cropSpineRigPart(image, spec, subjectBounds) {
  const x0 = Math.max(0, Math.min(image.width - 1, spec.x));
  const y0 = Math.max(0, Math.min(image.height - 1, spec.y));
  const x1 = Math.max(x0 + 1, Math.min(image.width, spec.x + spec.width));
  const y1 = Math.max(y0 + 1, Math.min(image.height, spec.y + spec.height));
  const localBounds = alphaBoundsInRect(image.data, image.width, image.height, x0, y0, x1 - x0, y1 - y0);
  const crop = localBounds || { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  const pad = Math.max(10, Math.round(Math.min(subjectBounds.width, subjectBounds.height) * 0.05));
  const cropX = Math.max(0, crop.x - pad);
  const cropY = Math.max(0, crop.y - pad);
  const cropRight = Math.min(image.width, crop.x + crop.width + pad);
  const cropBottom = Math.min(image.height, crop.y + crop.height + pad);
  const width = Math.max(1, cropRight - cropX);
  const height = Math.max(1, cropBottom - cropY);
  const data = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = (((cropY + y) * image.width) + cropX + x) * 4;
      const targetIndex = ((y * width) + x) * 4;
      data[targetIndex] = image.data[sourceIndex];
      data[targetIndex + 1] = image.data[sourceIndex + 1];
      data[targetIndex + 2] = image.data[sourceIndex + 2];
      data[targetIndex + 3] = image.data[sourceIndex + 3];
    }
  }

  const centerX = cropX + (width / 2);
  const centerY = cropY + (height / 2);
  return {
    name: spec.name,
    bone: spec.bone,
    width,
    height,
    sourceRect: {
      x: cropX,
      y: cropY,
      width,
      height,
    },
    canvasCenter: {
      x: centerX,
      y: centerY,
    },
    spineCenter: {
      x: roundSpineNumber(centerX - (image.width / 2)),
      y: roundSpineNumber((image.height / 2) - centerY),
    },
    quality: spineRigPartQuality(data, width, height),
    data,
  };
}

async function composeSpineRigPartsSheet(parts) {
  const padding = 4;
  const width = parts.reduce((total, part) => total + part.width + padding, padding);
  const height = Math.max(1, ...parts.map((part) => part.height + (padding * 2)));
  const data = new Uint8Array(width * height * 4);
  let x = padding;

  for (const part of parts) {
    part.atlasRect = {
      x,
      y: padding,
      width: part.width,
      height: part.height,
    };
    const decoded = await decodePngRgba(part.bytes);
    for (let py = 0; py < part.height; py += 1) {
      for (let px = 0; px < part.width; px += 1) {
        const sourceIndex = ((py * part.width) + px) * 4;
        const targetIndex = (((padding + py) * width) + x + px) * 4;
        data[targetIndex] = decoded.data[sourceIndex];
        data[targetIndex + 1] = decoded.data[sourceIndex + 1];
        data[targetIndex + 2] = decoded.data[sourceIndex + 2];
        data[targetIndex + 3] = decoded.data[sourceIndex + 3];
      }
    }
    x += part.width + padding;
  }

  return {
    width,
    height,
    bytes: await encodePngRgba(width, height, data),
  };
}

function packSpineRigAtlas(sheet, parts, pageName = "parts.png") {
  const lines = [
    pageName,
    `size: ${sheet.width},${sheet.height}`,
    "format: RGBA8888",
    "filter: Nearest,Nearest",
    "repeat: none",
  ];
  for (const part of parts) {
    lines.push(
      part.name,
      "  rotate: false",
      `  xy: ${part.atlasRect.x}, ${part.atlasRect.y}`,
      `  size: ${part.atlasRect.width}, ${part.atlasRect.height}`,
      `  orig: ${part.atlasRect.width}, ${part.atlasRect.height}`,
      "  offset: 0, 0",
      "  index: -1",
    );
  }
  return `${lines.join("\n")}\n`;
}

function packSpineRigSkeletonJson(pack, parts, image, options = {}) {
  const timeline = spineRigTimelineContext(pack, parts);
  const partByName = Object.fromEntries(parts.map((part) => [part.name, part]));
  const boneDefs = spineRigBoneDefs(partByName);
  const slots = timeline.orderedParts.map((part) => ({
    name: part.name,
    bone: part.bone,
    attachment: part.name,
  }));
  const attachments = Object.fromEntries(parts.map((part) => [
    part.name,
    {
      [part.name]: {
        type: "region",
        path: part.name,
        x: roundSpineNumber(part.spineCenter.x - spineRigPartPivot(part).x),
        y: roundSpineNumber(part.spineCenter.y - spineRigPartPivot(part).y),
        rotation: 0,
        width: part.width,
        height: part.height,
      },
    },
  ]));
  return {
    skeleton: {
      hash: `${safeLibrarySegment(pack.packId || "lingji-pack")}-${options.hashSuffix || "rig-template"}`,
      spine: "4.1.00",
      x: -image.width / 2,
      y: -image.height / 2,
      width: image.width,
      height: image.height,
      images: options.images || "./parts/",
      audio: "./",
    },
    bones: boneDefs,
    slots,
    skins: [
      {
        name: "default",
        attachments,
      },
    ],
    animations: {
      [timeline.animation.key]: timeline.animationData,
    },
  };
}

function spineRigTimelineContext(pack, parts) {
  const frames = packZipFrames(pack).filter((frame) => frame.path);
  const animation = packAnimations(pack, frames)[0] || {
    key: safeLibrarySegment(pack.preset || "sprite-actions"),
    frameRate: 8,
    repeat: -1,
    frames,
  };
  const frameRate = positiveNumber(animation.frameRate, 8);
  const orderedParts = spineRigOrderedParts(parts);
  const keyframes = animation.frames.map((frame, index) => ({
    time: Number((index / frameRate).toFixed(4)),
    frame,
    frameIndex: index,
    action: safeLibrarySegment(frame?.id || frame?.key || frame?.label || `frame-${index + 1}`),
    loopClosing: false,
    pose: spineRigPoseForFrame(frame, index),
  }));
  if (keyframes.length > 1) {
    keyframes.push({
      time: Number((keyframes.length / frameRate).toFixed(4)),
      frame: animation.frames[0],
      frameIndex: keyframes.length,
      action: safeLibrarySegment(animation.frames[0]?.id || animation.frames[0]?.key || animation.frames[0]?.label || "loop"),
      loopClosing: true,
      pose: spineRigPoseForFrame(animation.frames[0], 0),
    });
  }
  const animationData = spineRigAnimationTimelines(keyframes, orderedParts);
  return {
    frames,
    animation,
    frameRate,
    orderedParts,
    keyframes,
    animationData,
  };
}

function packSpineTimelineQuality(pack, parts) {
  return spineRigTimelineQuality(spineRigTimelineContext(pack, parts));
}

function spineRigOrderedParts(parts) {
  const order = new Map(SPINE_SAM3_DRAW_ORDER.map((name, index) => [name, index]));
  return [...parts].sort((a, b) => {
    const aOrder = order.get(a.name) ?? 999;
    const bOrder = order.get(b.name) ?? 999;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name);
  });
}

function spineRigBoneDefs(partByName) {
  const center = (name) => spineRigPartPivot(partByName[name]);
  const relative = (name, parent) => ({
    x: roundSpineNumber(center(name).x - center(parent).x),
    y: roundSpineNumber(center(name).y - center(parent).y),
  });
  return [
    { name: "root" },
    { name: "hips", parent: "root", x: center("hips").x, y: center("hips").y },
    { name: "torso", parent: "hips", ...relative("torso", "hips") },
    { name: "head", parent: "torso", ...relative("head", "torso") },
    { name: "arm_l", parent: "torso", ...relative("arm_l", "torso") },
    { name: "arm_r", parent: "torso", ...relative("arm_r", "torso") },
    { name: "leg_l", parent: "hips", ...relative("leg_l", "hips") },
    { name: "leg_r", parent: "hips", ...relative("leg_r", "hips") },
  ];
}

function spineRigPartPivot(part) {
  return part?.spinePivot || part?.spineCenter || { x: 0, y: 0 };
}

function spineRigPoseForFrame(frame, index) {
  const key = safeLibrarySegment(frame?.id || frame?.key || frame?.label || `frame-${index + 1}`);
  const poses = {
    idle: {
      rootX: 0,
      rootY: 0,
      hips: 0,
      hipsX: 0,
      torso: 0,
      head: 0,
      arm_l: -6,
      arm_r: 6,
      leg_l: -2,
      leg_r: 2,
      hipsY: 0,
      torsoY: 0,
      headY: 0,
    },
    walk: {
      rootX: -2,
      rootY: 0,
      hips: -2,
      hipsX: -2,
      torso: -3,
      head: 2,
      arm_l: 18,
      arm_r: -18,
      leg_l: -16,
      leg_r: 16,
      hipsY: -2,
      torsoY: 2,
      arm_lY: 3,
      arm_rY: -2,
      leg_lX: 2,
      leg_rX: -2,
    },
    move: {
      rootX: -2,
      rootY: 0,
      hips: -2,
      hipsX: -2,
      torso: -4,
      head: 2,
      arm_l: 16,
      arm_r: -16,
      leg_l: -14,
      leg_r: 14,
      hipsY: -2,
      torsoY: 2,
      arm_lY: 3,
      arm_rY: -2,
      leg_lX: 2,
      leg_rX: -2,
    },
    attack: {
      rootX: 4,
      rootY: 0,
      hips: 6,
      hipsX: 3,
      torso: 18,
      head: -5,
      arm_l: -34,
      arm_r: 52,
      leg_l: 8,
      leg_r: -10,
      hipsY: -1,
      torsoY: 1,
      arm_lX: -6,
      arm_lY: -3,
      arm_rX: 12,
      arm_rY: 7,
      torsoScaleX: 1.03,
      frontSlot: "arm_r",
    },
    hurt: {
      rootX: -5,
      rootY: -2,
      hips: -8,
      hipsX: -3,
      torso: -18,
      head: 10,
      arm_l: 24,
      arm_r: -24,
      leg_l: 10,
      leg_r: -6,
      hipsY: -4,
      torsoY: -2,
      headX: -2,
      headY: -3,
      arm_lY: -5,
      arm_rY: -5,
      torsoScaleY: 0.98,
    },
    death: {
      rootX: -8,
      rootY: -12,
      hips: -18,
      hipsX: -6,
      torso: -34,
      head: 20,
      arm_l: 38,
      arm_r: -38,
      leg_l: 28,
      leg_r: -18,
      hipsY: -12,
      torsoY: -8,
      headX: -6,
      headY: -8,
      arm_lY: -8,
      arm_rY: -8,
      leg_lY: -4,
      leg_rY: -4,
      torsoScaleY: 0.95,
    },
  };
  return poses[key] || {
    rootX: 0,
    rootY: 0,
    hips: index % 2 ? 2 : -2,
    hipsX: index % 2 ? 1 : -1,
    torso: index % 2 ? 4 : -4,
    head: index % 2 ? -2 : 2,
    arm_l: index % 2 ? 14 : -14,
    arm_r: index % 2 ? -14 : 14,
    leg_l: index % 2 ? -8 : 8,
    leg_r: index % 2 ? 8 : -8,
    hipsY: index % 2 ? -2 : 0,
    torsoY: index % 2 ? 2 : 0,
  };
}

function spineRigAnimationTimelines(keyframes, orderedParts) {
  const bones = {
    root: { translate: [] },
    hips: { rotate: [], translate: [], scale: [] },
    torso: { rotate: [], translate: [], scale: [] },
    head: { rotate: [], translate: [] },
    arm_l: { rotate: [], translate: [] },
    arm_r: { rotate: [], translate: [] },
    leg_l: { rotate: [], translate: [] },
    leg_r: { rotate: [], translate: [] },
  };
  for (const { time, pose } of keyframes) {
    bones.root.translate.push(spineRigTranslateFrame(time, pose.rootX, pose.rootY));
    bones.hips.rotate.push(spineRigRotateFrame(time, pose.hips));
    bones.hips.translate.push(spineRigTranslateFrame(time, pose.hipsX, pose.hipsY));
    bones.hips.scale.push(spineRigScaleFrame(time, pose.hipsScaleX, pose.hipsScaleY));
    bones.torso.rotate.push(spineRigRotateFrame(time, pose.torso));
    bones.torso.translate.push(spineRigTranslateFrame(time, pose.torsoX, pose.torsoY));
    bones.torso.scale.push(spineRigScaleFrame(time, pose.torsoScaleX, pose.torsoScaleY));
    bones.head.rotate.push(spineRigRotateFrame(time, pose.head));
    bones.head.translate.push(spineRigTranslateFrame(time, pose.headX, pose.headY));
    bones.arm_l.rotate.push(spineRigRotateFrame(time, pose.arm_l));
    bones.arm_l.translate.push(spineRigTranslateFrame(time, pose.arm_lX, pose.arm_lY));
    bones.arm_r.rotate.push(spineRigRotateFrame(time, pose.arm_r));
    bones.arm_r.translate.push(spineRigTranslateFrame(time, pose.arm_rX, pose.arm_rY));
    bones.leg_l.rotate.push(spineRigRotateFrame(time, pose.leg_l));
    bones.leg_l.translate.push(spineRigTranslateFrame(time, pose.leg_lX, pose.leg_lY));
    bones.leg_r.rotate.push(spineRigRotateFrame(time, pose.leg_r));
    bones.leg_r.translate.push(spineRigTranslateFrame(time, pose.leg_rX, pose.leg_rY));
  }
  const animation = { bones };
  const drawOrder = spineRigDrawOrderTimeline(keyframes, orderedParts);
  if (drawOrder.length) animation.drawOrder = drawOrder;
  return animation;
}

function spineRigRotateFrame(time, angle = 0) {
  return { time, angle: roundSpineNumber(angle || 0) };
}

function spineRigTranslateFrame(time, x = 0, y = 0) {
  return {
    time,
    x: roundSpineNumber(x || 0),
    y: roundSpineNumber(y || 0),
  };
}

function spineRigScaleFrame(time, x = 1, y = 1) {
  return {
    time,
    x: roundSpineNumber(x || 1),
    y: roundSpineNumber(y || 1),
  };
}

function spineRigDrawOrderTimeline(keyframes, orderedParts) {
  const slotOrder = orderedParts.map((part) => part.name);
  const hasFrontSlot = keyframes.some(({ pose }) => pose.frontSlot && slotOrder.includes(pose.frontSlot));
  if (!hasFrontSlot) return [];
  return keyframes.map(({ time, pose }) => {
    if (!pose.frontSlot || !slotOrder.includes(pose.frontSlot)) return { time };
    return {
      time,
      offsets: [
        {
          slot: pose.frontSlot,
          offset: Math.max(0, slotOrder.length - 1 - slotOrder.indexOf(pose.frontSlot)),
        },
      ],
    };
  });
}

function spineRigTimelineQuality(context) {
  const warnings = [];
  const requiredBones = ["root", "hips", "torso", "head", "arm_l", "arm_r", "leg_l", "leg_r"];
  const requiredTimelines = {
    root: ["translate"],
    hips: ["rotate", "translate"],
    torso: ["rotate", "translate"],
    head: ["rotate", "translate"],
    arm_l: ["rotate", "translate"],
    arm_r: ["rotate", "translate"],
    leg_l: ["rotate", "translate"],
    leg_r: ["rotate", "translate"],
  };
  const bones = context.animationData.bones || {};
  const missingKeyedBones = requiredBones.filter((bone) => !bones[bone]);
  const missingTimelines = [];
  for (const [bone, timelines] of Object.entries(requiredTimelines)) {
    for (const timeline of timelines) {
      if (!Array.isArray(bones[bone]?.[timeline]) || bones[bone][timeline].length === 0) {
        missingTimelines.push(`${bone}.${timeline}`);
      }
    }
  }
  for (const bone of missingKeyedBones) {
    warnings.push(spineRigWarning("fail", bone, `${bone} has no animation timelines.`));
  }
  for (const timeline of missingTimelines) {
    warnings.push(spineRigWarning("fail", timeline, `${timeline} is missing from the Spine animation.`));
  }

  const sourceKeyframes = context.keyframes.filter((keyframe) => !keyframe.loopClosing);
  const actionStates = sourceKeyframes.map((keyframe) => spineRigTimelineActionQuality(keyframe));
  for (const action of actionStates) {
    if (!action.hasNonzeroMotion) {
      warnings.push(spineRigWarning("warn", action.action, `${action.action} has no nonzero root or limb motion.`));
    }
    if (action.action !== "idle" && action.limbRotationMax < 6 && action.rootTranslate < 1) {
      warnings.push(spineRigWarning("warn", action.action, `${action.action} motion amplitude is very low.`));
    }
  }

  const drawOrderFrames = context.animationData.drawOrder || [];
  const drawOrderChanges = drawOrderFrames.filter((frame) => Array.isArray(frame.offsets) && frame.offsets.length > 0);
  const attackLikeActions = actionStates.filter((action) => /attack|cast|shoot|strike|slash|hit/.test(action.action));
  if (attackLikeActions.length && drawOrderChanges.length === 0) {
    warnings.push(spineRigWarning("warn", "drawOrder", "Attack-like actions do not include a draw-order foreground key."));
  }
  const motion = {
    rootMaxTranslate: roundSpineNumber(Math.max(0, ...actionStates.map((action) => action.rootTranslate))),
    torsoMaxRotate: roundSpineNumber(Math.max(0, ...actionStates.map((action) => action.torsoRotate))),
    limbMaxRotate: roundSpineNumber(Math.max(0, ...actionStates.map((action) => action.limbRotationMax))),
    limbMaxTranslate: roundSpineNumber(Math.max(0, ...actionStates.map((action) => action.limbTranslateMax))),
    scaleKeyMaxDelta: spineRigTimelineScaleDelta(context.animationData),
  };
  if (sourceKeyframes.length > 1 && !context.keyframes.some((keyframe) => keyframe.loopClosing)) {
    warnings.push(spineRigWarning("warn", "loop", "Looping action is missing a closing keyframe."));
  }
  return {
    method: "pivot-aware-transform-qa-v1",
    skeletonTimeline: "pivot-aware-transform-v2",
    animation: context.animation.key,
    frameRate: context.frameRate,
    frames: sourceKeyframes.length,
    keyframes: context.keyframes.length,
    loopClosingKey: context.keyframes.some((keyframe) => keyframe.loopClosing),
    requiredBones,
    missingKeyedBones,
    missingTimelines,
    defaultDrawOrder: context.orderedParts.map((part) => part.name),
    drawOrder: {
      keyframes: drawOrderFrames.length,
      changes: drawOrderChanges.length,
      foregroundSlots: [...new Set(drawOrderChanges.flatMap((frame) => (frame.offsets || []).map((offset) => offset.slot)))],
    },
    motion,
    actionStates,
    status: warnings.some((warning) => warning.severity === "fail")
      ? "fail"
      : warnings.some((warning) => warning.severity === "warn")
        ? "warn"
        : "pass",
    warnings,
  };
}

function spineRigTimelineActionQuality(keyframe) {
  const pose = keyframe.pose || {};
  const rootTranslate = Math.hypot(pose.rootX || 0, pose.rootY || 0);
  const limbRotationMax = Math.max(
    Math.abs(pose.arm_l || 0),
    Math.abs(pose.arm_r || 0),
    Math.abs(pose.leg_l || 0),
    Math.abs(pose.leg_r || 0),
  );
  const limbTranslateMax = Math.max(
    Math.hypot(pose.arm_lX || 0, pose.arm_lY || 0),
    Math.hypot(pose.arm_rX || 0, pose.arm_rY || 0),
    Math.hypot(pose.leg_lX || 0, pose.leg_lY || 0),
    Math.hypot(pose.leg_rX || 0, pose.leg_rY || 0),
  );
  const torsoRotate = Math.abs(pose.torso || 0);
  const hipsTranslate = Math.hypot(pose.hipsX || 0, pose.hipsY || 0);
  return {
    action: keyframe.action,
    time: keyframe.time,
    rootTranslate: roundSpineNumber(rootTranslate),
    hipsTranslate: roundSpineNumber(hipsTranslate),
    torsoRotate: roundSpineNumber(torsoRotate),
    limbRotationMax: roundSpineNumber(limbRotationMax),
    limbTranslateMax: roundSpineNumber(limbTranslateMax),
    drawOrderSlot: pose.frontSlot || null,
    hasNonzeroMotion: rootTranslate >= 0.5 || hipsTranslate >= 0.5 || torsoRotate >= 1 || limbRotationMax >= 1 || limbTranslateMax >= 0.5,
  };
}

function spineRigTimelineScaleDelta(animationData) {
  let maxDelta = 0;
  for (const bone of Object.values(animationData.bones || {})) {
    for (const frame of bone.scale || []) {
      maxDelta = Math.max(maxDelta, Math.abs((frame.x || 1) - 1), Math.abs((frame.y || 1) - 1));
    }
  }
  return roundSpineNumber(maxDelta);
}

function packSpineRigPartsManifest(pack, parts, image, sheet, timelineQa) {
  return {
    schema: "lingji-forge.spine-rig-template.v1",
    packId: pack.packId,
    preset: pack.preset,
    mode: "heuristic-first-frame-layer-crops",
    source: {
      frame: "first transparent frame when available, otherwise first archived frame",
      width: image.width,
      height: image.height,
    },
    sheet: {
      path: "parts.png",
      atlas: "parts.atlas",
      width: sheet.width,
      height: sheet.height,
    },
    animation: {
      skeletonTimeline: "pivot-aware-transform-v2",
      defaultDrawOrder: spineRigOrderedParts(parts).map((part) => part.name),
      pivotedBones: false,
      timelineQa,
    },
    parts: parts.map((part) => ({
      name: part.name,
      bone: part.bone,
      path: `parts/${part.name}.png`,
      sourceRect: part.sourceRect,
      spineCenter: part.spineCenter,
      spinePivot: spineRigPartPivot(part),
      atlasRect: part.atlasRect,
      quality: part.quality,
      size: {
        width: part.width,
        height: part.height,
      },
    })),
    notes: [
      "This template uses heuristic part crops from the first generated frame.",
      "Replace these PNGs with AI-separated or artist-authored body-part layers before production animation.",
      "The skeleton includes editable bones and transform keyframes so Spine authoring can start from the generated action pack.",
    ],
  };
}

function applySpineSam3SemanticHints(parts, semantic) {
  for (const part of parts) {
    const partSemantic = semantic.parts?.[part.name] || null;
    part.semantic = partSemantic;
    part.pivotHint = partSemantic?.pivotHint || null;
    part.spinePivot = part.pivotHint?.spine || null;
  }
}

function spineSam3SemanticReport(parts, image) {
  const partByName = new Map(parts.map((part) => [part.name, part]));
  const totalAlphaPixels = Math.max(1, parts.reduce((total, part) => total + (part.quality?.alphaPixels || 0), 0));
  const semanticParts = {};
  const warnings = [];

  for (const part of parts) {
    const rule = SPINE_SAM3_PART_RULES[part.name] || null;
    const globalBounds = spineSam3GlobalVisibleBounds(part);
    const center = spineSam3PartCenter(part);
    const normalizedCenter = {
      x: roundSpineNumber(center.x / Math.max(1, image.width)),
      y: roundSpineNumber(center.y / Math.max(1, image.height)),
    };
    const visiblePixelShare = roundSpineNumber((part.quality?.alphaPixels || 0) / totalAlphaPixels);
    const pivotHint = spineSam3PivotHint(part, partByName, image);
    const semantic = {
      method: "sam3-source-geometry-v1",
      role: rule?.role || "part",
      required: SPINE_RIG_REQUIRED_PARTS.includes(part.name),
      screenSide: spineSam3ScreenSide(normalizedCenter.x),
      globalBounds,
      center,
      normalizedCenter,
      visiblePixelShare,
      expectedShare: rule ? { min: rule.share[0], max: rule.share[1] } : null,
      expectedVerticalBand: rule ? { min: rule.verticalBand[0], max: rule.verticalBand[1] } : null,
      pivotHint,
      drawOrder: SPINE_SAM3_DRAW_ORDER.indexOf(part.name),
    };
    semanticParts[part.name] = semantic;

    if (rule && !part.quality?.empty) {
      if (visiblePixelShare < rule.share[0]) {
        warnings.push(spineRigWarning("warn", part.name, `${part.name} occupies less visible area than expected for its body region.`));
      } else if (visiblePixelShare > rule.share[1]) {
        warnings.push(spineRigWarning("warn", part.name, `${part.name} occupies more visible area than expected; the mask may include neighboring regions.`));
      }
      if (normalizedCenter.y < rule.verticalBand[0] || normalizedCenter.y > rule.verticalBand[1]) {
        warnings.push(spineRigWarning("warn", part.name, `${part.name} is outside its expected vertical body band.`));
      }
    }
  }

  spineSam3WarnVerticalOrder(warnings, semanticParts, "head", "torso", image, "head should sit above torso.");
  spineSam3WarnVerticalOrder(warnings, semanticParts, "torso", "hips", image, "torso should sit above hips.");
  const pairBalance = {
    arms: spineSam3PairBalance(warnings, semanticParts, "arm_l", "arm_r", image),
    legs: spineSam3PairBalance(warnings, semanticParts, "leg_l", "leg_r", image),
  };
  spineSam3WarnLowerBodyOrder(warnings, semanticParts, image);

  const missingRequiredParts = SPINE_RIG_REQUIRED_PARTS.filter((name) => {
    const part = partByName.get(name);
    return !part || part.quality?.empty;
  });
  return {
    method: "sam3-source-geometry-v1",
    requiredParts: SPINE_RIG_REQUIRED_PARTS,
    recommendedDrawOrder: SPINE_SAM3_DRAW_ORDER,
    missingRequiredParts,
    pairBalance,
    summary: {
      semanticWarnings: warnings.length,
      missingRequiredParts: missingRequiredParts.length,
      totalPartAlphaPixels: totalAlphaPixels,
      averageVisiblePixelShare: roundSpineNumber(averageNumbers(Object.values(semanticParts).map((part) => part.visiblePixelShare))),
    },
    warnings,
    parts: semanticParts,
  };
}

function spineSam3GlobalVisibleBounds(part) {
  const bounds = part.quality?.bounds;
  if (!bounds) return null;
  return {
    x: part.sourceRect.x + bounds.x,
    y: part.sourceRect.y + bounds.y,
    width: bounds.width,
    height: bounds.height,
  };
}

function spineSam3PartCenter(part) {
  const bounds = spineSam3GlobalVisibleBounds(part) || part.sourceRect;
  return {
    x: roundSpineNumber(bounds.x + (bounds.width / 2)),
    y: roundSpineNumber(bounds.y + (bounds.height / 2)),
  };
}

function spineSam3PivotHint(part, partByName, image) {
  const torso = partByName.get("torso");
  const hips = partByName.get("hips");
  const partCenter = spineSam3PartCenter(part);
  const torsoCenter = torso ? spineSam3PartCenter(torso) : { x: image.width / 2, y: image.height / 2 };
  const hipsCenter = hips ? spineSam3PartCenter(hips) : torsoCenter;
  const local = spineSam3LocalPivot(part.name, partCenter, torsoCenter, hipsCenter);
  const source = {
    x: roundSpineNumber(part.sourceRect.x + (part.sourceRect.width * local.x)),
    y: roundSpineNumber(part.sourceRect.y + (part.sourceRect.height * local.y)),
  };
  return {
    method: "semantic-part-default-v1",
    role: spineSam3PivotRole(part.name),
    local,
    source,
    spine: {
      x: roundSpineNumber(source.x - (image.width / 2)),
      y: roundSpineNumber((image.height / 2) - source.y),
    },
  };
}

function spineSam3LocalPivot(name, partCenter, torsoCenter, hipsCenter) {
  if (name === "head") return { x: 0.5, y: 0.82 };
  if (name === "torso") return { x: 0.5, y: 0.72 };
  if (name === "hips") return { x: 0.5, y: 0.42 };
  if (name === "arm_l" || name === "arm_r") {
    return {
      x: partCenter.x < torsoCenter.x ? 0.86 : 0.14,
      y: 0.2,
    };
  }
  if (name === "leg_l" || name === "leg_r") {
    return {
      x: partCenter.x < hipsCenter.x ? 0.66 : 0.34,
      y: 0.14,
    };
  }
  return { x: 0.5, y: 0.5 };
}

function spineSam3PivotRole(name) {
  if (name === "head") return "neck";
  if (name === "torso") return "waist";
  if (name === "hips") return "pelvis";
  if (name === "arm_l" || name === "arm_r") return "shoulder";
  if (name === "leg_l" || name === "leg_r") return "hip-socket";
  return "center";
}

function spineSam3ScreenSide(normalizedX) {
  if (normalizedX < 0.43) return "screen-left";
  if (normalizedX > 0.57) return "screen-right";
  return "center";
}

function spineSam3WarnVerticalOrder(warnings, semanticParts, upperName, lowerName, image, message) {
  const upper = semanticParts[upperName];
  const lower = semanticParts[lowerName];
  if (!upper || !lower) return;
  if (upper.center.y > lower.center.y + (image.height * 0.025)) {
    warnings.push(spineRigWarning("warn", `${upperName}/${lowerName}`, message));
  }
}

function spineSam3WarnLowerBodyOrder(warnings, semanticParts, image) {
  const hips = semanticParts.hips;
  const legs = [semanticParts.leg_l, semanticParts.leg_r].filter(Boolean);
  if (!hips || legs.length === 0) return;
  const legCenterY = averageNumbers(legs.map((part) => part.center.y));
  if (hips.center.y > legCenterY + (image.height * 0.03)) {
    warnings.push(spineRigWarning("warn", "hips/legs", "hips should sit above the leg pivots."));
  }
}

function spineSam3PairBalance(warnings, semanticParts, leftName, rightName, image) {
  const left = semanticParts[leftName];
  const right = semanticParts[rightName];
  if (!left || !right) return { available: false };
  const minShare = Math.max(0.001, Math.min(left.visiblePixelShare, right.visiblePixelShare));
  const maxShare = Math.max(left.visiblePixelShare, right.visiblePixelShare);
  const shareRatio = roundSpineNumber(maxShare / minShare);
  const centerDistance = roundSpineNumber(Math.abs(left.center.x - right.center.x));
  if (shareRatio > 3.5) {
    warnings.push(spineRigWarning("warn", `${leftName}/${rightName}`, `${leftName} and ${rightName} have a large visible-area imbalance.`));
  }
  if (centerDistance < image.width * 0.04) {
    warnings.push(spineRigWarning("warn", `${leftName}/${rightName}`, `${leftName} and ${rightName} centers are very close; the masks may be merged or ambiguous.`));
  }
  return {
    available: true,
    shareRatio,
    centerDistance,
    leftScreenSide: left.screenSide,
    rightScreenSide: right.screenSide,
  };
}

function spineSam3OverlapReport(source, parts, masks) {
  const warnings = [];
  const partNames = parts.map((part) => part.name);
  const maskByName = new Map(masks.map((mask) => [mask.layerId, mask]));
  const coverageByName = new Map(partNames.map((name) => [name, 0]));
  const overlapCounts = new Map();

  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const sourceAlpha = source.data[((y * source.width) + x) * 4 + 3];
      if (sourceAlpha <= 8) continue;
      const active = [];
      for (const name of partNames) {
        const mask = maskByName.get(name);
        if (!mask) continue;
        const maskAlpha = sampleMaskAlpha(mask.image, x, y, source.width, source.height);
        if (maskAlpha <= 24) continue;
        active.push(name);
        coverageByName.set(name, (coverageByName.get(name) || 0) + 1);
      }
      for (let i = 0; i < active.length; i += 1) {
        for (let j = i + 1; j < active.length; j += 1) {
          const key = spineSam3PairKey(active[i], active[j]);
          overlapCounts.set(key, (overlapCounts.get(key) || 0) + 1);
        }
      }
    }
  }

  const pairs = [];
  for (const [key, overlapPixels] of overlapCounts.entries()) {
    const [a, b] = key.split("/");
    const aPixels = coverageByName.get(a) || 0;
    const bPixels = coverageByName.get(b) || 0;
    const minPixels = Math.max(1, Math.min(aPixels, bPixels));
    const maxPixels = Math.max(1, Math.max(aPixels, bPixels));
    const minOverlapRatio = roundSpineNumber(overlapPixels / minPixels);
    const maxOverlapRatio = roundSpineNumber(overlapPixels / maxPixels);
    const classification = spineSam3OverlapClassification(a, b, minOverlapRatio);
    const pair = {
      pair: key,
      parts: [a, b],
      overlapPixels,
      minOverlapRatio,
      maxOverlapRatio,
      allowedJointOverlap: SPINE_SAM3_ALLOWED_OVERLAPS.has(key),
      criticalPair: SPINE_SAM3_CRITICAL_OVERLAP_PAIRS.has(key),
      classification,
    };
    pairs.push(pair);
    if (classification === "critical") {
      warnings.push(spineRigWarning("warn", key, `${key} has high non-adjacent overlap; masks may be merged or semantically confused.`));
    } else if (classification === "merged-pair") {
      warnings.push(spineRigWarning("warn", key, `${key} overlaps enough to look like a merged left/right limb pair.`));
    } else if (classification === "excessive-joint") {
      warnings.push(spineRigWarning("info", key, `${key} has heavy joint overlap; inspect draw order and trimming.`));
    }
  }
  pairs.sort((a, b) => b.minOverlapRatio - a.minOverlapRatio || a.pair.localeCompare(b.pair));
  const riskyPairs = pairs.filter((pair) => pair.classification === "critical" || pair.classification === "merged-pair");
  return {
    method: "sam3-mask-overlap-v1",
    sourceThresholds: {
      sourceAlpha: 8,
      maskAlpha: 24,
    },
    coverage: Object.fromEntries(partNames.map((name) => [name, coverageByName.get(name) || 0])),
    summary: {
      pairs: pairs.length,
      riskyPairs: riskyPairs.length,
      allowedJointPairs: pairs.filter((pair) => pair.allowedJointOverlap).length,
      maxMinOverlapRatio: roundSpineNumber(Math.max(0, ...pairs.map((pair) => pair.minOverlapRatio))),
      warnings: warnings.length,
    },
    riskyPairs,
    pairs: pairs.slice(0, 24),
    warnings,
  };
}

function spineSam3PairKey(a, b) {
  const order = new Map(SPINE_SAM3_DRAW_ORDER.map((name, index) => [name, index]));
  return [a, b].sort((left, right) => {
    const leftOrder = order.get(left) ?? 999;
    const rightOrder = order.get(right) ?? 999;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.localeCompare(right);
  }).join("/");
}

function spineSam3OverlapClassification(a, b, minOverlapRatio) {
  const key = spineSam3PairKey(a, b);
  if (SPINE_SAM3_ALLOWED_OVERLAPS.has(key)) {
    return minOverlapRatio > 0.72 ? "excessive-joint" : "joint";
  }
  if (SPINE_SAM3_CRITICAL_OVERLAP_PAIRS.has(key)) {
    return minOverlapRatio > 0.34 ? "merged-pair" : minOverlapRatio > 0.18 ? "critical" : "incidental";
  }
  return minOverlapRatio > 0.48 ? "critical" : minOverlapRatio > 0.2 ? "watch" : "incidental";
}

async function buildSpineSam3CleanupExport(pack, image, masks, overlap, cutoutOptions = {}) {
  const plan = spineSam3CleanupPlan(overlap);
  const maskByName = new Map(masks.map((mask) => [mask.layerId, mask]));
  const parts = [];
  for (const mask of masks) {
    if (!SPINE_RIG_REQUIRED_PARTS.includes(mask.layerId)) continue;
    const cleanupStats = { trimmedPixels: 0 };
    const part = await spineSam3CutoutPart(image, mask, {
      ...cutoutOptions,
      trimAgainst: plan.trimRules.get(mask.layerId) || new Set(),
      maskByName,
      cleanupStats,
    });
    parts.push(part);
  }
  if (parts.length === 0) return null;
  const semantic = spineSam3SemanticReport(parts, image);
  applySpineSam3SemanticHints(parts, semantic);
  const sheet = await composeSpineRigPartsSheet(parts);
  const remainingOverlap = spineSam3PartOverlapReport(parts, image.width, image.height);
  const timelineQa = packSpineTimelineQuality(pack, parts);
  const report = {
    method: "sam3-overlap-cleanup-v1",
    strategy: "front-part-wins-risky-overlap",
    sourceOverlapMethod: overlap.method,
    actions: plan.actions,
    summary: {
      actions: plan.actions.length,
      partsTrimmed: parts.filter((part) => (part.cleanup?.trimmedPixels || 0) > 0).length,
      trimmedPixels: parts.reduce((total, part) => total + (part.cleanup?.trimmedPixels || 0), 0),
      emptyParts: parts.filter((part) => part.quality.empty).length,
      remainingRiskyPairs: remainingOverlap.summary.riskyPairs,
      remainingWarnings: remainingOverlap.warnings.length,
    },
    remainingOverlap,
    timelineQa,
    parts: parts.map((part) => ({
      name: part.name,
      path: `cleaned-parts/${part.name}.png`,
      sourceRect: part.sourceRect,
      spineCenter: part.spineCenter,
      spinePivot: part.spinePivot || part.spineCenter,
      semanticClamp: part.semanticClamp || null,
      cleanup: part.cleanup,
      quality: part.quality,
    })),
    notes: [
      "Cleanup trims risky overlap pixels from the lower draw-order part and preserves the higher draw-order part.",
      "Allowed joint overlaps are left untouched so shoulders, hips, torso, and neck still connect visually.",
      "This is an export helper, not a replacement for artist-approved mask editing.",
    ],
  };
  return {
    parts,
    sheet,
    atlas: packSpineRigAtlas(sheet, parts, "cleaned-parts.png"),
    skeleton: packSpineRigSkeletonJson(pack, parts, image, {
      hashSuffix: "sam3-cleaned",
      images: "./cleaned-parts/",
    }),
    report,
  };
}

function spineSam3CleanupPlan(overlap) {
  const order = new Map(SPINE_SAM3_DRAW_ORDER.map((name, index) => [name, index]));
  const trimRules = new Map();
  const actions = [];
  for (const pair of overlap.riskyPairs || []) {
    const [a, b] = pair.parts || pair.pair.split("/");
    if (!a || !b) continue;
    const aOrder = order.get(a) ?? 0;
    const bOrder = order.get(b) ?? 0;
    const trimmedPart = aOrder <= bOrder ? a : b;
    const preservedPart = trimmedPart === a ? b : a;
    if (!trimRules.has(trimmedPart)) trimRules.set(trimmedPart, new Set());
    trimRules.get(trimmedPart).add(preservedPart);
    actions.push({
      pair: pair.pair || spineSam3PairKey(a, b),
      classification: pair.classification,
      minOverlapRatio: pair.minOverlapRatio,
      trimmedPart,
      preservedPart,
      reason: "higher-draw-order-part-preserved",
    });
  }
  return { trimRules, actions };
}

function spineSam3PartOverlapReport(parts, sourceWidth, sourceHeight, method = "sam3-cleaned-part-overlap-v1") {
  const warnings = [];
  const coverageByName = new Map(parts.map((part) => [part.name, 0]));
  const activeByPixel = new Map();
  for (const part of parts) {
    if (!part.data) continue;
    for (let y = 0; y < part.height; y += 1) {
      for (let x = 0; x < part.width; x += 1) {
        const alpha = part.data[((y * part.width) + x) * 4 + 3];
        if (alpha <= 8) continue;
        const globalX = part.sourceRect.x + x;
        const globalY = part.sourceRect.y + y;
        if (globalX < 0 || globalX >= sourceWidth || globalY < 0 || globalY >= sourceHeight) continue;
        coverageByName.set(part.name, (coverageByName.get(part.name) || 0) + 1);
        const pixelKey = (globalY * sourceWidth) + globalX;
        const active = activeByPixel.get(pixelKey);
        if (active) {
          active.push(part.name);
        } else {
          activeByPixel.set(pixelKey, [part.name]);
        }
      }
    }
  }

  const overlapCounts = new Map();
  for (const active of activeByPixel.values()) {
    if (active.length < 2) continue;
    for (let i = 0; i < active.length; i += 1) {
      for (let j = i + 1; j < active.length; j += 1) {
        const key = spineSam3PairKey(active[i], active[j]);
        overlapCounts.set(key, (overlapCounts.get(key) || 0) + 1);
      }
    }
  }

  const pairs = [];
  for (const [key, overlapPixels] of overlapCounts.entries()) {
    const [a, b] = key.split("/");
    const minPixels = Math.max(1, Math.min(coverageByName.get(a) || 0, coverageByName.get(b) || 0));
    const maxPixels = Math.max(1, Math.max(coverageByName.get(a) || 0, coverageByName.get(b) || 0));
    const minOverlapRatio = roundSpineNumber(overlapPixels / minPixels);
    const maxOverlapRatio = roundSpineNumber(overlapPixels / maxPixels);
    const classification = spineSam3OverlapClassification(a, b, minOverlapRatio);
    const pair = {
      pair: key,
      parts: [a, b],
      overlapPixels,
      minOverlapRatio,
      maxOverlapRatio,
      allowedJointOverlap: SPINE_SAM3_ALLOWED_OVERLAPS.has(key),
      criticalPair: SPINE_SAM3_CRITICAL_OVERLAP_PAIRS.has(key),
      classification,
    };
    pairs.push(pair);
    if (classification === "critical" || classification === "merged-pair") {
      warnings.push(spineRigWarning("warn", key, `${key} still has risky overlap after cleanup.`));
    }
  }
  pairs.sort((a, b) => b.minOverlapRatio - a.minOverlapRatio || a.pair.localeCompare(b.pair));
  const riskyPairs = pairs.filter((pair) => pair.classification === "critical" || pair.classification === "merged-pair");
  return {
    method,
    sourceThresholds: {
      partAlpha: 8,
    },
    coverage: Object.fromEntries(parts.map((part) => [part.name, coverageByName.get(part.name) || 0])),
    summary: {
      pairs: pairs.length,
      riskyPairs: riskyPairs.length,
      allowedJointPairs: pairs.filter((pair) => pair.allowedJointOverlap).length,
      maxMinOverlapRatio: roundSpineNumber(Math.max(0, ...pairs.map((pair) => pair.minOverlapRatio))),
      warnings: warnings.length,
    },
    riskyPairs,
    pairs: pairs.slice(0, 24),
    warnings,
  };
}

function packSpineSam3LayersManifest(pack, job, parts, masks, image, sheet, sourceFile, semantic, timelineQa, overlap, cleanup) {
  return {
    schema: "lingji-forge.spine-sam3-layers.v1",
    packId: pack.packId,
    preset: pack.preset,
    mode: "sam3-text-mask-cutouts",
    source: {
      frameId: job.frameId || null,
      promptId: job.promptId,
      sourceFileKey: job.sourceFileKey || null,
      cutoutSourcePath: sourceFile?.path || null,
      width: image.width,
      height: image.height,
    },
    sheet: {
      path: "parts.png",
      atlas: "parts.atlas",
      width: sheet.width,
      height: sheet.height,
    },
    semantics: {
      method: semantic.method,
      recommendedDrawOrder: semantic.recommendedDrawOrder,
      summary: semantic.summary,
      pairBalance: semantic.pairBalance,
    },
    overlap: {
      method: overlap.method,
      summary: overlap.summary,
      riskyPairs: overlap.riskyPairs,
    },
    cleanup: cleanup
      ? {
          method: cleanup.report.method,
          strategy: cleanup.report.strategy,
          manifest: "cleanup.json",
          skeleton: "cleaned-skeleton.json",
          atlas: "cleaned-parts.atlas",
          sheet: "cleaned-parts.png",
          imageFolder: "cleaned-parts/",
          summary: cleanup.report.summary,
        }
      : null,
    animation: {
      skeletonTimeline: "pivot-aware-transform-v2",
      defaultDrawOrder: spineRigOrderedParts(parts).map((part) => part.name),
      pivotedBones: true,
      drawOrderKeys: true,
      timelineQa,
    },
    masks: masks.map((mask) => ({
      layerId: mask.layerId,
      label: mask.label,
      path: `masks/${mask.layerId}.png`,
      sourceFileKey: mask.fileKey,
    })),
    parts: parts.map((part) => ({
      name: part.name,
      bone: part.bone,
      label: part.label || spineLayerLabel(part.name),
      path: `parts/${part.name}.png`,
      sourceRect: part.sourceRect,
      spineCenter: part.spineCenter,
      spinePivot: part.spinePivot || part.spineCenter,
      pivotHint: part.pivotHint || null,
      semanticClamp: part.semanticClamp || null,
      atlasRect: part.atlasRect,
      quality: part.quality,
      semantic: part.semantic
        ? {
            role: part.semantic.role,
            screenSide: part.semantic.screenSide,
            globalBounds: part.semantic.globalBounds,
            normalizedCenter: part.semantic.normalizedCenter,
            visiblePixelShare: part.semantic.visiblePixelShare,
            expectedShare: part.semantic.expectedShare,
            expectedVerticalBand: part.semantic.expectedVerticalBand,
            drawOrder: part.semantic.drawOrder,
          }
        : null,
      size: {
        width: part.width,
        height: part.height,
      },
    })),
    notes: [
      "These body-part cutouts are generated by applying SAM3 mask images to the selected source frame.",
      "Use quality.json to identify empty or weak layers before treating this as production Spine art.",
      "The skeleton mirrors the rig-template bone layout so these parts can replace heuristic parts after inspection.",
    ],
  };
}

function packSpineSam3LayerQuality(pack, job, parts, masks, image, sourceFile, semantic, timelineQa, overlap, cleanup) {
  const warnings = [];
  const partByName = new Map(parts.map((part) => [part.name, part]));
  for (const name of SPINE_RIG_REQUIRED_PARTS) {
    const part = partByName.get(name);
    if (!part) {
      warnings.push(spineRigWarning("fail", name, `${name} is missing from the SAM3 cutout set.`));
      continue;
    }
    if (part.quality.empty) {
      warnings.push(spineRigWarning("fail", name, `${name} has no visible pixels after mask application.`));
    } else if (part.quality.coverage < 0.01) {
      warnings.push(spineRigWarning("warn", name, `${name} has very low visible coverage after mask application.`));
    }
    if (!part.quality.empty && part.quality.edgeMargin <= 1) {
      warnings.push(spineRigWarning("info", name, `${name} touches the cutout edge; inspect for clipped details.`));
    }
  }
  warnings.push(...semantic.warnings);
  warnings.push(...timelineQa.warnings);
  warnings.push(...overlap.warnings);
  const score = Math.max(0, 100 - warnings.reduce((total, warning) => (
    total + (warning.severity === "fail" ? 30 : warning.severity === "warn" ? 10 : 0)
  ), 0));
  return {
    schema: "lingji-forge.spine-sam3-layers-quality.v1",
    packId: pack.packId,
    preset: pack.preset,
    job: {
      promptId: job.promptId,
      frameId: job.frameId || null,
      completedAt: job.completedAt || null,
    },
    status: warnings.some((warning) => warning.severity === "fail")
      ? "fail"
      : warnings.some((warning) => warning.severity === "warn")
        ? "warn"
        : "pass",
    score,
    source: {
      width: image.width,
      height: image.height,
      cutoutSourcePath: sourceFile?.path || null,
    },
    summary: {
      masks: masks.length,
      parts: parts.length,
      emptyParts: parts.filter((part) => part.quality.empty).length,
      edgeTouchingParts: parts.filter((part) => !part.quality.empty && part.quality.edgeMargin <= 1).length,
      averageCoverage: roundSpineNumber(averageNumbers(parts.map((part) => part.quality.coverage))),
      minCoverage: roundSpineNumber(Math.min(...parts.map((part) => part.quality.coverage))),
      semanticWarnings: semantic.warnings.length,
      timelineWarnings: timelineQa.warnings.length,
      overlapWarnings: overlap.warnings.length,
      riskyOverlapPairs: overlap.summary.riskyPairs,
      cleanupActions: cleanup?.report?.summary?.actions || 0,
      cleanupRemainingRiskyPairs: cleanup?.report?.summary?.remainingRiskyPairs || 0,
      missingRequiredParts: semantic.missingRequiredParts.length,
      warnings: warnings.length,
    },
    semantics: {
      method: semantic.method,
      requiredParts: semantic.requiredParts,
      recommendedDrawOrder: semantic.recommendedDrawOrder,
      missingRequiredParts: semantic.missingRequiredParts,
      pairBalance: semantic.pairBalance,
      summary: semantic.summary,
    },
    overlap,
    cleanup: cleanup?.report || null,
    timeline: timelineQa,
    warnings,
    parts: parts.map((part) => ({
      name: part.name,
      bone: part.bone,
      label: part.label || spineLayerLabel(part.name),
      size: {
        width: part.width,
        height: part.height,
      },
      sourceRect: part.sourceRect,
      spineCenter: part.spineCenter,
      spinePivot: part.spinePivot || part.spineCenter,
      pivotHint: part.pivotHint || null,
      semanticClamp: part.semanticClamp || null,
      quality: part.quality,
      semantic: part.semantic || semantic.parts?.[part.name] || null,
    })),
    notes: [
      "This report checks the SAM3 mask cutouts included in spine/sam3-layers.",
      "Semantic checks use source-frame geometry to flag missing limbs, unexpected area share, vertical body-order issues, and ambiguous left/right pairs.",
      "Overlap checks compare raw SAM3 mask coverage on visible source pixels to flag merged limbs and unsafe non-adjacent body-part overlaps.",
      "A pass means the layers are structurally plausible; it does not guarantee artist-approved overlap cleanup or final animation quality.",
    ],
  };
}

function packSpineRigQuality(pack, parts, image, timelineQa) {
  const warnings = [];
  for (const part of parts) {
    if (part.quality.empty) {
      warnings.push(spineRigWarning("fail", part.name, `${part.name} has no visible alpha pixels.`));
    } else if (part.quality.coverage < 0.025) {
      warnings.push(spineRigWarning("warn", part.name, `${part.name} has very low visible coverage.`));
    }
    if (!part.quality.empty && part.quality.edgeMargin <= 1) {
      warnings.push(spineRigWarning("info", part.name, `${part.name} touches the crop edge; replacement art may need a larger crop.`));
    }
    const aspect = part.width / Math.max(1, part.height);
    if (aspect > 4 || aspect < 0.18) {
      warnings.push(spineRigWarning("warn", part.name, `${part.name} has an extreme aspect ratio.`));
    }
  }
  warnings.push(...timelineQa.warnings);
  const score = Math.max(0, 100 - warnings.reduce((total, warning) => (
    total + (warning.severity === "fail" ? 28 : warning.severity === "warn" ? 8 : 0)
  ), 0));
  return {
    schema: "lingji-forge.spine-rig-template-quality.v1",
    packId: pack.packId,
    preset: pack.preset,
    status: warnings.some((warning) => warning.severity === "fail")
      ? "fail"
      : warnings.some((warning) => warning.severity === "warn")
        ? "warn"
        : "pass",
    score,
    source: {
      width: image.width,
      height: image.height,
    },
    summary: {
      parts: parts.length,
      emptyParts: parts.filter((part) => part.quality.empty).length,
      edgeTouchingParts: parts.filter((part) => !part.quality.empty && part.quality.edgeMargin <= 1).length,
      averageCoverage: roundSpineNumber(averageNumbers(parts.map((part) => part.quality.coverage))),
      minCoverage: roundSpineNumber(Math.min(...parts.map((part) => part.quality.coverage))),
      timelineWarnings: timelineQa.warnings.length,
      warnings: warnings.length,
    },
    timeline: timelineQa,
    warnings,
    parts: parts.map((part) => ({
      name: part.name,
      bone: part.bone,
      size: {
        width: part.width,
        height: part.height,
      },
      sourceRect: part.sourceRect,
      quality: part.quality,
    })),
    notes: [
      "This report checks whether heuristic part crops contain visible pixels and whether visible pixels touch crop edges.",
      "A pass means the template is inspectable; it does not prove the part split is semantically correct.",
    ],
  };
}

function spineRigPartQuality(data, width, height, threshold = 24) {
  let count = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[((y * width) + x) * 4 + 3];
      if (alpha <= threshold) continue;
      count += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (!count) {
    return {
      empty: true,
      coverage: 0,
      alphaPixels: 0,
      edgeMargin: 0,
      bounds: null,
    };
  }
  return {
    empty: false,
    coverage: roundSpineNumber(count / (width * height)),
    alphaPixels: count,
    edgeMargin: Math.min(minX, minY, width - 1 - maxX, height - 1 - maxY),
    bounds: {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    },
  };
}

function spineRigWarning(severity, part, message) {
  return { severity, part, message };
}

function packSpineRigReadme(pack, parts) {
  return [
    "# Lingji Forge Spine Rig Template",
    "",
    "This folder is a first editable rig scaffold generated from the first completed sprite frame.",
    "",
    "Files:",
    "- skeleton.json: root/hips/torso/head/arm/leg bones, named slots, and transform keyframes.",
    "- parts.png and parts.atlas: packed heuristic body-part regions.",
    "- parts/*.png: loose PNG part crops for quick replacement in Spine.",
    "- parts.json: source rectangles, atlas rectangles, and part metadata.",
    "- quality.json: coverage, crop-edge, and timeline QA checks for each heuristic part.",
    "",
    "Important:",
    "- This is not a final AI-separated production rig.",
    "- The part crops are heuristic and may overlap or miss details, especially for monsters, weapons, capes, or side-view poses.",
    "- The skeleton uses a pivot-aware transform timeline with root, hips, torso, head, arm, and leg keyframes as an editable starting point.",
    "- Use it to start Spine authoring, then replace the part images with precise separated layers.",
    "",
    `Preset: ${pack.preset || "-"}`,
    `Parts: ${parts.map((part) => part.name).join(", ")}`,
    "",
  ].join("\n");
}

function packSpineSam3LayersReadme(pack, job, parts) {
  return [
    "# Lingji Forge SAM3 Spine Layers",
    "",
    "This folder contains AI-generated body-part masks and source-frame cutouts from the latest completed SAM3 layer-separation job for this pack.",
    "",
    "Files:",
    "- skeleton.json: Spine skeleton using the same editable bone layout as rig-template.",
    "- parts.png and parts.atlas: packed SAM3 cutout regions.",
    "- parts/*.png: transparent source cutouts created from the selected frame and SAM3 masks.",
    "- masks/*.png: raw SAM3 mask images archived from Comfy.",
    "- parts.json: source rectangles, atlas rectangles, mask provenance, semantic hints, and pivot hints.",
    "- quality.json: visible-pixel, empty-layer, crop-edge, body-region, ordering, left/right-pair, overlap, and timeline QA checks for each SAM3 cutout.",
    "- cleanup.json: overlap cleanup actions, trimmed-pixel counts, and remaining overlap checks.",
    "- cleaned-skeleton.json, cleaned-parts.atlas, cleaned-parts.png, cleaned-parts/*.png: optional draw-order-trimmed cutouts for import tests.",
    "",
    "Important:",
    "- These layers are closer to a production rig than heuristic crops, but they still need visual inspection.",
    "- SAM3 text prompts can confuse left/right limbs or merge accessories into body parts.",
    "- Overlap QA flags risky non-adjacent mask intersections, but accessories, weapons, and capes may still need manual cleanup.",
    "- Cleaned parts trim risky overlap from the lower draw-order part while preserving allowed joint overlaps.",
    "- Pivot hints are generated from source-frame geometry and are intended as import defaults, not final animator-approved joints.",
    "- The skeleton uses pivot-aware bone transforms and action-specific draw-order keys as an editable animation starting point.",
    "- Use quality.json and the loose PNGs before replacing artist-authored Spine art.",
    "",
    `Preset: ${pack.preset || "-"}`,
    `Layer job: ${job.promptId || "-"}`,
    `Frame: ${job.frameId || "-"}`,
    `Parts: ${parts.map((part) => part.name).join(", ")}`,
    "",
  ].join("\n");
}

function roundSpineNumber(value) {
  return Math.round(value * 100) / 100;
}

export function normalizeSpineLayerPrompts(value) {
  if (!Array.isArray(value) || value.length === 0) return SPINE_LAYER_PROMPTS;
  const baseById = new Map(SPINE_LAYER_PROMPTS.map((item) => [item.id, item]));
  const normalized = [];
  for (const item of value.slice(0, 12)) {
    const id = safeLibrarySegment(item?.id || item?.label || `layer-${normalized.length + 1}`).slice(0, 40);
    const base = baseById.get(id);
    const prompt = safeString(item?.prompt, base?.prompt || id.replace(/[_-]+/g, " "));
    normalized.push({
      id,
      label: safeString(item?.label, base?.label || id),
      prompt,
      mode: base?.mode === "bbox" || item?.mode === "bbox" ? "bbox" : "text",
    });
  }
  return normalized.length ? normalized : SPINE_LAYER_PROMPTS;
}

export function spineLayerLabel(layerId) {
  return SPINE_LAYER_PROMPTS.find((item) => item.id === layerId)?.label || layerId;
}
