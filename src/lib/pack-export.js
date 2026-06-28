// pack-export —— 从 worker.js 拆出的模块（纯机械抽取，逻辑不变）。
import { PACK_ALPHA_CONFIG, composePackSheetBundlePng, composePackTransparentFrames, jsonResponse, positiveNumber, safeString } from "../app.js";
import { createZipBlob } from "./binary.js";
import { readPackCompletedFrameFiles, readPackRecord, refreshPackRecord, withSignedPackRecord } from "./storage.js";
import { buildSpineRigTemplate, buildSpineSam3LayersTemplate, packSpineAtlas, packSpineReadme, packSpineSkeletonJson, shouldIncludeSpineExport } from "./spine-sam3.js";

const PACK_ZIP_CACHE_VERSION = "pack-zip-v11-action-sheets";
const PACK_ZIP_CACHE_FALLBACK_VERSIONS = [
  "pack-zip-v7-sam3-semantic-diagnostics",
  "pack-zip-v6-sam3-monster-sideview-profile",
  "pack-zip-v5-sam3-final-overlap-quality",
  "pack-zip-v4-sam3-monster-clamp",
];

function safeLibrarySegment(value) {
  const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  return (text || "asset")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "asset";
}

export async function downloadPackZip(packId, env) {
  if (!env.ASSET_BUCKET) return jsonResponse({ error: "storage_not_configured" }, 503);
  const pack = await readPackRecord(env, packId);
  if (!pack) return jsonResponse({ error: "not_found", message: "Pack not found." }, 404);
  const refreshed = await refreshPackRecord(env, packId).catch((error) => {
    console.warn("R2 pack refresh failed", error);
    return pack;
  });
  const signed = await withSignedPackRecord(env, refreshed || pack);
  const completedFrameFiles = await readPackCompletedFrameFiles(env, signed);

  if (completedFrameFiles.length === 0) {
    return jsonResponse({ error: "pack_not_ready", message: "This pack does not have archived frames yet." }, 409);
  }

  const filename = packZipDownloadFilename(signed, packId);
  const zipCacheKey = await packZipCacheKey(signed, completedFrameFiles);
  const cachedZip = await env.ASSET_BUCKET.get(zipCacheKey).catch((error) => {
    console.warn("Pack ZIP cache lookup failed", error);
    return null;
  });
  if (cachedZip) {
    return packZipResponse(cachedZip.body, filename, true);
  }
  const fallbackZip = await findPackZipVersionFallback(env, signed, completedFrameFiles).catch((error) => {
    console.warn("Pack ZIP cache fallback lookup failed", error);
    return null;
  });
  if (fallbackZip) {
    return packZipResponse(fallbackZip.body, filename, "version-fallback");
  }

  const liteExport = shouldUseLitePackZip(signed, completedFrameFiles);
  const shouldUseTransparentFrames = !liteExport && shouldPackUseTransparentFrames(signed);
  const transparentFrameFiles = shouldUseTransparentFrames
    ? await composePackTransparentFrames(completedFrameFiles).catch((error) => {
        console.warn("Pack transparent frames compose failed", error);
        return [];
      })
    : [];
  const hasTransparentFrameSet = shouldUseTransparentFrames && transparentFrameFiles.length === completedFrameFiles.length;
  const sheetSourceFiles = hasTransparentFrameSet ? transparentFrameFiles : completedFrameFiles;
  const sheetBundle = liteExport
    ? null
    : await composePackSheetBundlePng(signed, sheetSourceFiles, {
        includeSheet: true,
        includeClipSheets: signed.packKind === "sprite-actions",
      }).catch((error) => {
        console.warn("Pack sheet compose failed", error);
        return null;
      });
  const sheet = sheetBundle?.sheet || null;
  const actionSheets = sheetBundle?.clipSheets || [];
  const zipPack = {
    ...signed,
    zipSheet: sheet
      ? {
          path: "sheet.png",
          width: sheet.width,
          height: sheet.height,
          cellWidth: sheet.cellWidth,
          cellHeight: sheet.cellHeight,
          columns: sheet.columns,
          rows: sheet.rows,
          alpha: hasTransparentFrameSet ? PACK_ALPHA_CONFIG : null,
        }
      : null,
    zipActionSheets: actionSheets.map((actionSheet) => packZipSheetMetadata(actionSheet)),
    zipTransparentFrames: hasTransparentFrameSet
      ? Object.fromEntries(transparentFrameFiles.map((file) => [file.frame.id, file.path]))
      : {},
    zipLiteExport: liteExport
      ? {
          mode: "worker-lite",
          reason: "sprite action packs above 8 frames skip synchronous alpha/sheet/Spine composition in the Worker to avoid Cloudflare CPU limits",
          frames: completedFrameFiles.length,
          skipped: ["transparent-frames", "sheet.png", "per-action-sheets", "spine-rig-template", "sam3-layer-zip-export"],
        }
      : null,
  };
  const spineRigTemplate = shouldIncludeZipSpineExport(zipPack)
    ? await buildSpineRigTemplate(zipPack, sheetSourceFiles).catch((error) => {
        console.warn("Spine rig-template export failed", error);
        return null;
      })
    : null;
  const spineSam3Layers = shouldIncludeZipSpineExport(zipPack)
    ? await buildSpineSam3LayersTemplate(env, zipPack, sheetSourceFiles).catch((error) => {
        console.warn("Spine SAM3 layer export failed", error);
        return null;
      })
    : null;
  zipPack.zipSpineSam3Layers = spineSam3Layers
    ? {
        mode: "sam3-text-mask-cutouts",
        jobId: spineSam3Layers.job.promptId,
        frameId: spineSam3Layers.job.frameId,
        skeleton: "spine/sam3-layers/skeleton.json",
        atlas: "spine/sam3-layers/parts.atlas",
        sheet: "spine/sam3-layers/parts.png",
        parts: "spine/sam3-layers/parts.json",
        quality: "spine/sam3-layers/quality.json",
        imageFolder: "spine/sam3-layers/parts/",
        maskFolder: "spine/sam3-layers/masks/",
        cleanup: spineSam3Layers.cleanup
          ? {
              manifest: "spine/sam3-layers/cleanup.json",
              skeleton: "spine/sam3-layers/cleaned-skeleton.json",
              atlas: "spine/sam3-layers/cleaned-parts.atlas",
              sheet: "spine/sam3-layers/cleaned-parts.png",
              imageFolder: "spine/sam3-layers/cleaned-parts/",
              summary: spineSam3Layers.cleanup.report.summary,
            }
          : null,
        source: "latest-complete-layer-separation-job",
      }
    : null;
  const encoder = new TextEncoder();
  const files = [
    {
      path: "metadata.json",
      bytes: encoder.encode(JSON.stringify(packZipMetadata(zipPack), null, 2)),
    },
    {
      path: "manifest/engine-import.json",
      bytes: encoder.encode(JSON.stringify(packEngineManifest(zipPack), null, 2)),
    },
    {
      path: "manifest/phaser-animations.json",
      bytes: encoder.encode(JSON.stringify(packPhaserManifest(zipPack), null, 2)),
    },
    {
      path: "manifest/unity-sprites.json",
      bytes: encoder.encode(JSON.stringify(packUnityManifest(zipPack), null, 2)),
    },
    {
      path: "manifest/godot-sprites.json",
      bytes: encoder.encode(JSON.stringify(packGodotManifest(zipPack), null, 2)),
    },
    {
      path: "scripts/unity/LingjiSpriteImporter.cs",
      bytes: encoder.encode(packUnityImporterScript(zipPack)),
    },
    {
      path: "scripts/godot/import_lingji_pack.gd",
      bytes: encoder.encode(packGodotImporterScript(zipPack)),
    },
    {
      path: "scripts/phaser/loadLingjiPack.js",
      bytes: encoder.encode(packPhaserLoaderScript(zipPack)),
    },
    {
      path: "examples/browser-preview/index.html",
      bytes: encoder.encode(packBrowserPreviewHtml(zipPack)),
    },
    {
      path: "README.md",
      bytes: encoder.encode(packZipReadme(zipPack)),
    },
  ];
  if (zipPack.packKind === "tile-pack" && zipPack.zipSheet) {
    files.splice(5, 0, {
      path: "manifest/tiled-tileset.json",
      bytes: encoder.encode(JSON.stringify(packTiledTilesetManifest(zipPack), null, 2)),
    });
  }
  if (isUiAtlasPack(zipPack) && zipPack.zipSheet) {
    files.splice(
      5,
      0,
      {
        path: "manifest/ui-atlas.json",
        bytes: encoder.encode(JSON.stringify(packUiAtlasManifest(zipPack), null, 2)),
      },
      {
        path: "manifest/phaser-atlas.json",
        bytes: encoder.encode(JSON.stringify(packPhaserAtlasManifest(zipPack), null, 2)),
      },
    );
  }
  if (shouldIncludeZipSpineExport(zipPack)) {
    files.splice(
      5,
      0,
      {
        path: "spine/skeleton.json",
        bytes: encoder.encode(JSON.stringify(packSpineSkeletonJson(zipPack), null, 2)),
      },
      {
        path: "spine/skeleton.atlas",
        bytes: encoder.encode(packSpineAtlas(zipPack)),
      },
      {
        path: "spine/README.md",
        bytes: encoder.encode(packSpineReadme(zipPack)),
      },
    );
  }
  if (spineRigTemplate) {
    files.splice(
      8,
      0,
      {
        path: "spine/rig-template/skeleton.json",
        bytes: encoder.encode(JSON.stringify(spineRigTemplate.skeleton, null, 2)),
      },
      {
        path: "spine/rig-template/parts.atlas",
        bytes: encoder.encode(spineRigTemplate.atlas),
      },
      {
        path: "spine/rig-template/parts.png",
        bytes: spineRigTemplate.sheet.bytes,
      },
      {
        path: "spine/rig-template/parts.json",
        bytes: encoder.encode(JSON.stringify(spineRigTemplate.partsManifest, null, 2)),
      },
      {
        path: "spine/rig-template/quality.json",
        bytes: encoder.encode(JSON.stringify(spineRigTemplate.quality, null, 2)),
      },
      {
        path: "spine/rig-template/README.md",
        bytes: encoder.encode(spineRigTemplate.readme),
      },
      ...spineRigTemplate.parts.map((part) => ({
        path: `spine/rig-template/parts/${part.name}.png`,
        bytes: part.bytes,
      })),
    );
  }
  if (spineSam3Layers) {
    files.splice(
      8,
      0,
      {
        path: "spine/sam3-layers/skeleton.json",
        bytes: encoder.encode(JSON.stringify(spineSam3Layers.skeleton, null, 2)),
      },
      {
        path: "spine/sam3-layers/parts.atlas",
        bytes: encoder.encode(spineSam3Layers.atlas),
      },
      {
        path: "spine/sam3-layers/parts.png",
        bytes: spineSam3Layers.sheet.bytes,
      },
      {
        path: "spine/sam3-layers/parts.json",
        bytes: encoder.encode(JSON.stringify(spineSam3Layers.partsManifest, null, 2)),
      },
      {
        path: "spine/sam3-layers/quality.json",
        bytes: encoder.encode(JSON.stringify(spineSam3Layers.quality, null, 2)),
      },
      {
        path: "spine/sam3-layers/README.md",
        bytes: encoder.encode(spineSam3Layers.readme),
      },
      ...(spineSam3Layers.cleanup
        ? [
            {
              path: "spine/sam3-layers/cleanup.json",
              bytes: encoder.encode(JSON.stringify(spineSam3Layers.cleanup.report, null, 2)),
            },
            {
              path: "spine/sam3-layers/cleaned-skeleton.json",
              bytes: encoder.encode(JSON.stringify(spineSam3Layers.cleanup.skeleton, null, 2)),
            },
            {
              path: "spine/sam3-layers/cleaned-parts.atlas",
              bytes: encoder.encode(spineSam3Layers.cleanup.atlas),
            },
            {
              path: "spine/sam3-layers/cleaned-parts.png",
              bytes: spineSam3Layers.cleanup.sheet.bytes,
            },
          ]
        : []),
      ...spineSam3Layers.parts.map((part) => ({
        path: `spine/sam3-layers/parts/${part.name}.png`,
        bytes: part.bytes,
      })),
      ...(spineSam3Layers.cleanup?.parts || []).map((part) => ({
        path: `spine/sam3-layers/cleaned-parts/${part.name}.png`,
        bytes: part.bytes,
      })),
      ...spineSam3Layers.masks.map((mask) => ({
        path: `spine/sam3-layers/masks/${mask.layerId}.png`,
        bytes: mask.bytes,
      })),
    );
  }
  if (sheet) files.push({ path: "sheet.png", bytes: sheet.bytes });
  for (const actionSheet of actionSheets) {
    files.push({ path: actionSheet.path, bytes: actionSheet.bytes });
  }
  for (const frameFile of completedFrameFiles) {
    files.push({ path: frameFile.path, bytes: frameFile.bytes });
  }
  for (const frameFile of hasTransparentFrameSet ? transparentFrameFiles : []) {
    files.push({ path: frameFile.path, bytes: frameFile.bytes });
  }

  const zip = await createZipBlob(files);
  const zipBytes = new Uint8Array(await zip.arrayBuffer());
  await env.ASSET_BUCKET.put(zipCacheKey, zipBytes, {
    httpMetadata: {
      contentType: "application/zip",
      contentDisposition: `attachment; filename="${filename}"`,
      cacheControl: "private, max-age=300",
    },
    customMetadata: {
      packId: signed.packId,
      preset: signed.preset || "",
      kind: "pack-download-zip",
    },
  }).catch((error) => {
    console.warn("Pack ZIP cache write failed", error);
  });
  return packZipResponse(zipBytes, filename, false);
}

