import { createZipBlob } from "./binary.js";

export const OFFICIAL_SAMPLE_MANIFEST_CACHE_SECONDS = 300;

const OFFICIAL_SAMPLE_BASE_PATH = "/assets/generated/official/";
const OFFICIAL_SAMPLE_ZIP_CACHE_SECONDS = 3600;

export const OFFICIAL_SAMPLE_PACKS = [
  {
    id: "sample-monster-actions",
    title: "怪物动作四帧",
    preset: "monster-actions",
    assetType: "creature",
    style: "pixel",
    camera: "front",
    brief: "一只深色甲壳怪物，清楚头部、身体、前爪、腿和尾部；像素风，正面游戏精灵，完整身体居中，纯色背景，需要 idle、move、attack、death 四帧动作",
    summary: "Idle / Move / Attack / Death 真实输出样本，用作当前 2D 怪物动作和 SAM3 Spine 回归基线。",
    tags: ["monster", "sprite", "sam3"],
    files: [
      ["monster-idle.png", "Idle"],
      ["monster-move.png", "Move"],
      ["monster-attack.png", "Attack"],
      ["monster-death.png", "Death"],
    ],
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

export function getOfficialSamplesDemo() {
  return {
    ok: true,
    samples: OFFICIAL_SAMPLE_PACKS.map((sample) => officialSampleManifest(sample)),
  };
}

export async function downloadOfficialSampleZip(sampleId, request, env, ctx = null) {
  const sample = OFFICIAL_SAMPLE_PACKS.find((item) => item.id === sampleId);
  if (!sample) throw httpError(404, "Official sample not found.", "not_found");
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

  for (const [filename, label] of sample.files || []) {
    const bytes = await readOfficialSampleAsset(request, env, filename);
    files.push({
      path: `frames/${officialSampleZipSegment(label || filename)}.png`,
      bytes,
    });
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

function officialSampleGeneratorPath(sample) {
  const params = new URLSearchParams();
  if (sample.preset) params.set("preset", sample.preset);
  if (sample.assetType) params.set("assetType", sample.assetType);
  if (sample.style) params.set("style", sample.style);
  if (sample.camera) params.set("camera", sample.camera);
  if (sample.brief) params.set("brief", sample.brief);
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
    ...(sample.files || []).map(([filename, label]) => `- ${label || filename}: frames/${officialSampleZipSegment(label || filename)}.png`),
    "",
  ].join("\n");
}

async function readOfficialSampleAsset(request, env, filename) {
  const safeName = safeString(filename);
  if (!safeName || safeName.includes("/") || safeName.includes("\\") || safeName.includes("..")) {
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
