import { createZipBlob } from "./binary.js";
import { composePackSheetBundlePng } from "./image.js";

export const OFFICIAL_SAMPLE_MANIFEST_CACHE_SECONDS = 300;

const OFFICIAL_SAMPLE_BASE_PATH = "/assets/generated/official/";
const OFFICIAL_SAMPLE_ZIP_CACHE_SECONDS = 3600;
const OFFICIAL_MONSTER_ACTIONS_PACK_ID = "db8c0fff-918e-4e76-baef-9064e9b47052";
const OFFICIAL_MONSTER_ACTIONS_FRAME_COUNT = 8;
const OFFICIAL_MONSTER_ACTIONS_BRIEF = "同一只红黑色甲壳怪物，橙红背刺，深色腹甲，弯尾，尖牙大嘴，完整身体居中，纯色背景；生成 idle、move、attack、death 四个动作 clip，每个动作 8 帧；每一帧必须是不同关键姿势，保持同一怪物身份和比例";
const OFFICIAL_MONSTER_ACTION_FILES = monsterActionFiles(OFFICIAL_MONSTER_ACTIONS_FRAME_COUNT);

export const OFFICIAL_SAMPLE_PACKS = [
  {
    id: "sample-monster-actions",
    title: "怪物动作 4×8 帧",
    preset: "monster-actions",
    assetType: "creature",
    style: "pixel",
    camera: "front",
    brief: OFFICIAL_MONSTER_ACTIONS_BRIEF,
    summary: "Idle / Move / Attack / Death 四个动作 clip，每个动作 8 帧；用于当前 2D 怪物动作、Sprite Sheet、Godot/Unity 导入和 SAM3 Spine 回归基线。",
    tags: ["monster", "sprite", "sam3"],
    demoPackId: OFFICIAL_MONSTER_ACTIONS_PACK_ID,
    cacheVersion: "monster-actions-4x8-motion-v1",
    staticZip: "monster-actions-official-sample.zip",
    files: OFFICIAL_MONSTER_ACTION_FILES,
  },
  {
    id: "sample-skill-vfx",
    title: "技能特效四帧",
    preset: "skill-vfx",
    assetType: "vfx",
    style: "pixel",
    camera: "front",
    brief: "像素风雷火技能特效，蓝紫闪电缠绕金色火花；需要 charge、burst、impact、fade 四帧循环，居中，纯色背景，轮廓清晰",
    summary: "Charge / Burst / Impact / Fade 真实输出样本，用于校准 VFX 帧表节奏和透明导出。",
    tags: ["vfx", "sprite", "sheet"],
    files: [
      ["skill-vfx-charge.png", "Charge"],
      ["skill-vfx-burst.png", "Burst"],
      ["skill-vfx-impact.png", "Impact"],
      ["skill-vfx-fade.png", "Fade"],
    ],
  },
  {
    id: "sample-map-tiles",
    title: "地图 Tile 样本",
    preset: "map-tiles",
    assetType: "map",
    style: "pixel",
    camera: "top-down",
    brief: "俯视 RPG 地图 tile 表：草地、泥路、石路、水边、悬崖、沙地、森林地表、熔岩岩地；需要可平铺方块",
    summary: "俯视地形 tile 真实输出样本，用于检查视角、边缘连续性和 tileability。",
    tags: ["map", "tile", "top-down"],
    files: [
      ["map-grass.png", "Grass"],
      ["map-stone-road.png", "Stone"],
      ["map-water-edge.png", "Water"],
      ["map-forest-floor.png", "Forest"],
    ],
  },
  {
    id: "sample-ui-kit",
    title: "奇幻 UI 套件",
    preset: "ui-kit",
    assetType: "ui",
    style: "production",
    camera: "front",
    brief: "奇幻游戏 UI 套件：生命条、法力条、背包格、动作按钮、对话面板、任务面板、九宫格角件、装饰分隔线；每格一个可切图组件",
    summary: "4x2 UI 组件 sheet 和 HUD 真实输出样本，用于检查组件可切性、边框完整度和材质一致性。",
    tags: ["ui", "atlas", "hud"],
    files: [
      ["ui-kit-components-sheet.png", "Components"],
      ["ui-modern-hud.png", "HUD"],
    ],
  },
  {
    id: "sample-ui-icons",
    title: "物品图标样本",
    preset: "ui-icons",
    assetType: "icon",
    style: "pixel",
    camera: "front",
    brief: "RPG 背包图标表：玉剑、红药水、盾、钥匙、金币、卷轴、宝石、靴子；每格一个物品",
    summary: "背包和奖励图标真实输出样本，用于检查单格清晰度和光照统一。",
    tags: ["icon", "item", "inventory"],
    files: [
      ["item-gem.png", "Gem"],
      ["item-jade-sword.png", "Sword"],
      ["item-shield.png", "Shield"],
    ],
  },
];