function packZipResponse(body, filename, cacheHit) {
  const cacheStatus = typeof cacheHit === "string" ? cacheHit : cacheHit ? "hit" : "miss";
  return new Response(body, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, max-age=300",
      "access-control-allow-origin": "*",
      "x-lingji-pack-zip-cache": cacheStatus,
    },
  });
}

function packZipDownloadFilename(pack, packId) {
  return `${safeLibrarySegment(pack.preset || "asset-pack")}-${safeLibrarySegment(packId).slice(0, 8)}.zip`;
}

async function findPackZipVersionFallback(env, pack, completedFrameFiles) {
  for (const version of PACK_ZIP_CACHE_FALLBACK_VERSIONS) {
    const key = await packZipCacheKey(pack, completedFrameFiles, version);
    const object = await env.ASSET_BUCKET.get(key);
    if (object) return object;
  }
  return null;
}

async function packZipCacheKey(pack, completedFrameFiles, version = PACK_ZIP_CACHE_VERSION) {
  const layer = pack.spineSam3Layers || null;
  const fingerprint = await shortDigest(JSON.stringify({
    version,
    packId: pack.packId,
    preset: pack.preset,
    packKind: pack.packKind,
    status: pack.status,
    metadata: pack.metadata || null,
    frames: (pack.frames || []).map((frame) => ({
      id: frame.id,
      promptId: frame.promptId,
      status: frame.status,
      fileKey: frame.result?.fileKey || null,
      filename: frame.result?.filename || null,
      previousFileKey: frame.previous?.result?.fileKey || frame.previous?.fileKey || null,
    })),
    archivedFiles: completedFrameFiles.map((file) => ({
      id: file.frame?.id,
      index: file.index,
      path: file.path,
      fileKey: file.frame?.result?.fileKey || null,
      bytes: file.bytes?.byteLength || file.bytes?.length || 0,
    })),
    spineSam3: layer
      ? {
          jobId: layer.jobId,
          frameId: layer.frameId,
          completedAt: layer.completedAt || null,
          files: layer.files || 0,
        }
      : null,
  }));
  return `library/packs/${safeLibrarySegment(pack.packId)}/download-cache/${safeLibrarySegment(pack.preset || "asset-pack")}-${fingerprint}.zip`;
}

async function shortDigest(source) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return packZipBase64UrlEncode(new Uint8Array(digest)).slice(0, 32);
}

function packZipBase64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function shouldPackUseTransparentFrames(pack) {
  return pack?.packKind !== "tile-pack";
}

function isUiAtlasPack(pack) {
  return pack?.packKind === "icon-pack" || pack?.packKind === "ui-pack";
}

function shouldIncludeZipSpineExport(pack) {
  return shouldIncludeSpineExport(pack) && !pack?.zipLiteExport;
}

