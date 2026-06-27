import { comfyFetchJson, listComfyModels, selectHunyuanModel, selectLayerSeparation, selectPoseControl, selectVideoToSprite } from "./comfy-client.js";

// 模块级缓存：能力极少变化，但 getCapabilities 既被 /api/capabilities（UI 启动）
// 又被资产包提交调用，且要处理 ~1MB object_info + 749 节点。无缓存时高并发会触发
// Worker 资源上限 → 503，并连带阻塞 pose 资产包提交。缓存 + 永不抛错来兜底。
let _capsCache = null; // { at, value }
const CAPS_TTL_MS = 60_000;

export async function getCapabilities(env, options = {}) {
  const now = Date.now();
  if (_capsCache && now - _capsCache.at < CAPS_TTL_MS) return _capsCache.value;
  try {
    const value = await computeCapabilities(env, options);
    _capsCache = { at: now, value };
    return value;
  } catch (error) {
    if (_capsCache) return _capsCache.value; // 退回上次成功结果
    return minimalCapabilities(env, options); // 最小可用，避免 503 阻塞 UI 与资产包
  }
}

function minimalCapabilities(env, options = {}) {
  return {
    ok: true,
    degraded: true,
    account: env.COMFY_ACCOUNT || "worldsmith",
    llm: { provider: "mistral", model: env.MISTRAL_MODEL || "mistral-small-latest", configured: Boolean(env.MISTRAL_API_KEY) },
    comfy: { configured: Boolean(env.COMFY_UPSTREAM_BASE && env.COMFY_API_TOKEN), upstream: env.COMFY_UPSTREAM_BASE || null, restProxy: env.COMFY_REST_PROXY_URL || null, websocket: env.COMFY_WS_URL || null, system: null, devices: [] },
    twoD: { available: true, workflow: "flux1-dev-fp8", checkpoint: "flux1-dev-fp8.safetensors" },
    poseControl: { available: false },
    canDirectionalWalk: true,
    canDirectionalWalk8: true,
    layerSeparation: { available: false },
    threeD: { available: false, workflow: "Hunyuan3D-v2 image-to-GLB", models: {}, missing: ["object_info unavailable"] },
    videoToSprite: { available: false },
    models: { checkpoints: [], controlnet: [], diffusion: [], clipVision: [], vae: [], textEncoders: [], loras: [] },
    auth: { required: Boolean(env.GENERATOR_ACCESS_TOKEN) },
    storage: { configured: Boolean(env.ASSET_BUCKET), provider: "cloudflare-r2", bucket: env.ASSET_BUCKET ? "lingji-forge-assets" : null },
    usage: {
      configured: Boolean(env.USAGE_LIMITER),
      hourlyCredits: positiveNumber(env.USAGE_HOURLY_CREDITS, options.defaultHourlyCredits ?? 240),
      dailyCredits: positiveNumber(env.USAGE_DAILY_CREDITS, options.defaultDailyCredits ?? 1200),
      costs: options.usageCosts || {},
    },
  };
}

async function computeCapabilities(env, options = {}) {
  const usageCosts = options.usageCosts || {};
  const defaultHourlyCredits = options.defaultHourlyCredits ?? 240;
  const defaultDailyCredits = options.defaultDailyCredits ?? 1200;
  const [statsResult, objectInfoResult] = await Promise.allSettled([
    comfyFetchJson(env, "/system_stats"),
    comfyFetchJson(env, "/object_info"),
  ]);
  const objectInfo = objectInfoResult.status === "fulfilled" ? objectInfoResult.value : {};
  const stats = statsResult.status === "fulfilled" ? statsResult.value : null;
  const modelLists = await listComfyModels(env);

  const hasNode = (name) => Boolean(objectInfo && objectInfo[name]);
  const hasCheckpoint = modelLists.checkpoints.includes("flux1-dev-fp8.safetensors");
  const hunyuan = selectHunyuanModel(objectInfo, env);
  const pose = selectPoseControl(objectInfo, modelLists, env);
  const videoToSprite = selectVideoToSprite(objectInfo, modelLists);
  const layerSeparation = selectLayerSeparation(objectInfo, modelLists);
  const missing3d = [];
  for (const node of [
    "ImageOnlyCheckpointLoader",
    "EmptyLatentHunyuan3Dv2",
    "Hunyuan3Dv2Conditioning",
    "VAEDecodeHunyuan3D",
    "VoxelToMesh",
    "SaveGLB",
    "CLIPVisionEncode",
  ]) {
    if (!hasNode(node)) missing3d.push(`missing node: ${node}`);
  }
  if (!hunyuan.checkpoint) missing3d.push("missing Hunyuan3D image-only checkpoint");

  return {
    ok: true,
    account: env.COMFY_ACCOUNT || "worldsmith",
    llm: {
      provider: "mistral",
      model: env.MISTRAL_MODEL || "mistral-small-latest",
      configured: Boolean(env.MISTRAL_API_KEY),
    },
    comfy: {
      configured: Boolean(env.COMFY_UPSTREAM_BASE && env.COMFY_API_TOKEN),
      upstream: env.COMFY_UPSTREAM_BASE || null,
      restProxy: env.COMFY_REST_PROXY_URL || null,
      websocket: env.COMFY_WS_URL || null,
      system: stats?.system || null,
      devices: Array.isArray(stats?.devices)
        ? stats.devices.map((device) => ({
            name: device.name,
            type: device.type,
            vram_total: device.vram_total,
            vram_free: device.vram_free,
          }))
        : [],
    },
    twoD: {
      available: hasNode("CheckpointLoaderSimple") && hasCheckpoint,
      workflow: "flux1-dev-fp8",
      checkpoint: hasCheckpoint ? "flux1-dev-fp8.safetensors" : null,
    },
    poseControl: pose,
    // 4/8 方向行走动画（character-walk-4dir / character-walk-8dir 预设）后端管线已就绪（quality-WIP）。
    // 始终暴露该能力；姿态控制（poseControl.available）可显著提升朝向一致性，但非必需。
    canDirectionalWalk: true,
    // 8 方向行走：在 4 正方向之外补四个斜向（3/4 侧身骨架插值得到）。
    canDirectionalWalk8: true,
    layerSeparation,
    threeD: {
      available: missing3d.length === 0,
      workflow: "Hunyuan3D-v2 image-to-GLB",
      models: hunyuan,
      missing: missing3d,
    },
    videoToSprite,
    models: modelLists,
    auth: {
      required: Boolean(env.GENERATOR_ACCESS_TOKEN),
    },
    storage: {
      configured: Boolean(env.ASSET_BUCKET),
      provider: "cloudflare-r2",
      bucket: env.ASSET_BUCKET ? "lingji-forge-assets" : null,
    },
    usage: {
      configured: Boolean(env.USAGE_LIMITER),
      hourlyCredits: positiveNumber(env.USAGE_HOURLY_CREDITS, defaultHourlyCredits),
      dailyCredits: positiveNumber(env.USAGE_DAILY_CREDITS, defaultDailyCredits),
      costs: {
        prompt: usageCosts.prompt,
        generate2d: usageCosts.generate2d,
        generate2dPackFrame: usageCosts.generate2dPackFrame,
        generateLayerSeparation: usageCosts.generateLayerSeparation,
        generate3d: usageCosts.generate3d,
        prepareVideoSprite: usageCosts.prepareVideoSprite,
        generateVideoSprite: usageCosts.generateVideoSprite,
      },
    },
  };
}

function positiveNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