function monsterActionFiles(frameCount) {
  return ["idle", "move", "attack", "death"].flatMap((action) => (
    Array.from({ length: frameCount }, (_, index) => [
      `monster-actions/${action}-${index + 1}.png`,
      `${action[0].toUpperCase()}${action.slice(1)} ${index + 1}`,
    ])
  ));
}

export function getOfficialSamplesDemo() {
  return {
    ok: true,
    samples: OFFICIAL_SAMPLE_PACKS.map((sample) => officialSampleManifest(sample)),
  };
}

export async function downloadOfficialSampleZip(sampleId, request, env, ctx = null) {
  const sample = OFFICIAL_SAMPLE_PACKS.find((item) => item.id === sampleId);
  if (!sample) throw httpError(404, "Official sample not found.", "not_found");
  if (sample.staticZip) return await downloadStaticOfficialSampleZip(sample, request, env);
  const cached = await cachedOfficialSampleZipResponse(sample, request);
  if (cached) return cached;

  const encoder = new TextEncoder();
  const manifest = officialSampleManifest(sample);
  const files = [
    {
      path: "manifest.json",
      bytes: encoder.encode(JSON.stringify(manifest, null, 2)),
    },
    {
      path: "README.txt",
      bytes: encoder.encode(officialSampleReadme(sample)),
    },
  ];
  const frameFiles = [];
  const frameRecords = [];

  for (const [filename, label] of sample.files || []) {
    const index = frameRecords.length;
    const bytes = await readOfficialSampleAsset(request, env, filename);
    const frame = officialSampleFrameRecord(sample, filename, label, index);
    const path = `frames/${officialSampleZipSegment(label || filename)}.png`;
    frameRecords.push(frame);
    frameFiles.push({ path, bytes, frame, index });
    files.push({
      path,
      bytes,
    });
  }
  const exportPack = officialSampleExportPack(sample, frameRecords);
  const sheetBundle = frameFiles.length
    ? await composePackSheetBundlePng(exportPack, frameFiles, {
        includeSheet: true,
        includeClipSheets: exportPack.packKind === "sprite-actions",
      }).catch((error) => {
        console.warn("Official sample sheet compose failed", error);
        return null;
      })
    : null;
  const sheet = sheetBundle?.sheet || null;
  const actionSheets = (sheetBundle?.clipSheets || []).map(officialSampleSheetMetadata);
  const exportManifest = officialSampleEngineManifest(exportPack, {
    sheet: officialSampleSheetMetadata(sheet),
    actionSheets,
  });
  files.splice(
    1,
    0,
    {
      path: "manifest/engine-import.json",
      bytes: encoder.encode(JSON.stringify(exportManifest, null, 2)),
    },
    {
      path: "manifest/phaser-animations.json",
      bytes: encoder.encode(JSON.stringify(officialSamplePhaserManifest(exportManifest), null, 2)),
    },
    {
      path: "manifest/unity-sprites.json",
      bytes: encoder.encode(JSON.stringify(officialSampleUnityManifest(exportManifest), null, 2)),
    },
    {
      path: "manifest/godot-sprites.json",
      bytes: encoder.encode(JSON.stringify(officialSampleGodotManifest(exportManifest), null, 2)),
    },
  );
  if (sheet) files.push({ path: "sheet.png", bytes: sheet.bytes });
  for (const actionSheet of sheetBundle?.clipSheets || []) {
    files.push({ path: actionSheet.path, bytes: actionSheet.bytes });
  }

  const zip = await createZipBlob(files);
  const body = new Uint8Array(await zip.arrayBuffer());
  const response = new Response(body, {
    headers: {
      ...officialSampleZipHeaders(sample, "miss"),
    },
  });
  const cachePromise = cacheOfficialSampleZipResponse(sample, request, response).catch((error) => {
    console.warn("Official sample ZIP cache write failed", error);
  });
  if (ctx?.waitUntil) {
    ctx.waitUntil(cachePromise);
  } else {
    await cachePromise;
  }
  return response;
}