function shouldUseLitePackZip(pack, completedFrameFiles = []) {
  const frameCount = completedFrameFiles.length || pack?.frames?.length || 0;
  return pack?.packKind === "sprite-actions" && frameCount > 8;
}

function packZipSheetMetadata(sheet) {
  if (!sheet) return null;
  return {
    key: sheet.key || null,
    action: sheet.action || null,
    direction: sheet.direction || null,
    path: sheet.path,
    width: sheet.width,
    height: sheet.height,
    cellWidth: sheet.cellWidth,
    cellHeight: sheet.cellHeight,
    columns: sheet.columns,
    rows: sheet.rows,
    frames: sheet.frames || [],
  };
}

function packZipMetadata(pack) {
  return {
    packId: pack.packId,
    kind: pack.kind,
    status: pack.status,
    preset: pack.preset,
    packKind: pack.packKind,
    createdAt: pack.createdAt,
    updatedAt: pack.updatedAt,
    completedAt: pack.completedAt || null,
    counts: pack.counts || null,
    input: pack.input || null,
    metadata: pack.metadata || null,
    sheet: pack.zipSheet || null,
    actionSheets: pack.zipActionSheets || [],
    liteExport: pack.zipLiteExport || null,
    spineSam3Layers: pack.zipSpineSam3Layers || null,
    frames: (pack.frames || []).map((frame) => ({
      id: frame.id,
      label: frame.label,
      promptId: frame.promptId,
      seed: frame.seed,
      status: frame.status,
      index: frame.index,
      row: frame.row,
      column: frame.column,
      direction: frame.direction ?? null,
      action: frame.action ?? null,
      actionFrame: frame.actionFrame ?? null,
      clip: frame.clip ?? frame.action ?? null,
      loop: frame.loop ?? null,
      fps: frame.fps ?? null,
      dimensions: frame.dimensions || null,
      filename: frame.result?.filename || null,
      contentType: frame.result?.contentType || null,
      bytes: frame.result?.bytes || null,
      path: frame.result?.fileKey ? `frames/original/${packFrameZipName(frame, frame.index || 0)}` : null,
      transparentPath: pack.zipTransparentFrames?.[frame.id] || null,
      url: frame.result?.url || null,
      comfyUrl: frame.result?.comfyUrl || null,
    })),
  };
}

function packEngineManifest(pack) {
  const frames = packZipFrames(pack);
  return {
    schema: "lingji-forge.asset-pack.v1",
    packId: pack.packId,
    kind: pack.kind,
    preset: pack.preset,
    packKind: pack.packKind,
    status: pack.status,
    counts: pack.counts || null,
    cell: {
      width: pack.metadata?.cellWidth || frames[0]?.width || null,
      height: pack.metadata?.cellHeight || frames[0]?.height || null,
      columns: pack.metadata?.columns || null,
      rows: pack.metadata?.rows || null,
    },
    sheet: pack.zipSheet || null,
    actionSheets: pack.zipActionSheets || [],
    exportMode: pack.zipLiteExport || null,
    frames,
    animations: packAnimations(pack, frames),
    tiledTileset: pack.packKind === "tile-pack" && pack.zipSheet ? "manifest/tiled-tileset.json" : null,
    uiAtlas: isUiAtlasPack(pack) && pack.zipSheet ? "manifest/ui-atlas.json" : null,
    phaserAtlas: isUiAtlasPack(pack) && pack.zipSheet ? "manifest/phaser-atlas.json" : null,
    spine: shouldIncludeZipSpineExport(pack)
      ? {
          mode: "attachment-swap",
          skeleton: "spine/skeleton.json",
          atlas: "spine/skeleton.atlas",
          image: "sheet.png",
          frameRate: packAnimations(pack, frames)[0]?.frameRate || 8,
        }
      : null,
    spineRigTemplate: shouldIncludeZipSpineExport(pack)
      ? {
          mode: "editable-template",
          skeleton: "spine/rig-template/skeleton.json",
          atlas: "spine/rig-template/parts.atlas",
          sheet: "spine/rig-template/parts.png",
          parts: "spine/rig-template/parts.json",
          quality: "spine/rig-template/quality.json",
          imageFolder: "spine/rig-template/parts/",
          source: "first-transparent-frame",
        }
      : null,
    spineSam3Layers: pack.zipSpineSam3Layers || null,
    notes: [
      pack.zipLiteExport
        ? "This cloud ZIP uses worker-lite mode: it includes original PNG frames, animation manifests, and import scripts, while sheet.png/transparent frames/Spine composition are intentionally skipped to avoid Cloudflare Worker CPU limits for large action packs."
        : null,
      "Frame files are stored as individual PNG files; frame.path is the recommended import path.",
      isUiAtlasPack(pack)
        ? "UI and icon packs include atlas manifests for importing sheet.png as named UI sprites."
        : pack.packKind === "tile-pack"
        ? "Tile packs keep frame.path under frames/original and compose sheet.png from opaque source tiles to preserve square tilemap imports."
        : "When transparent frames are available, frame.path points to frames/transparent/*_alpha.png and frame.sourcePath preserves the untouched source under frames/original/.",
      isUiAtlasPack(pack) && pack.zipSheet
        ? "manifest/ui-atlas.json is engine-neutral; manifest/phaser-atlas.json follows the Phaser atlas JSON hash shape."
        : pack.packKind === "tile-pack" && pack.zipSheet
        ? "manifest/tiled-tileset.json is a Tiled-compatible external tileset that points to ../sheet.png."
        : shouldIncludeZipSpineExport(pack)
        ? "spine/skeleton.json and spine/skeleton.atlas provide a Spine-compatible attachment-swap animation over sheet.png; spine/rig-template adds a first-frame editable bone template, and spine/sam3-layers appears when a completed SAM3 layer-separation job exists for this pack."
        : pack.zipSheet?.alpha
          ? "sheet.png is composed from deterministic transparent frames using the pack row/column metadata; untouched source files remain under frames/original/."
          : pack.zipSheet
            ? "sheet.png is composed from archived source frames using the pack row/column metadata."
            : "No composed sheet was generated for this ZIP.",
    ].filter(Boolean),
  };
}

function packPhaserManifest(pack) {
  const frames = packZipFrames(pack);
  return {
    packId: pack.packId,
    texturePrefix: safeLibrarySegment(pack.preset || "asset-pack"),
    sheet: pack.zipSheet || null,
    actionSheets: pack.zipActionSheets || [],
    frames: frames.map((frame) => ({
      key: frame.key,
      url: frame.path,
      width: frame.width,
      height: frame.height,
      sheetRect: frame.sheetRect,
      actionSheetRect: frame.actionSheetRect,
    })),
    animations: packAnimations(pack, frames).map((animation) => ({
      key: animation.key,
      frameKeys: animation.frames.map((frame) => frame.key),
      frameRate: animation.frameRate,
      repeat: animation.repeat,
    })),
  };
}

function packUnityManifest(pack) {
  const frames = packZipFrames(pack);
  const animations = packAnimations(pack, frames);
  const animationClips = animations.map((animation) => ({
    name: animation.key,
    action: animation.action || null,
    direction: animation.direction || null,
    sampleRate: animation.frameRate,
    loopTime: animation.repeat === -1,
    frames: animation.frames.map((frame) => frame.key),
  }));
  return {
    schema: "lingji-forge.unity-sprites.v1",
    packId: pack.packId,
    preset: pack.preset,
    textureType: "Sprite",
    spriteMode: pack.zipSheet ? "MultipleSheetAndFiles" : "MultipleFiles",
    pixelsPerUnit: 100,
    pivot: { x: 0.5, y: 0.5 },
    filterMode: pack.input?.style === "pixel" ? "Point" : "Bilinear",
    sheet: pack.zipSheet
      ? {
          path: pack.zipSheet.path || "sheet.png",
          width: pack.zipSheet.width,
          height: pack.zipSheet.height,
          columns: pack.zipSheet.columns,
          rows: pack.zipSheet.rows,
          cellWidth: pack.zipSheet.cellWidth,
          cellHeight: pack.zipSheet.cellHeight,
        }
      : null,
    actionSheets: pack.zipActionSheets || [],
    sprites: frames.filter((frame) => frame.path).map((frame) => ({
      name: frame.key,
      path: frame.path,
      width: frame.width,
      height: frame.height,
      sheetRect: frame.sheetRect,
      actionSheetRect: frame.actionSheetRect,
      action: frame.action || null,
      actionFrame: frame.actionFrame ?? null,
      clip: frame.clip || null,
      seed: frame.seed,
      promptId: frame.promptId,
    })),
    animationClips,
    animationClip: animationClips[0] || null,
  };
}

function packGodotManifest(pack) {
  const frames = packZipFrames(pack);
  const animations = packAnimations(pack, frames);
  const firstAnimation = animations[0] || null;
  const animatedSpriteAnimations = animations.map((animation) => ({
    animation: animation.key,
    action: animation.action || null,
    direction: animation.direction || null,
    loop: animation.repeat === -1,
    fps: animation.frameRate,
    frames: animation.frames.map((frame) => ({
      texture: frame.path,
      duration: 1 / animation.frameRate,
    })),
  }));
  return {
    schema: "lingji-forge.godot-sprites.v1",
    packId: pack.packId,
    preset: pack.preset,
    sheet: pack.zipSheet || null,
    actionSheets: pack.zipActionSheets || [],
    import: {
      textureFilter: pack.input?.style === "pixel" ? "nearest" : "linear",
      loop: firstAnimation ? firstAnimation.repeat === -1 : false,
      fps: firstAnimation?.frameRate || 8,
    },
    sprites: frames.filter((frame) => frame.path).map((frame) => ({
      name: frame.key,
      path: frame.path,
      size: {
        x: frame.width,
        y: frame.height,
      },
      sheetRect: frame.sheetRect,
      actionSheetRect: frame.actionSheetRect,
      action: frame.action || null,
      actionFrame: frame.actionFrame ?? null,
      clip: frame.clip || null,
      seed: frame.seed,
      promptId: frame.promptId,
    })),
    animations: animatedSpriteAnimations,
    animatedSprite2D: firstAnimation
      ? {
          animation: firstAnimation.key,
          animations: animatedSpriteAnimations,
          frames: firstAnimation.frames.map((frame) => ({
            texture: frame.path,
            duration: 1 / firstAnimation.frameRate,
          })),
        }
      : null,
  };
}

function packTiledTilesetManifest(pack) {
  const frames = packZipFrames(pack);
  const firstFrame = frames[0] || {};
  const tileWidth = positiveNumber(pack.zipSheet?.cellWidth, pack.metadata?.cellWidth || firstFrame.width || 512);
  const tileHeight = positiveNumber(pack.zipSheet?.cellHeight, pack.metadata?.cellHeight || firstFrame.height || 512);
  const columns = Math.max(1, Math.round(positiveNumber(pack.zipSheet?.columns, pack.metadata?.columns || frames.length || 1)));
  const rows = Math.max(1, Math.ceil(frames.length / columns));
  const imageWidth = positiveNumber(pack.zipSheet?.width, tileWidth * columns);
  const imageHeight = positiveNumber(pack.zipSheet?.height, tileHeight * rows);
  return {
    type: "tileset",
    tiledversion: "1.11.0",
    version: "1.10",
    name: safeLibrarySegment(pack.preset || "lingji-tiles"),
    tilewidth: tileWidth,
    tileheight: tileHeight,
    spacing: 0,
    margin: 0,
    tilecount: frames.length,
    columns,
    image: "../sheet.png",
    imagewidth: imageWidth,
    imageheight: imageHeight,
    properties: [
      { name: "packId", type: "string", value: pack.packId || "" },
      { name: "preset", type: "string", value: pack.preset || "" },
      { name: "source", type: "string", value: "Lingji Forge" },
    ],
    tiles: frames.map((frame, index) => ({
      id: index,
      type: frame.key,
      properties: [
        { name: "frameId", type: "string", value: frame.id || "" },
        { name: "label", type: "string", value: frame.label || frame.key || "" },
        { name: "sourcePath", type: "string", value: frame.sourcePath || frame.path || "" },
        { name: "promptId", type: "string", value: frame.promptId || "" },
        { name: "seed", type: "string", value: frame.seed ? String(frame.seed) : "" },
        { name: "row", type: "int", value: Number.isFinite(Number(frame.row)) ? Number(frame.row) : Math.floor(index / columns) },
        { name: "column", type: "int", value: Number.isFinite(Number(frame.column)) ? Number(frame.column) : index % columns },
      ],
    })),
  };
}

function packUiAtlasManifest(pack) {
  const frames = packZipFrames(pack);
  const grid = packGridMetrics(pack, frames);
  return {
    schema: "lingji-forge.ui-atlas.v1",
    packId: pack.packId,
    preset: pack.preset,
    packKind: pack.packKind,
    image: {
      path: "sheet.png",
      manifestRelativePath: "../sheet.png",
      width: grid.imageWidth,
      height: grid.imageHeight,
      alpha: pack.zipSheet?.alpha || null,
    },
    cell: {
      width: grid.cellWidth,
      height: grid.cellHeight,
      columns: grid.columns,
      rows: grid.rows,
    },
    sprites: frames.map((frame, index) => {
      const rect = packFrameRect(frame, index, grid);
      return {
        id: frame.id,
        name: frame.key,
        label: frame.label,
        role: packUiSpriteRole(pack, frame),
        index,
        row: rect.row,
        column: rect.column,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
        importPath: frame.path,
        sourcePath: frame.sourcePath,
        transparentPath: frame.transparentPath,
        promptId: frame.promptId,
        seed: frame.seed,
      };
    }),
  };
}

function packPhaserAtlasManifest(pack) {
  const frames = packZipFrames(pack);
  const grid = packGridMetrics(pack, frames);
  return {
    frames: Object.fromEntries(frames.map((frame, index) => {
      const rect = packFrameRect(frame, index, grid);
      return [
        frame.key,
        {
          frame: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
          rotated: false,
          trimmed: false,
          spriteSourceSize: { x: 0, y: 0, w: rect.width, h: rect.height },
          sourceSize: { w: rect.width, h: rect.height },
        },
      ];
    })),
    meta: {
      app: "Lingji Forge",
      version: "1.0",
      image: "../sheet.png",
      format: "RGBA8888",
      size: { w: grid.imageWidth, h: grid.imageHeight },
      scale: "1",
    },
  };
}

export function packGridMetrics(pack, frames) {
  const firstFrame = frames[0] || {};
  const cellWidth = positiveNumber(pack.zipSheet?.cellWidth, pack.metadata?.cellWidth || firstFrame.width || 512);
  const cellHeight = positiveNumber(pack.zipSheet?.cellHeight, pack.metadata?.cellHeight || firstFrame.height || 512);
  const columns = Math.max(1, Math.round(positiveNumber(pack.zipSheet?.columns, pack.metadata?.columns || frames.length || 1)));
  const rows = Math.max(1, Math.ceil(frames.length / columns));
  return {
    cellWidth,
    cellHeight,
    columns,
    rows,
    imageWidth: positiveNumber(pack.zipSheet?.width, cellWidth * columns),
    imageHeight: positiveNumber(pack.zipSheet?.height, cellHeight * rows),
  };
}

export function packFrameRect(frame, index, grid) {
  const row = Number.isFinite(Number(frame.row)) ? Number(frame.row) : Math.floor(index / grid.columns);
  const column = Number.isFinite(Number(frame.column)) ? Number(frame.column) : index % grid.columns;
  return {
    row,
    column,
    x: column * grid.cellWidth,
    y: row * grid.cellHeight,
    width: grid.cellWidth,
    height: grid.cellHeight,
  };
}

function packUiSpriteRole(pack, frame) {
  if (pack.packKind === "icon-pack") return "inventory-icon";
  const key = safeLibrarySegment(frame.id || frame.key || "");
  if (key.includes("bar")) return "status-bar";
  if (key.includes("slot")) return "inventory-slot";
  if (key.includes("button")) return "button";
  if (key.includes("panel")) return "panel";
  if (key.includes("divider")) return "divider";
  return "ui-component";
}

function scriptString(value) {
  return JSON.stringify(String(value ?? ""));
}