async function downloadStaticOfficialSampleZip(sample, request, env) {
  const response = await env.ASSETS.fetch(buildAssetRequest(request, `${OFFICIAL_SAMPLE_BASE_PATH}${sample.staticZip}`));
  if (!response.ok) {
    throw httpError(404, `Official sample ZIP not found: ${sample.staticZip}`, "not_found");
  }
  const headers = officialSampleZipHeaders(sample, "static");
  const contentLength = response.headers.get("content-length");
  if (contentLength) headers["content-length"] = contentLength;
  return new Response(response.body, {
    status: 200,
    headers,
  });
}

async function cachedOfficialSampleZipResponse(sample, request) {
  const cache = globalThis.caches?.default;
  if (!cache) return null;
  const cacheRequest = officialSampleZipCacheRequest(sample, request);
  const cached = await cache.match(cacheRequest);
  if (!cached) return null;
  const headers = officialSampleZipHeaders(sample, "hit");
  const cachedHeaders = new Headers(cached.headers);
  const contentLength = cachedHeaders.get("content-length");
  if (contentLength) headers["content-length"] = contentLength;
  return new Response(cached.body, {
    status: cached.status,
    headers,
  });
}

async function cacheOfficialSampleZipResponse(sample, request, response) {
  const cache = globalThis.caches?.default;
  if (!cache || response.status !== 200) return;
  const cacheRequest = officialSampleZipCacheRequest(sample, request);
  const cacheResponse = new Response(response.clone().body, {
    status: response.status,
    headers: {
      ...officialSampleZipHeaders(sample, "stored"),
    },
  });
  await cache.put(cacheRequest, cacheResponse);
}

function officialSampleZipCacheRequest(sample, request) {
  const url = new URL(request.url);
  url.pathname = `/api/demo/official-samples/${encodeURIComponent(sample.id)}/download.zip`;
  url.search = "";
  if (sample.cacheVersion) url.searchParams.set("v", sample.cacheVersion);
  url.hash = "";
  return new Request(url.toString(), { method: "GET" });
}

function officialSampleZipHeaders(sample, cacheStatus) {
  const filename = `${officialSampleZipSegment(sample.preset || sample.id)}-official-sample.zip`;
  return {
    "content-type": "application/zip",
    "content-disposition": `attachment; filename="${filename}"`,
    "cache-control": `public, max-age=${OFFICIAL_SAMPLE_ZIP_CACHE_SECONDS}`,
    "access-control-allow-origin": "*",
    "x-lingji-official-sample": sample.id,
    "x-lingji-official-sample-cache": cacheStatus,
  };
}

function officialSampleManifest(sample) {
  return {
    version: 1,
    kind: "official-sample",
    id: sample.id,
    title: sample.title,
    preset: sample.preset,
    assetKind: sample.assetType === "creature" ? "pack" : "2d",
    input: {
      brief: sample.brief,
      assetType: sample.assetType,
      style: sample.style,
      camera: sample.camera,
      preset: sample.preset,
    },
    summary: sample.summary,
    tags: sample.tags || [],
    demoPackId: sample.demoPackId || "",
    assetVersion: sample.cacheVersion || "",
    files: (sample.files || []).map(([filename, label], index) => ({
      index,
      label,
      filename,
      path: `frames/${officialSampleZipSegment(label || filename)}.png`,
      url: `${OFFICIAL_SAMPLE_BASE_PATH}${filename}`,
    })),
    generatorUrl: officialSampleGeneratorPath(sample),
    zipUrl: `/api/demo/official-samples/${encodeURIComponent(sample.id)}/download.zip`,
  };
}