function packUnityImporterScript(pack) {
  const frames = packZipFrames(pack);
  const animations = packAnimations(pack, frames);
  const clipName = safeLibrarySegment(pack.preset || "sprite-actions");
  const clipSpecs = (animations.length
    ? animations
    : [{
        key: clipName,
        frameRate: 8,
        repeat: -1,
        frames: frames.filter((frame) => frame.path),
      }])
    .filter((animation) => animation.frames?.length);
  const clipSpecLines = clipSpecs.map((animation) => {
    const paths = animation.frames
      .map((frame) => scriptString(frame.path || frame.sourcePath || ""))
      .filter((path) => path !== "\"\"")
      .join(", ");
    return `        new ClipSpec(${scriptString(animation.key)}, ${positiveNumber(animation.frameRate, 8)}f, ${animation.repeat === -1 ? "true" : "false"}, new string[] { ${paths} }),`;
  });
  return [
    "// Lingji Forge Unity import helper.",
    "// Usage: extract this ZIP under Assets/, select the extracted pack folder, then run Tools > Lingji Forge > Import Selected Pack.",
    "#if UNITY_EDITOR",
    "using System.IO;",
    "using System.Linq;",
    "using UnityEditor;",
    "using UnityEngine;",
    "",
    "public static class LingjiSpriteImporter",
    "{",
    "    private sealed class ClipSpec",
    "    {",
    "        public readonly string Name;",
    "        public readonly float FrameRate;",
    "        public readonly bool Loop;",
    "        public readonly string[] Paths;",
    "        public ClipSpec(string name, float frameRate, bool loop, string[] paths)",
    "        {",
    "            Name = name;",
    "            FrameRate = frameRate;",
    "            Loop = loop;",
    "            Paths = paths;",
    "        }",
    "    }",
    "",
    "    private static readonly ClipSpec[] ClipSpecs = new ClipSpec[]",
    "    {",
    ...(clipSpecLines.length ? clipSpecLines : [`        new ClipSpec(${scriptString(clipName)}, 8f, true, new string[0]),`]),
    "    };",
    "",
    "    [MenuItem(\"Tools/Lingji Forge/Import Selected Pack\")]",
    "    public static void ImportSelectedPack()",
    "    {",
    "        var folder = Selection.activeObject ? AssetDatabase.GetAssetPath(Selection.activeObject) : \"\";",
    "        if (string.IsNullOrEmpty(folder) || !Directory.Exists(folder))",
    "        {",
    "            Debug.LogError(\"Select the extracted Lingji pack folder in the Project view first.\");",
    "            return;",
    "        }",
    "        var frameFolder = Path.Combine(folder, \"frames/transparent\").Replace(\"\\\\\", \"/\");",
    "        if (!Directory.Exists(frameFolder)) frameFolder = Path.Combine(folder, \"frames/original\").Replace(\"\\\\\", \"/\");",
    "        var files = Directory.Exists(frameFolder)",
    "            ? Directory.GetFiles(frameFolder, \"*.png\").OrderBy(path => path).ToArray()",
    "            : new string[0];",
    "        if (files.Length == 0)",
    "        {",
    "            Debug.LogError(\"No PNG frames found under frames/transparent or frames/original.\");",
    "            return;",
    "        }",
    "        foreach (var path in files)",
    "        {",
    "            var importer = AssetImporter.GetAtPath(path) as TextureImporter;",
    "            if (importer == null) continue;",
    "            importer.textureType = TextureImporterType.Sprite;",
    "            importer.spriteImportMode = SpriteImportMode.Single;",
    "            importer.filterMode = FilterMode.Point;",
    "            importer.mipmapEnabled = false;",
    "            importer.spritePixelsPerUnit = 100;",
    "            importer.SaveAndReimport();",
    "        }",
    "        var fallbackSprites = files.Select(path => AssetDatabase.LoadAssetAtPath<Sprite>(path)).Where(sprite => sprite).ToArray();",
    "        var created = 0;",
    "        foreach (var spec in ClipSpecs)",
    "        {",
    "            var sprites = spec.Paths != null && spec.Paths.Length > 0",
    "                ? spec.Paths.Select(path => AssetDatabase.LoadAssetAtPath<Sprite>(Path.Combine(folder, path).Replace(\"\\\\\", \"/\"))).Where(sprite => sprite).ToArray()",
    "                : fallbackSprites;",
    "            if (sprites.Length == 0) continue;",
    "            var clip = new AnimationClip { frameRate = spec.FrameRate > 0 ? spec.FrameRate : 8f };",
    "            var binding = new EditorCurveBinding",
    "            {",
    "                type = typeof(SpriteRenderer),",
    "                path = \"\",",
    "                propertyName = \"m_Sprite\"",
    "            };",
    "            var keyframes = sprites.Select((sprite, index) => new ObjectReferenceKeyframe",
    "            {",
    "                time = index / clip.frameRate,",
    "                value = sprite",
    "            }).ToArray();",
    "            AnimationUtility.SetObjectReferenceCurve(clip, binding, keyframes);",
    "            var settings = AnimationUtility.GetAnimationClipSettings(clip);",
    "            settings.loopTime = spec.Loop;",
    "            AnimationUtility.SetAnimationClipSettings(clip, settings);",
    "            var clipPath = AssetDatabase.GenerateUniqueAssetPath(Path.Combine(folder, spec.Name + \".anim\").Replace(\"\\\\\", \"/\"));",
    "            AssetDatabase.CreateAsset(clip, clipPath);",
    "            created += 1;",
    "        }",
    "        AssetDatabase.SaveAssets();",
    "        Debug.Log($\"Imported {files.Length} Lingji sprite PNGs and created {created} animation clip(s).\");",
    "    }",
    "}",
    "#endif",
    "",
  ].join("\n");
}

function packGodotImporterScript(pack) {
  const frames = packZipFrames(pack);
  const animations = packAnimations(pack, frames);
  const animationName = safeLibrarySegment(pack.preset || "sprite-actions");
  const clipSpecs = (animations.length
    ? animations
    : [{
        key: animationName,
        frameRate: 8,
        repeat: -1,
        frames: frames.filter((frame) => frame.path),
      }])
    .filter((animation) => animation.frames?.length);
  const clipSpecLines = clipSpecs.map((animation) => {
    const paths = animation.frames
      .map((frame) => scriptString(frame.path || frame.sourcePath || ""))
      .filter((path) => path !== "\"\"")
      .join(", ");
    const fps = Number(positiveNumber(animation.frameRate, 8)).toFixed(2);
    return `    {"name": ${scriptString(animation.key)}, "fps": ${fps}, "loop": ${animation.repeat === -1 ? "true" : "false"}, "frames": [${paths}]},`;
  });
  return [
    "# Lingji Forge Godot import helper.",
    "# Usage: copy this script into the extracted pack folder, open it in Godot, set PACK_ROOT if needed, then run it as an editor tool script.",
    "@tool",
    "extends EditorScript",
    "",
    "const PACK_ROOT := \"res://\"",
    "const CLIPS := [",
    ...(clipSpecLines.length ? clipSpecLines : [`    {"name": ${scriptString(animationName)}, "fps": 8.0, "loop": true, "frames": []},`]),
    "]",
    "",
    "func _run() -> void:",
    "    var sprite_frames := SpriteFrames.new()",
    "    var added := 0",
    "    for clip in CLIPS:",
    "        var animation_name := String(clip.get(\"name\", \"animation\"))",
    "        if !sprite_frames.has_animation(animation_name):",
    "            sprite_frames.add_animation(animation_name)",
    "        sprite_frames.set_animation_speed(animation_name, float(clip.get(\"fps\", 8.0)))",
    "        sprite_frames.set_animation_loop(animation_name, bool(clip.get(\"loop\", true)))",
    "        for relative_path in clip.get(\"frames\", []):",
    "            var texture := load(PACK_ROOT.path_join(String(relative_path)))",
    "            if texture:",
    "                sprite_frames.add_frame(animation_name, texture)",
    "                added += 1",
    "    if added == 0:",
    "        push_error(\"No PNG frames could be loaded from scripted clip paths under %s\" % PACK_ROOT)",
    "        return",
    `    var output_path := PACK_ROOT.path_join("${animationName}.tres")`,
    "    ResourceSaver.save(sprite_frames, output_path)",
    "    print(\"Created Lingji SpriteFrames: %s\" % output_path)",
    "",
  ].join("\n");
}

function packPhaserLoaderScript(pack) {
  const texturePrefix = safeLibrarySegment(pack.preset || "asset-pack");
  return [
    "// Lingji Forge Phaser loader helper.",
    "// Usage in preload(): await LingjiPhaserPack.load(this, '/assets/monster-actions-06e7fd78/');",
    "// Usage in create(): LingjiPhaserPack.createAnimations(this, this.cache.json.get('lingjiPackManifest'));",
    "(function (global) {",
    `  const DEFAULT_TEXTURE_PREFIX = "${texturePrefix}";`,
    "",
    "  async function fetchManifest(baseUrl) {",
    "    const root = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;",
    "    const response = await fetch(`${root}manifest/phaser-animations.json`);",
    "    if (!response.ok) throw new Error(`Lingji manifest load failed: ${response.status}`);",
    "    const manifest = await response.json();",
    "    manifest.baseUrl = root;",
    "    return manifest;",
    "  }",
    "",
    "  async function load(scene, baseUrl, options = {}) {",
    "    const manifest = await fetchManifest(baseUrl);",
    "    const texturePrefix = options.texturePrefix || manifest.texturePrefix || DEFAULT_TEXTURE_PREFIX;",
    "    for (const frame of manifest.frames || []) {",
    "      scene.load.image(`${texturePrefix}:${frame.key}`, `${manifest.baseUrl}${frame.url}`);",
    "    }",
    "    scene.cache.json.add(options.cacheKey || 'lingjiPackManifest', manifest);",
    "    return manifest;",
    "  }",
    "",
    "  function createAnimations(scene, manifest, options = {}) {",
    "    const source = manifest || scene.cache.json.get(options.cacheKey || 'lingjiPackManifest');",
    "    if (!source) throw new Error('Lingji manifest missing. Call LingjiPhaserPack.load first.');",
    "    const texturePrefix = options.texturePrefix || source.texturePrefix || DEFAULT_TEXTURE_PREFIX;",
    "    for (const animation of source.animations || []) {",
    "      if (scene.anims.exists(animation.key)) continue;",
    "      scene.anims.create({",
    "        key: animation.key,",
    "        frames: animation.frameKeys.map((key) => ({ key: `${texturePrefix}:${key}` })),",
    "        frameRate: animation.frameRate || 8,",
    "        repeat: animation.repeat ?? -1,",
    "      });",
    "    }",
    "    return source.animations || [];",
    "  }",
    "",
    "  global.LingjiPhaserPack = { load, createAnimations };",
    "})(typeof window !== 'undefined' ? window : globalThis);",
    "",
  ].join("\n");
}