function officialSampleExportPack(sample, frames) {
  const columns = sample.preset === "monster-actions" ? OFFICIAL_MONSTER_ACTIONS_FRAME_COUNT : Math.max(1, Math.min(4, frames.length || 1));
  return {
    packId: sample.demoPackId || sample.id,
    kind: "official-sample",
    status: "complete",
    preset: sample.preset,
    packKind: officialSamplePackKind(sample),
    input: {
      brief: sample.brief,
      assetType: sample.assetType,
      style: sample.style,
      camera: sample.camera,
      preset: sample.preset,
    },
    metadata: {
      cellWidth: 512,
      cellHeight: 512,
      columns,
      rows: Math.max(1, Math.ceil((frames.length || 1) / columns)),
      frameRate: sample.preset === "monster-actions" ? 8 : 8,
    },
    frames,
  };
}

function officialSamplePackKind(sample) {
  if (sample.preset === "monster-actions" || sample.preset === "skill-vfx") return "sprite-actions";
  if (sample.preset === "map-tiles") return "tile-pack";
  if (sample.preset === "ui-icons") return "icon-pack";
  if (sample.preset === "ui-kit") return "ui-pack";
  return "asset-pack";
}

function officialSampleFrameRecord(sample, filename, label, index) {
  const actionInfo = officialSampleActionInfo(sample, label, index);
  const columns = sample.preset === "monster-actions" ? OFFICIAL_MONSTER_ACTIONS_FRAME_COUNT : Math.max(1, Math.min(4, sample.files?.length || 1));
  return {
    id: actionInfo.id,
    label: label || filename,
    index,
    row: Math.floor(index / columns),
    column: index % columns,
    action: actionInfo.action,
    clip: actionInfo.action,
    actionFrame: actionInfo.frame,
    loop: actionInfo.loop,
    fps: actionInfo.fps,
    dimensions: { width: 512, height: 512 },
    result: {
      filename,
      contentType: "image/png",
      fileKey: `official/${filename}`,
    },
  };
}

function officialSampleActionInfo(sample, label, index) {
  if (sample.preset === "monster-actions") {
    const match = String(label || "").match(/^([a-z]+)\s+(\d+)/i);
    const action = (match?.[1] || "action").toLowerCase();
    return {
      id: `${action}_${Math.max(0, Number(match?.[2] || index + 1) - 1)}`,
      action,
      frame: Math.max(0, Number(match?.[2] || index + 1) - 1),
      loop: action === "idle" || action === "move",
      fps: action === "idle" || action === "move" ? 8 : 10,
    };
  }
  if (sample.preset === "skill-vfx") {
    return {
      id: `effect_${index}`,
      action: "effect",
      frame: index,
      loop: true,
      fps: 10,
    };
  }
  return {
    id: officialSampleZipSegment(label || `frame-${index + 1}`),
    action: null,
    frame: index,
    loop: false,
    fps: 8,
  };
}