function packBrowserPreviewHtml(pack) {
  const title = `Lingji Pack Preview - ${safeLibrarySegment(pack.preset || pack.packId || "asset-pack")}`;
  return [
    "<!doctype html>",
    "<html lang=\"en\">",
    "<head>",
    "  <meta charset=\"utf-8\">",
    "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    `  <title>${title}</title>`,
    "  <style>",
    "    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif; background: #0d1117; color: #f4f1e8; }",
    "    * { box-sizing: border-box; }",
    "    body { margin: 0; min-height: 100vh; background: #0d1117; }",
    "    main { width: min(1120px, calc(100vw - 32px)); margin: 0 auto; padding: 32px 0; }",
    "    header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 24px; }",
    "    h1 { margin: 0 0 8px; font-size: clamp(24px, 4vw, 42px); line-height: 1.05; letter-spacing: 0; }",
    "    p { margin: 0; color: #b7ad98; line-height: 1.6; }",
    "    .meta { display: grid; gap: 6px; min-width: 220px; padding-top: 4px; font-size: 13px; color: #c9bea5; }",
    "    .stage { display: grid; grid-template-columns: minmax(280px, 1fr) 320px; gap: 24px; align-items: start; }",
    "    .viewer { min-height: 480px; border: 1px solid rgba(222, 191, 124, 0.2); background: linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.04) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.04) 75%); background-size: 32px 32px; background-position: 0 0, 0 16px, 16px -16px, -16px 0; display: grid; place-items: center; padding: 24px; overflow: hidden; }",
    "    .viewer img { width: min(100%, 520px); height: min(70vh, 520px); object-fit: contain; image-rendering: pixelated; }",
    "    .panel { border: 1px solid rgba(222, 191, 124, 0.2); padding: 18px; background: #131820; }",
    "    .controls { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 16px 0; }",
    "    button { min-height: 40px; border: 1px solid rgba(222, 191, 124, 0.35); background: #1b222d; color: #f4f1e8; cursor: pointer; font: inherit; }",
    "    button:hover { background: #232c39; }",
    "    input[type=\"range\"] { width: 100%; margin: 6px 0 18px; }",
    "    .thumbs { display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 8px; margin-top: 16px; }",
    "    .thumb { aspect-ratio: 1; display: grid; place-items: center; border: 1px solid rgba(222, 191, 124, 0.18); background: #0d1117; padding: 4px; cursor: pointer; }",
    "    .thumb[aria-current=\"true\"] { border-color: #dfbf7c; outline: 1px solid rgba(223, 191, 124, 0.5); }",
    "    .thumb img { max-width: 100%; max-height: 100%; object-fit: contain; image-rendering: pixelated; }",
    "    .error { color: #ffb4a8; }",
    "    code { color: #dfbf7c; }",
    "    @media (max-width: 860px) { header, .stage { grid-template-columns: 1fr; display: grid; } .viewer { min-height: 360px; } }",
    "  </style>",
    "</head>",
    "<body>",
    "  <main>",
    "    <header>",
    "      <div>",
    "        <h1>Lingji Pack Preview</h1>",
    "        <p id=\"summary\">Loading manifest...</p>",
    "      </div>",
    "      <div class=\"meta\" id=\"meta\"></div>",
    "    </header>",
    "    <section class=\"stage\">",
    "      <div class=\"viewer\"><img id=\"frame\" alt=\"Current generated frame\"></div>",
    "      <aside class=\"panel\">",
    "        <p id=\"frameLabel\">Frame 0 / 0</p>",
    "        <input id=\"scrub\" type=\"range\" min=\"0\" max=\"0\" value=\"0\" step=\"1\" aria-label=\"Frame scrubber\">",
    "        <div class=\"controls\">",
    "          <button id=\"prev\" type=\"button\">Prev</button>",
    "          <button id=\"toggle\" type=\"button\">Pause</button>",
    "          <button id=\"next\" type=\"button\">Next</button>",
    "        </div>",
    "        <p id=\"hint\">Serve the extracted pack root over HTTP so this page can fetch <code>manifest/engine-import.json</code>.</p>",
    "        <div class=\"thumbs\" id=\"thumbs\" aria-label=\"Frame thumbnails\"></div>",
    "      </aside>",
    "    </section>",
    "  </main>",
    "  <script>",
    "    const manifestUrl = \"../../manifest/engine-import.json\";",
    "    const state = { manifest: null, frames: [], index: 0, playing: true, timer: null, frameRate: 8 };",
    "    const frameImage = document.getElementById(\"frame\");",
    "    const frameLabel = document.getElementById(\"frameLabel\");",
    "    const summary = document.getElementById(\"summary\");",
    "    const meta = document.getElementById(\"meta\");",
    "    const scrub = document.getElementById(\"scrub\");",
    "    const thumbs = document.getElementById(\"thumbs\");",
    "    const toggle = document.getElementById(\"toggle\");",
    "",
    "    function sourceFor(frame) {",
    "      return frame && frame.path ? \"../../\" + frame.path : \"\";",
    "    }",
    "",
    "    function setIndex(index) {",
    "      if (!state.frames.length) return;",
    "      state.index = (index + state.frames.length) % state.frames.length;",
    "      render();",
    "    }",
    "",
    "    function nextFrame() {",
    "      setIndex(state.index + 1);",
    "    }",
    "",
    "    function stop() {",
    "      if (state.timer) window.clearInterval(state.timer);",
    "      state.timer = null;",
    "    }",
    "",
    "    function start() {",
    "      stop();",
    "      if (!state.playing || state.frames.length < 2) return;",
    "      state.timer = window.setInterval(nextFrame, 1000 / state.frameRate);",
    "    }",
    "",
    "    function render() {",
    "      const frame = state.frames[state.index];",
    "      frameImage.src = sourceFor(frame);",
    "      frameImage.alt = frame ? frame.label || frame.key || \"Generated frame\" : \"Generated frame\";",
    "      frameLabel.textContent = frame ? (state.index + 1) + \" / \" + state.frames.length + \" - \" + (frame.label || frame.key || \"Frame\") : \"Frame 0 / 0\";",
    "      scrub.value = String(state.index);",
    "      Array.from(thumbs.children).forEach((node, index) => {",
    "        node.setAttribute(\"aria-current\", String(index === state.index));",
    "      });",
    "      toggle.textContent = state.playing ? \"Pause\" : \"Play\";",
    "    }",
    "",
    "    function renderThumbnails() {",
    "      thumbs.innerHTML = \"\";",
    "      state.frames.forEach((frame, index) => {",
    "        const button = document.createElement(\"button\");",
    "        button.type = \"button\";",
    "        button.className = \"thumb\";",
    "        button.title = frame.label || frame.key || \"Frame\";",
    "        button.addEventListener(\"click\", () => setIndex(index));",
    "        const image = document.createElement(\"img\");",
    "        image.src = sourceFor(frame);",
    "        image.alt = button.title;",
    "        button.appendChild(image);",
    "        thumbs.appendChild(button);",
    "      });",
    "    }",
    "",
    "    async function init() {",
    "      try {",
    "        const response = await fetch(manifestUrl);",
    "        if (!response.ok) throw new Error(\"HTTP \" + response.status);",
    "        state.manifest = await response.json();",
    "        const animation = (state.manifest.animations || [])[0] || null;",
    "        state.frames = ((animation && animation.frames) || state.manifest.frames || []).filter((frame) => frame.path);",
    "        state.frameRate = Number((animation && animation.frameRate) || 8) || 8;",
    "        scrub.max = String(Math.max(0, state.frames.length - 1));",
    "        summary.textContent = (state.manifest.preset || \"Asset pack\") + \" / \" + (state.manifest.packKind || state.manifest.kind || \"pack\") + \" / \" + state.frames.length + \" frames\";",
    "        meta.innerHTML = [",
    "          \"<span>Pack: \" + (state.manifest.packId || \"-\") + \"</span>\",",
    "          \"<span>Status: \" + (state.manifest.status || \"-\") + \"</span>\",",
    "          \"<span>Frame rate: \" + state.frameRate + \" fps</span>\"",
    "        ].join(\"\");",
    "        renderThumbnails();",
    "        render();",
    "        start();",
    "      } catch (error) {",
    "        summary.innerHTML = \"<span class=\\\"error\\\">Could not load manifest. Run a local static server from the extracted pack root, then reopen this page.</span>\";",
    "        meta.textContent = String(error && error.message ? error.message : error);",
    "      }",
    "    }",
    "",
    "    document.getElementById(\"prev\").addEventListener(\"click\", () => setIndex(state.index - 1));",
    "    document.getElementById(\"next\").addEventListener(\"click\", () => setIndex(state.index + 1));",
    "    toggle.addEventListener(\"click\", () => { state.playing = !state.playing; render(); start(); });",
    "    scrub.addEventListener(\"input\", (event) => setIndex(Number(event.target.value)));",
    "    init();",
    "  </script>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

function packZipReadme(pack) {
  const hasTransparentFrames = Object.keys(pack.zipTransparentFrames || {}).length > 0;
  const hasUiAtlas = isUiAtlasPack(pack) && pack.zipSheet;
  const hasSpineExport = shouldIncludeZipSpineExport(pack);
  const hasSam3Layers = Boolean(pack.zipSpineSam3Layers);
  const isLiteExport = Boolean(pack.zipLiteExport);
  const actionSheetCount = (pack.zipActionSheets || []).length;
  const sheetDescription = pack.zipSheet?.alpha
    ? "- sheet.png: composed transparent sheet from processed frame PNG files."
    : pack.zipSheet
      ? "- sheet.png: composed opaque sheet from archived source frame PNG files."
      : null;
  const sheetImportNote = pack.packKind === "tile-pack" && pack.zipSheet
    ? "- Tile packs keep opaque square tiles; import manifest/tiled-tileset.json in Tiled, or use sheet.png directly in an engine tilemap."
    : pack.zipSheet?.alpha
      ? "- sheet.png uses the pack grid layout and transparent-frame processing; use frames/original/*.png when an engine import prefers untouched source files."
      : pack.zipSheet
        ? "- sheet.png uses the pack grid layout and archived source frames."
        : "- A composed sprite sheet was not generated for this cloud ZIP.";
  const lines = [
    "# Lingji Forge Asset Pack",
    "",
    `Pack ID: ${pack.packId || "-"}`,
    `Preset: ${pack.preset || "-"}`,
    `Status: ${pack.status || "-"}`,
    "",
    "Files:",
    "- metadata.json: full cloud manifest with prompt ids, seeds, status, and source URLs.",
    "- manifest/engine-import.json: engine-neutral frame and animation manifest.",
    "- manifest/phaser-animations.json: Phaser-friendly frame keys and animation definitions.",
    "- manifest/unity-sprites.json: Unity-friendly sprite import and animation clip metadata.",
    "- manifest/godot-sprites.json: Godot-friendly AnimatedSprite2D metadata.",
    ...(pack.packKind === "tile-pack" && pack.zipSheet ? ["- manifest/tiled-tileset.json: Tiled-compatible external tileset pointing to ../sheet.png."] : []),
    ...(hasUiAtlas ? ["- manifest/ui-atlas.json: engine-neutral UI atlas rects for sheet.png."] : []),
    ...(hasUiAtlas ? ["- manifest/phaser-atlas.json: Phaser-compatible atlas JSON for sheet.png."] : []),
    ...(hasSpineExport ? ["- spine/skeleton.json and spine/skeleton.atlas: Spine-compatible attachment-swap export over sheet.png."] : []),
    ...(hasSpineExport ? ["- spine/rig-template/: editable rig scaffold with heuristic part PNGs, parts atlas, quality report, named slots, bones, and transform keyframes."] : []),
    ...(hasSam3Layers ? ["- spine/sam3-layers/: SAM3-generated body-part masks, source cutouts, parts atlas, quality report, and matching Spine skeleton."] : []),
    ...(actionSheetCount ? [`- sheets/*.png: ${actionSheetCount} per-action horizontal sprite sheets, one animation clip per file.`] : []),
    "- scripts/unity/LingjiSpriteImporter.cs: Unity Editor helper for selected extracted pack folders.",
    "- scripts/godot/import_lingji_pack.gd: Godot EditorScript helper for SpriteFrames resources.",
    "- scripts/phaser/loadLingjiPack.js: browser helper for Phaser frame loading and animation creation.",
    "- examples/browser-preview/index.html: dependency-free browser preview for frame order and playback.",
    ...(isLiteExport ? ["- This ZIP uses worker-lite mode: original frame PNGs and animation manifests are included; sheet.png, per-action sheets, transparent alpha frames, and Spine/SAM3 ZIP composition are skipped for large action packs."] : []),
    ...(sheetDescription ? [sheetDescription] : []),
    "- frames/original/*.png: archived generated frame images.",
    ...(hasTransparentFrames ? ["- frames/transparent/*_alpha.png: deterministic edge-connected background removal outputs."] : []),
    "",
    "Preview notes:",
    "- Extract the ZIP, run a static server from the extracted pack root, then open examples/browser-preview/.",
    "- Example: python3 -m http.server 4173",
    "- The preview reads manifest/engine-import.json and follows each frame.path, preferring transparent frames when available.",
    "",
    "Import notes:",
    "- Sprite action packs expose animation clips in manifest/engine-import.json, manifest/unity-sprites.json, manifest/godot-sprites.json, and manifest/phaser-animations.json.",
    pack.zipSheet
      ? "- Character and monster action packs use row = action clip and column = frame inside sheet.png."
      : "- Character and monster action packs expose clip order through the animation manifests; large worker-lite packs may omit sheet.png.",
    "- Map and icon packs use the same frame list; treat each PNG as one importable asset.",
    ...(hasUiAtlas ? ["- UI and icon packs can be imported from sheet.png using manifest/ui-atlas.json, or in Phaser using this.load.atlas with manifest/phaser-atlas.json."] : []),
    ...(hasSpineExport ? ["- Spine export is an attachment-swap runtime bridge; spine/rig-template adds an editable scaffold and quality.json, but its part layers are heuristic and need precise replacement for production rigs."] : []),
    ...(hasSam3Layers ? ["- spine/sam3-layers contains AI-generated mask cutouts from the latest completed layer-separation job for this pack; inspect quality.json before using it as final rig art."] : []),
    sheetImportNote,
    "",
  ];
  return `${lines.join("\n")}\n`;
}

export function packZipFrames(pack) {
  const sheetColumns = Math.max(1, Math.round(positiveNumber(pack.zipSheet?.columns, pack.metadata?.columns || 1)));
  const cellWidth = positiveNumber(pack.zipSheet?.cellWidth, pack.metadata?.cellWidth || 512);
  const cellHeight = positiveNumber(pack.zipSheet?.cellHeight, pack.metadata?.cellHeight || 512);
  const actionSheetByFrameId = new Map();
  for (const sheet of pack.zipActionSheets || []) {
    for (const frame of sheet.frames || []) {
      if (!frame.id) continue;
      actionSheetByFrameId.set(frame.id, {
        sheet: sheet.path,
        x: positiveNumber(frame.column, 0) * positiveNumber(sheet.cellWidth, cellWidth),
        y: positiveNumber(frame.row, 0) * positiveNumber(sheet.cellHeight, cellHeight),
        width: positiveNumber(sheet.cellWidth, cellWidth),
        height: positiveNumber(sheet.cellHeight, cellHeight),
      });
    }
  }
  return (pack.frames || []).map((frame, index) => {
    const result = frame.result || {};
    const dimensions = frame.dimensions || {};
    const row = Number.isFinite(Number(frame.row)) ? Number(frame.row) : Math.floor(index / sheetColumns);
    const column = Number.isFinite(Number(frame.column)) ? Number(frame.column) : index % sheetColumns;
    return {
      id: frame.id,
      key: safeLibrarySegment(frame.id || frame.label || `frame-${index + 1}`),
      label: frame.label || frame.id || `Frame ${index + 1}`,
      index: Number.isFinite(Number(frame.index)) ? Number(frame.index) : index,
      row,
      column,
      direction: frame.direction ?? null,
      action: frame.action ?? null,
      actionFrame: frame.actionFrame ?? null,
      clip: frame.clip ?? frame.action ?? null,
      loop: frame.loop ?? null,
      fps: frame.fps ?? null,
      sourcePath: result.fileKey ? `frames/original/${packFrameZipName(frame, index)}` : null,
      transparentPath: pack.zipTransparentFrames?.[frame.id] || null,
      path: pack.zipTransparentFrames?.[frame.id] || (result.fileKey ? `frames/original/${packFrameZipName(frame, index)}` : null),
      filename: result.filename || null,
      promptId: frame.promptId,
      seed: frame.seed,
      status: frame.status,
      width: dimensions.width || null,
      height: dimensions.height || null,
      sheetRect: pack.zipSheet
        ? {
            sheet: pack.zipSheet.path || "sheet.png",
            x: column * cellWidth,
            y: row * cellHeight,
            width: cellWidth,
            height: cellHeight,
          }
        : null,
      actionSheetRect: actionSheetByFrameId.get(frame.id) || null,
      contentType: result.contentType || null,
    };
  });
}

export function packAnimations(pack, frames) {
  if (pack.packKind !== "sprite-actions") return [];
  const usable = frames.filter((frame) => frame.path);
  const baseKey = safeLibrarySegment(pack.preset || "sprite-actions");
  // 4 方向行走（quality-WIP）：当每帧都带 direction 时，按朝向拆成多个行走 clip
  // （列=帧，按 index 升序）；否则保持单一动画，向后兼容既有动作包。
  const directional = usable.length > 0 && usable.every((frame) => frame.direction);
  if (directional) {
    const order = [];
    const groups = new Map();
    for (const frame of usable) {
      if (!groups.has(frame.direction)) {
        groups.set(frame.direction, []);
        order.push(frame.direction);
      }
      groups.get(frame.direction).push(frame);
    }
    return order.map((direction) => ({
      key: `${baseKey}-${safeLibrarySegment(direction)}`,
      direction,
      frameRate: 8,
      repeat: -1,
      frames: groups.get(direction).slice().sort((a, b) => (Number(a.index) || 0) - (Number(b.index) || 0)),
    }));
  }
  const actionClip = usable.length > 0 && usable.some((frame) => frame.action || frame.clip);
  if (actionClip) {
    const order = [];
    const groups = new Map();
    for (const frame of usable) {
      const action = frame.action || frame.clip || "default";
      if (!groups.has(action)) {
        groups.set(action, []);
        order.push(action);
      }
      groups.get(action).push(frame);
    }
    return order.map((action) => {
      const actionFrames = groups.get(action).slice().sort((a, b) => {
        const aFrame = Number.isFinite(Number(a.actionFrame)) ? Number(a.actionFrame) : Number(a.column);
        const bFrame = Number.isFinite(Number(b.actionFrame)) ? Number(b.actionFrame) : Number(b.column);
        if (Number.isFinite(aFrame) && Number.isFinite(bFrame) && aFrame !== bFrame) return aFrame - bFrame;
        return (Number(a.index) || 0) - (Number(b.index) || 0);
      });
      const first = actionFrames[0] || {};
      const frameRate = positiveNumber(first.fps, 8);
      return {
        key: `${baseKey}-${safeLibrarySegment(action)}`,
        action,
        frameRate,
        repeat: first.loop === false ? 0 : -1,
        frames: actionFrames,
      };
    });
  }
  return [
    {
      key: baseKey,
      frameRate: 8,
      repeat: -1,
      frames: usable,
    },
  ];
}

export function packFrameZipName(frame, index) {
  const order = Number.isFinite(Number(frame.index)) ? Number(frame.index) + 1 : index + 1;
  const label = frame.id || frame.label || frame.result?.filename || `frame-${order}`;
  const source = frame.result?.filename || `${safeLibrarySegment(label)}.png`;
  const extension = source.includes(".") ? source.slice(source.lastIndexOf(".")).toLowerCase() : ".png";
  return `${String(order).padStart(2, "0")}-${safeLibrarySegment(label)}${extension}`;
}

export function packFrameAlphaZipName(frame, index) {
  return packFrameZipName(frame, index).replace(/(\.[^.]+)?$/, "_alpha.png");
}

export function frameStatusCounts(frames) {
  const counts = {
    total: frames.length,
    complete: 0,
    failed: 0,
    pending: 0,
  };
  for (const frame of frames) {
    if (frame.status === "complete" || frame.status === "success") counts.complete += 1;
    else if (["error", "failed", "complete_no_result"].includes(frame.status)) counts.failed += 1;
    else counts.pending += 1;
  }
  return counts;
}

export function packStatusFromCounts(counts) {
  if (counts.total > 0 && counts.complete === counts.total) return "complete";
  if (counts.failed > 0 && counts.complete + counts.failed >= counts.total) return "error";
  if (counts.complete > 0 || counts.failed > 0) return "partial";
  return "queued";
}

export function packItemBrief(normalized, preset, item) {
  const sourceBrief = safeString(normalized.brief);
  if (preset.kind === "ui-pack") {
    return [
      `Generate exactly one UI component: ${item.prompt}.`,
      `Use this visual theme only: ${sourceBrief}.`,
      preset.shared,
      "Do not include any other UI components from the theme list; no sheet, no collage, no labels, no extra icons.",
    ].filter(Boolean).join("; ");
  }
  if (preset.kind === "icon-pack") {
    return [
      `Generate exactly one inventory icon: ${item.prompt}.`,
      `Use this visual theme only: ${sourceBrief}.`,
      preset.shared,
      "Do not include other inventory items from the theme list; no sheet, no collage, no labels.",
    ].filter(Boolean).join("; ");
  }
  if (preset.kind === "tile-pack") {
    return [
      `Generate exactly one seamless terrain tile: ${item.prompt}.`,
      `Use this visual theme only: ${sourceBrief}.`,
      preset.shared,
      "Do not include other terrain types from the theme list; no sheet, no collage, no border.",
    ].filter(Boolean).join("; ");
  }
  return [sourceBrief, item.prompt, preset.shared].filter(Boolean).join("; ");
}