function officialSampleSheetMetadata(sheet) {
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

function officialSampleEngineManifest(pack, sheets) {
  const actionSheetByFrameId = new Map();
  for (const sheet of sheets.actionSheets || []) {
    for (const frame of sheet.frames || []) {
      if (!frame.id) continue;
      actionSheetByFrameId.set(frame.id, {
        sheet: sheet.path,
        x: Number(frame.column || 0) * Number(sheet.cellWidth || 512),
        y: Number(frame.row || 0) * Number(sheet.cellHeight || 512),
        width: Number(sheet.cellWidth || 512),
        height: Number(sheet.cellHeight || 512),
      });
    }
  }
  const frames = pack.frames.map((frame, index) => {
    const path = `frames/${officialSampleZipSegment(frame.label || frame.result?.filename || frame.id)}.png`;
    const sheetRect = sheets.sheet
      ? {
          sheet: sheets.sheet.path || "sheet.png",
          x: Number(frame.column || 0) * Number(sheets.sheet.cellWidth || 512),
          y: Number(frame.row || 0) * Number(sheets.sheet.cellHeight || 512),
          width: Number(sheets.sheet.cellWidth || 512),
          height: Number(sheets.sheet.cellHeight || 512),
        }
      : null;
    return {
      id: frame.id,
      key: officialSampleZipSegment(frame.id || frame.label || `frame-${index + 1}`),
      label: frame.label,
      index,
      row: frame.row,
      column: frame.column,
      action: frame.action,
      actionFrame: frame.actionFrame,
      clip: frame.clip,
      loop: frame.loop,
      fps: frame.fps,
      path,
      sourcePath: path,
      width: 512,
      height: 512,
      sheetRect,
      actionSheetRect: actionSheetByFrameId.get(frame.id) || null,
    };
  });
  return {
    schema: "lingji-forge.asset-pack.v1",
    packId: pack.packId,
    kind: pack.kind,
    preset: pack.preset,
    packKind: pack.packKind,
    status: pack.status,
    input: pack.input,
    cell: {
      width: pack.metadata.cellWidth,
      height: pack.metadata.cellHeight,
      columns: pack.metadata.columns,
      rows: pack.metadata.rows,
    },
    sheet: sheets.sheet,
    actionSheets: sheets.actionSheets || [],
    frames,
    animations: officialSampleAnimations(pack, frames),
    notes: [
      "Official sample ZIP includes original PNG frames, sheet.png, per-action sheets when available, and engine import manifests.",
      "For monster-actions, row = action clip and column = frame in sheet.png.",
    ],
  };
}

function officialSampleAnimations(pack, frames) {
  if (pack.packKind !== "sprite-actions") return [];
  const groups = [];
  const byAction = new Map();
  for (const frame of frames) {
    const action = frame.action || frame.clip || "animation";
    if (!byAction.has(action)) {
      byAction.set(action, []);
      groups.push(action);
    }
    byAction.get(action).push(frame);
  }
  return groups.map((action) => {
    const actionFrames = byAction.get(action).slice().sort((a, b) => Number(a.actionFrame || 0) - Number(b.actionFrame || 0));
    const first = actionFrames[0] || {};
    return {
      key: `${pack.preset}-${officialSampleZipSegment(action)}`,
      action,
      frameRate: Number(first.fps || 8),
      repeat: first.loop ? -1 : 0,
      frames: actionFrames,
    };
  });
}

function officialSamplePhaserManifest(engineManifest) {
  return {
    packId: engineManifest.packId,
    texturePrefix: officialSampleZipSegment(engineManifest.preset || "official-sample"),
    sheet: engineManifest.sheet,
    actionSheets: engineManifest.actionSheets,
    frames: engineManifest.frames.map((frame) => ({
      key: frame.key,
      url: frame.path,
      width: frame.width,
      height: frame.height,
      sheetRect: frame.sheetRect,
      actionSheetRect: frame.actionSheetRect,
    })),
    animations: engineManifest.animations.map((animation) => ({
      key: animation.key,
      frameKeys: animation.frames.map((frame) => frame.key),
      frameRate: animation.frameRate,
      repeat: animation.repeat,
    })),
  };
}

function officialSampleUnityManifest(engineManifest) {
  return {
    schema: "lingji-forge.unity-sprites.v1",
    packId: engineManifest.packId,
    preset: engineManifest.preset,
    textureType: "Sprite",
    spriteMode: engineManifest.sheet ? "MultipleSheetAndFiles" : "MultipleFiles",
    pixelsPerUnit: 100,
    pivot: { x: 0.5, y: 0.5 },
    filterMode: engineManifest.input?.style === "pixel" ? "Point" : "Bilinear",
    sheet: engineManifest.sheet,
    actionSheets: engineManifest.actionSheets,
    sprites: engineManifest.frames.map((frame) => ({
      name: frame.key,
      path: frame.path,
      width: frame.width,
      height: frame.height,
      sheetRect: frame.sheetRect,
      actionSheetRect: frame.actionSheetRect,
      action: frame.action,
      actionFrame: frame.actionFrame,
    })),
    animationClips: engineManifest.animations.map((animation) => ({
      name: animation.key,
      action: animation.action,
      sampleRate: animation.frameRate,
      loopTime: animation.repeat === -1,
      frames: animation.frames.map((frame) => frame.key),
    })),
  };
}

function officialSampleGodotManifest(engineManifest) {
  return {
    schema: "lingji-forge.godot-sprites.v1",
    packId: engineManifest.packId,
    preset: engineManifest.preset,
    sheet: engineManifest.sheet,
    actionSheets: engineManifest.actionSheets,
    import: {
      textureFilter: engineManifest.input?.style === "pixel" ? "nearest" : "linear",
      fps: engineManifest.animations[0]?.frameRate || 8,
      loop: engineManifest.animations[0]?.repeat === -1,
    },
    sprites: engineManifest.frames.map((frame) => ({
      name: frame.key,
      path: frame.path,
      size: { x: frame.width, y: frame.height },
      sheetRect: frame.sheetRect,
      actionSheetRect: frame.actionSheetRect,
      action: frame.action,
      actionFrame: frame.actionFrame,
    })),
    animations: engineManifest.animations.map((animation) => ({
      animation: animation.key,
      action: animation.action,
      loop: animation.repeat === -1,
      fps: animation.frameRate,
      frames: animation.frames.map((frame) => ({
        texture: frame.path,
        duration: 1 / animation.frameRate,
      })),
    })),
  };
}

function officialSampleGeneratorPath(sample) {
  const params = new URLSearchParams();
  if (sample.preset) params.set("preset", sample.preset);
  if (sample.assetType) params.set("assetType", sample.assetType);
  if (sample.style) params.set("style", sample.style);
  if (sample.camera) params.set("camera", sample.camera);
  if (sample.brief) params.set("brief", sample.brief);
  if (sample.demoPackId) params.set("demoPackId", sample.demoPackId);
  return `/generator/?${params.toString()}`;
}

function officialSampleReadme(sample) {
  return [
    sample.title,
    "",
    sample.summary,
    "",
    `Preset: ${sample.preset}`,
    `Generator: ${officialSampleGeneratorPath(sample)}`,
    "",
    "Files:",
    "- manifest/engine-import.json: engine-neutral frame, sheet, and animation manifest.",
    "- manifest/unity-sprites.json: Unity-friendly sprite and clip metadata.",
    "- manifest/godot-sprites.json: Godot AnimatedSprite2D metadata.",
    "- manifest/phaser-animations.json: Phaser frame keys and animation metadata.",
    "- sheet.png: full sample sprite sheet.",
    ...(sample.preset === "monster-actions" || sample.preset === "skill-vfx" ? ["- sheets/*.png: per-animation horizontal sprite sheets."] : []),
    ...(sample.files || []).map(([filename, label]) => `- ${label || filename}: frames/${officialSampleZipSegment(label || filename)}.png`),
    "",
  ].join("\n");
}

async function readOfficialSampleAsset(request, env, filename) {
  const safeName = safeOfficialSamplePath(filename);
  if (!safeName) {
    throw httpError(400, "Invalid official sample filename.", "invalid_file");
  }
  const response = await env.ASSETS.fetch(buildAssetRequest(request, `${OFFICIAL_SAMPLE_BASE_PATH}${safeName}`));
  if (!response.ok) {
    throw httpError(404, `Official sample asset not found: ${safeName}`, "not_found");
  }
  return new Uint8Array(await response.arrayBuffer());
}

function officialSampleZipSegment(value) {
  return String(value || "sample")
    .replace(/\.png$/i, "")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "sample";
}

function safeOfficialSamplePath(value) {
  const text = safeString(value);
  if (!text || text.includes("\\") || text.includes("..") || text.startsWith("/") || text.startsWith(".")) {
    return "";
  }
  const parts = text.split("/").filter(Boolean);
  if (!parts.length || parts.some((part) => !/^[a-z0-9._-]+$/i.test(part))) return "";
  return parts.join("/");
}

function buildAssetRequest(request, pathname) {
  const target = new URL(request.url);
  target.pathname = pathname;
  return new Request(target.toString(), request);
}

function safeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function httpError(status, message, code = "bad_request") {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}
