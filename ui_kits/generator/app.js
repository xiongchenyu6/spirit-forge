const state = {
  mode: "2d",
  animationRoute: "frames",
  capabilities: null,
  plan: null,
  last2d: null,
  last2dDimensions: null,
  last3d: null,
  lastVideoSprite: null,
  videoDemos: [],
  activeVideoDemoId: null,
  activeInput: null,
  history: [],
  cloudPacks: [],
  cloudJobs: [],
  lastUsage: null,
  pack: null,
  packResults: {},
  packFrameObjectUrls: {},
  packPreviewObjectUrls: [],
  packPreviewTimer: null,
  packDownloadGeneration: 0,
  lastLayerSeparation: null,
  layerPolling: null,
  singleAlphaRequest: 0,
  activeQueuePromptId: null,
  polling: null,
  packPolling: null,
  queuePolling: null,
  animationFrames: null,
  gifBusy: false,
  walkMode: 4,
  rewardBusy: false,
  rewardAdTimer: null,
};

const $ = (selector) => document.querySelector(selector);
const els = {
  modeTabs: document.querySelectorAll(".mode-tab"),
  assetType: $("#assetType"),
  style: $("#style"),
  camera: $("#camera"),
  preset: $("#preset"),
  assetBlueprint: $("#assetBlueprint"),
  actionStrength: $("#actionStrength"),
  brief: $("#brief"),
  planBtn: $("#planBtn"),
  generate2dBtn: $("#generate2dBtn"),
  generatePackBtn: $("#generatePackBtn"),
  generate3dBtn: $("#generate3dBtn"),
  capabilityPill: $("#capabilityPill"),
  routeOptions: document.querySelectorAll(".route-option"),
  llmStatus: $("#llmStatus"),
  comfyStatus: $("#comfyStatus"),
  twoDStatus: $("#twoDStatus"),
  poseStatus: $("#poseStatus"),
  layerStatus: $("#layerStatus"),
  threeDStatus: $("#threeDStatus"),
  videoStatus: $("#videoStatus"),
  videoRouteStatus: $("#videoRouteStatus"),
  routeComparison: $("#routeComparison"),
  routeRecommendation: $("#routeRecommendation"),
  motionControlSection: $("#motionControlSection"),
  motionControlStatus: $("#motionControlStatus"),
  motionControlPreview: $("#motionControlPreview"),
  motionControlDetail: $("#motionControlDetail"),
  routeAbSection: $("#routeAbSection"),
  routeAbComparison: $("#routeAbComparison"),
  routeAbStatus: $("#routeAbStatus"),
  promptPlan: $("#promptPlan"),
  warningList: $("#warningList"),
  authSection: $("#authSection"),
  accessToken: $("#accessToken"),
  saveAccessTokenBtn: $("#saveAccessTokenBtn"),
  authStatus: $("#authStatus"),
  usageSection: $("#usageSection"),
  refreshUsageBtn: $("#refreshUsageBtn"),
  usageHourly: $("#usageHourly"),
  usageHourlyReset: $("#usageHourlyReset"),
  usageDaily: $("#usageDaily"),
  usageDailyReset: $("#usageDailyReset"),
  usageCosts: $("#usageCosts"),
  usageGuidance: $("#usageGuidance"),
  usageStatus: $("#usageStatus"),
  queueSection: $("#queueSection"),
  refreshQueueBtn: $("#refreshQueueBtn"),
  queueRunning: $("#queueRunning"),
  queuePending: $("#queuePending"),
  queueStatus: $("#queueStatus"),
  cloudJobsSection: $("#cloudJobsSection"),
  refreshJobsBtn: $("#refreshJobsBtn"),
  cloudJobList: $("#cloudJobList"),
  cloudJobStatus: $("#cloudJobStatus"),
  historyList: $("#historyList"),
  clearHistoryBtn: $("#clearHistoryBtn"),
  emptyState: $("#emptyState"),
  resultImage: $("#resultImage"),
  resultVideo: $("#resultVideo"),
  resultGrid: $("#resultGrid"),
  modelViewer: $("#modelViewer"),
  stageOverlay: $("#stageOverlay"),
  stageStatus: $("#stageStatus"),
  download2d: $("#download2d"),
  downloadTransparent: $("#downloadTransparent"),
  downloadSheet: $("#downloadSheet"),
  downloadGif: $("#downloadGif"),
  downloadMetadata: $("#downloadMetadata"),
  downloadZip: $("#downloadZip"),
  generateLayersBtn: $("#generateLayersBtn"),
  downloadPreview: $("#downloadPreview"),
  download3d: $("#download3d"),
  walkDirectionField: $("#walkDirectionField"),
  walkDirectionHint: $("#walkDirectionHint"),
  walkDirOptions: document.querySelectorAll(".walk-dir-option"),
  watchAdRewardBtn: $("#watchAdRewardBtn"),
  watchAdRewardLabel: $("#watchAdRewardLabel"),
  rewardStatus: $("#rewardStatus"),
};

const ALPHA_CONFIG = {
  method: "edge-connected-corner-flood",
  threshold: 34,
  feather: 22,
};
const VIDEO_SPRITE_FRAME_COUNT = 4;
const VIDEO_SPRITE_NORMALIZE_CONFIG = {
  method: "alpha-bounds-bottom-anchor-v1",
  targetMaxWidthRatio: 0.78,
  targetMaxHeightRatio: 0.82,
  baselineRatio: 0.9,
  paddingRatio: 0.06,
  minScale: 0.55,
  maxScale: 1.55,
};
const VIDEO_SPRITE_PIXEL_CLEANUP_CONFIG = {
  method: "alpha-snap-transparent-rgb-v1",
  alphaCutoff: 28,
  solidCutoff: 232,
};

const HISTORY_KEY = "lingji-forge.generator-history.v1";
const ACCESS_TOKEN_KEY = "lingji-forge.generator-access-token.v1";
const USER_ID_KEY = "lingji-forge.generator-user-id.v1";

// Animated GIF export (pure front-end, via gif-encoder.js).
const GIF_FRAME_DELAY_MS = 200;
const GIF_MAX_DIMENSION = 384;

// 4-direction (optionally 8-direction) walk scaffolding. quality-WIP: the sheet
// layout (row = direction, column = frame) is wired here, but per-direction
// animation fidelity depends entirely on the backend model behind the
// "character-walk-4dir" preset and capabilities.canDirectionalWalk.
const WALK_DIRECTIONS_4 = ["down", "left", "right", "up"];
const WALK_DIRECTIONS_8 = [
  "down", "down-left", "left", "up-left", "up", "up-right", "right", "down-right",
];
const WALK_FRAMES_PER_DIRECTION = 4;

// Tiny i18n bridge over the shared ui_kits/i18n.js global (window.__lf). Only the
// new generator strings are translated; legacy copy stays inline Chinese. Falls
// back to the provided Chinese default when the dictionary is unavailable.
function tr(key, vars, fallback) {
  const lf = typeof window !== "undefined" ? window.__lf : null;
  if (lf && typeof lf.t === "function") {
    return lf.t(`generator.${key}`, vars || {}, fallback);
  }
  return fallback;
}
const HISTORY_LIMIT = 20;
let modelViewerLoadPromise = null;

const PRESET_FRAME_COUNTS = {
  "character-actions": 4,
  "character-walk-4dir": WALK_DIRECTIONS_4.length * WALK_FRAMES_PER_DIRECTION,
  "monster-actions": 4,
  "skill-vfx": 4,
  "ui-icons": 8,
  "map-tiles": 8,
  "ui-kit": 8,
};
const CHARACTER_POSE_ORDER = ["idle", "walk", "attack", "hurt"];

const MONSTER_ACTIONS_DEMO_FRAMES = [
  { id: "idle", label: "Idle", src: "../../assets/generated/official/monster-idle.png" },
  { id: "move", label: "Move", src: "../../assets/generated/official/monster-move.png" },
  { id: "attack", label: "Attack", src: "../../assets/generated/official/monster-attack.png" },
  { id: "death", label: "Death", src: "../../assets/generated/official/monster-death.png" },
];

const PRESET_CONFIG = {
  "character-actions": {
    assetType: "character",
    style: "pixel",
    camera: "front",
    brief: "一名适合动作 RPG 的东方机关剑士，青铜机关臂，玄青披风，腰间有发光玉石核心；需要 idle、walk、attack、hurt 四帧动作",
  },
  "character-walk-4dir": {
    assetType: "character",
    style: "pixel",
    camera: "top-down",
    brief: "适合俯视角 RPG 的角色行走循环：下、左、右、上四个朝向，每个朝向 4 帧行走动画，像素风，轮廓清晰，纯色背景，居中",
  },
  "monster-actions": {
    assetType: "creature",
    style: "pixel",
    camera: "front",
    brief: "一只森林史莱姆怪物，圆润但有攻击表情；需要 idle、move、attack、death 四帧动作，轮廓清楚",
  },
  "skill-vfx": {
    assetType: "vfx",
    style: "pixel",
    camera: "front",
    brief: "像素风雷火技能特效，蓝紫闪电缠绕金色火花；需要 charge、burst、impact、fade 四帧循环，居中，纯色背景，轮廓清晰",
  },
  "ui-icons": {
    assetType: "icon",
    style: "pixel",
    camera: "front",
    brief: "RPG 背包图标表：玉剑、红药水、盾、钥匙、金币、卷轴、宝石、靴子；每格一个物品",
  },
  "map-tiles": {
    assetType: "map",
    style: "pixel",
    camera: "top-down",
    brief: "俯视 RPG 地图 tile 表：草地、泥路、石路、水边、悬崖、沙地、森林地表、熔岩岩地；需要可平铺方块",
  },
  "ui-kit": {
    assetType: "ui",
    style: "production",
    camera: "front",
    brief: "奇幻游戏 UI 套件：生命条、法力条、背包格、动作按钮、对话面板、任务面板、九宫格角件、装饰分隔线；每格一个可切图组件",
  },
};

const OFFICIAL_ASSET_BASE = "../../assets/generated/official/";
const PACK_BLUEPRINTS = {
  "character-actions": {
    icon: "user-round",
    title: "角色动作包",
    summary: "Idle / Walk / Attack / Hurt 四帧，优先用单帧定稿锁身份，完成后可导出透明帧、Sprite Sheet、JSON 和 ZIP",
    format: "4 x 512",
    qa: ["身份一致", "姿态可控", "首帧可分层"],
    exports: ["PNG", "Alpha", "Sheet", "GIF", "JSON", "ZIP"],
    samples: [
      { label: "单帧定稿", file: "ec601ceb.png" },
      { label: "像素样本", file: "3f0120ef.png" },
    ],
  },
  "character-walk-4dir": {
    icon: "compass",
    title: "方向行走包",
    summary: "下 / 左 / 右 / 上（可扩展 8 向）行走循环，按朝向分行、按帧分列，可导出 Sprite Sheet、GIF 和 ZIP。属管线脚手架，单帧质量依赖模型（quality-WIP）",
    format: "4 行 x N 帧",
    qa: ["朝向一致", "循环顺滑", "轮廓可读"],
    exports: ["PNG", "Alpha", "Sheet", "GIF", "JSON", "ZIP"],
    samples: [
      { label: "单帧定稿", file: "ec601ceb.png" },
      { label: "像素样本", file: "3f0120ef.png" },
    ],
  },
  "monster-actions": {
    icon: "ghost",
    title: "怪物动作包",
    summary: "Idle / Move / Attack / Death 四帧，是当前 2D 主线和 SAM3 Spine 分层的重点样本",
    format: "4 x 512",
    qa: ["轮廓清楚", "动作差异", "SAM3 部件"],
    exports: ["PNG", "Alpha", "Sheet", "JSON", "ZIP", "Spine"],
    samples: [
      { label: "Idle", file: "monster-idle.png" },
      { label: "Move", file: "monster-move.png" },
      { label: "Attack", file: "monster-attack.png" },
      { label: "Death", file: "monster-death.png" },
    ],
  },
  "skill-vfx": {
    icon: "sparkles",
    title: "技能特效包",
    summary: "Charge / Burst / Impact / Fade 四段式特效，适合做技能帧表、命中特效和循环预览",
    format: "4 x 512",
    qa: ["中心稳定", "节奏清楚", "无角色遮挡"],
    exports: ["PNG", "Alpha", "Sheet", "JSON", "ZIP"],
    samples: [
      { label: "Charge", file: "skill-vfx-charge.png" },
      { label: "Burst", file: "skill-vfx-burst.png" },
      { label: "Impact", file: "skill-vfx-impact.png" },
      { label: "Fade", file: "skill-vfx-fade.png" },
    ],
  },
  "ui-icons": {
    icon: "gem",
    title: "UI 图标表",
    summary: "4x2 物品图标表，每格一个图标，用于背包、掉落、装备和奖励图标批量产出",
    format: "4 x 2",
    qa: ["单格清晰", "光照一致", "无文字"],
    exports: ["PNG", "Sheet", "JSON", "ZIP"],
    samples: [
      { label: "Gem", file: "item-gem.png" },
      { label: "Sword", file: "item-jade-sword.png" },
      { label: "Shield", file: "item-shield.png" },
    ],
  },
  "map-tiles": {
    icon: "map",
    title: "地图 Tile 表",
    summary: "4x2 俯视地形 tile，重点检查视角、边缘连续性和可平铺感",
    format: "4 x 2",
    qa: ["严格俯视", "边缘可接", "无透视块"],
    exports: ["PNG", "Sheet", "JSON", "ZIP"],
    samples: [
      { label: "Grass", file: "map-grass.png" },
      { label: "Stone", file: "map-stone-road.png" },
      { label: "Water", file: "map-water-edge.png" },
      { label: "Forest", file: "map-forest-floor.png" },
    ],
  },
  "ui-kit": {
    icon: "layout-panel-top",
    title: "UI 套件表",
    summary: "4x2 UI 组件表，覆盖血条、按钮、面板、槽位和角件，适合做游戏 HUD 与系统界面素材",
    format: "4 x 2",
    qa: ["组件可切", "边框完整", "材质统一"],
    exports: ["PNG", "Sheet", "JSON", "ZIP"],
    samples: [
      { label: "Components", file: "ui-kit-components-sheet.png", wide: true },
      { label: "HUD", file: "ui-modern-hud.png", wide: true },
    ],
  },
};

const SINGLE_BLUEPRINTS = {
  square: {
    icon: "image",
    title: "单张方图",
    summary: "用于先定方向、构图和题材风格，不生成资产包清单",
    format: "768",
    qa: ["构图可读", "主体居中", "可再生产"],
    exports: ["PNG", "Alpha"],
    samples: [{ label: "Pixel", file: "3f0120ef.png" }],
  },
  portrait: {
    icon: "image",
    title: "角色立绘",
    summary: "用于头像、角色立绘和宣传图方向验证，后续可切到动作包继续生产",
    format: "768 x 1024",
    qa: ["服装清楚", "脸部稳定", "轮廓完整"],
    exports: ["PNG"],
    samples: [{ label: "Concept", file: "ec601ceb.png" }],
  },
  sprite: {
    icon: "image",
    title: "单帧 Sprite",
    summary: "用于角色或怪物定稿，适合作为动作包、视频 K 帧或 3D 生成的源图",
    format: "512",
    qa: ["完整身体", "纯色背景", "可抠图"],
    exports: ["PNG", "Alpha"],
    samples: [{ label: "Sprite", file: "3f0120ef.png" }],
  },
  icon: {
    icon: "shapes",
    title: "单枚图标",
    summary: "用于装备、材料、技能图标的单张定稿",
    format: "512",
    qa: ["轮廓清楚", "材质明确", "无文字"],
    exports: ["PNG", "Alpha"],
    samples: [{ label: "Gem", file: "item-gem.png" }],
  },
};

function currentInput() {
  const input = {
    mode: state.mode,
    brief: els.brief.value.trim(),
    assetType: els.assetType.value,
    style: els.style.value,
    camera: els.camera.value,
    preset: els.preset.value,
    actionStrength: els.actionStrength.value,
    animationRoute: state.animationRoute,
  };
  if (isDirectionalWalkPreset(input.preset)) {
    input.directions = walkDirections();
    input.framesPerDirection = WALK_FRAMES_PER_DIRECTION;
  }
  return input;
}

function presetFrameCount(value = els.preset.value) {
  const count = Number(PRESET_FRAME_COUNTS[value] || 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function isPackPreset(value = els.preset.value) {
  return presetFrameCount(value) > 0;
}

function isSpriteActionPreset(value = els.preset.value) {
  return ["character-actions", "character-walk-4dir", "monster-actions"].includes(value);
}

function isDirectionalWalkPreset(value = els.preset.value) {
  return value === "character-walk-4dir";
}

function walkDirections() {
  return state.walkMode === 8 ? WALK_DIRECTIONS_8 : WALK_DIRECTIONS_4;
}

function directionalWalkFrameCount() {
  return walkDirections().length * WALK_FRAMES_PER_DIRECTION;
}

function spriteReferenceState(value = els.preset.value) {
  if (!isSpriteActionPreset(value)) return { state: "none", ok: true };
  const result = state.last2d?.result;
  if (!result?.filename) return { state: "missing", ok: true };
  const dimensions = state.last2dDimensions || result.dimensions || null;
  if (!dimensions?.width || !dimensions?.height) {
    return {
      state: "pending",
      ok: false,
      result,
      message: "正在检测参考图尺寸",
    };
  }
  const ratio = dimensions.width / dimensions.height;
  const ok = ratio >= 0.62 && ratio <= 1.62;
  return {
    state: ok ? "single-frame" : "invalid",
    ok,
    result,
    dimensions,
    message: ok
      ? `参考图 ${dimensions.width}x${dimensions.height}`
      : `当前 2D 参考图是 ${dimensions.width}x${dimensions.height}，像是 sheet 或宽幅图；请先生成单帧角色/怪物定稿`,
  };
}

function packGenerationAvailable() {
  if (state.animationRoute === "video") {
    return Boolean(state.capabilities?.videoToSprite?.available);
  }
  if (isDirectionalWalkPreset() && !state.capabilities?.canDirectionalWalk) {
    return false;
  }
  return Boolean(state.capabilities?.twoD?.available && isPackPreset() && spriteReferenceState().ok);
}

function layerGenerationAvailable() {
  return Boolean(
    state.pack?.packId
      && packHasSpineExport(state.pack)
      && state.capabilities?.layerSeparation?.available
      && accessToken()
      && Object.keys(state.packResults || {}).length > 0,
  );
}

function applyPreset(value, forceBrief = false) {
  const config = PRESET_CONFIG[value];
  if (config) {
    els.assetType.value = config.assetType;
    els.style.value = config.style;
    els.camera.value = config.camera;
    if (forceBrief || els.brief.dataset.autofill !== "false") {
      els.brief.value = config.brief;
      els.brief.dataset.autofill = "true";
    }
  }
  updateRouteControls();
  updateWalkDirectionControls();
  renderMotionControlState();
  renderRouteComparison();
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (response.status === 401 && data?.error === "auth_required") {
    showAuthRequired("令牌缺失或无效");
  }
  if (response.status === 429 && data?.usage) {
    renderUsageState(data.usage);
    const retry = data.usage.retryAfterSeconds
      ? `约 ${Math.ceil(data.usage.retryAfterSeconds / 60)} 分钟后重试`
      : "稍后重试";
    throw new Error(`${data.message || "生成额度已达上限"} ${retry}`);
  }
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `${response.status}`);
  }
  if (path === "/api/prompt" || path.startsWith("/api/generate/") || path.includes("/layers/generate")) {
    refreshUsageStatus().catch((error) => console.warn("Usage refresh failed", error));
  }
  if (path.startsWith("/api/generate/") || path.includes("/layers/generate")) {
    refreshCloudJobsInBackground();
  }
  return data;
}

function accessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

// Optional per-user identity. When set, the backend derives hourly/daily limits
// per user-id instead of per access-token (backward compatible: empty => token
// dimension). No UI sets it today; the plumbing is forward-compatible.
function userId() {
  return localStorage.getItem(USER_ID_KEY) || "";
}

function authHeaders(extra) {
  const headers = { ...(extra || {}) };
  const token = accessToken();
  if (token) headers["x-lingji-access-token"] = token;
  const uid = userId();
  if (uid) headers["x-lingji-user-id"] = uid;
  return headers;
}

function createClientRequestId(prefix) {
  const randomPart = globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${Date.now().toString(36)}-${randomPart}`;
}

async function recoverSubmittedPack(requestId) {
  if (!requestId) return null;
  try {
    return await api(`/api/requests/2d-pack/${encodeURIComponent(requestId)}`);
  } catch (error) {
    console.warn("2D pack request recovery failed", error);
    return null;
  }
}

async function recoverSubmittedLayer(requestId) {
  if (!requestId) return null;
  try {
    return await api(`/api/requests/layer-separation/${encodeURIComponent(requestId)}`);
  } catch (error) {
    console.warn("Layer separation request recovery failed", error);
    return null;
  }
}

async function loadCapabilities() {
  try {
    const data = await api("/api/capabilities");
    state.capabilities = data;
    renderCapabilities(data);
  } catch (error) {
    els.capabilityPill.classList.add("warn");
    els.capabilityPill.querySelector("span:last-child").textContent = "连接失败";
    els.warningList.innerHTML = `<li>${escapeHtml(error.message)}</li>`;
  }
}

function renderCapabilities(data) {
  renderAuthState(data.auth);
  renderUsageConfig(data.usage);
  renderQueueConfig(data.comfy);
  renderCloudJobsConfig(data.storage);
  els.llmStatus.textContent = data.llm?.configured ? data.llm.model : "未配置";
  els.comfyStatus.textContent = data.comfy?.configured ? data.comfy.account || data.account : "未配置";
  els.twoDStatus.textContent = data.twoD?.available ? "可用" : "缺模型";
  els.poseStatus.textContent = data.poseControl?.available ? "可用" : "缺模型";
  els.layerStatus.textContent = data.layerSeparation?.available ? "SAM+模型" : "模板";
  els.threeDStatus.textContent = data.threeD?.available ? "可用" : "待安装";
  els.videoStatus.textContent = data.videoToSprite?.available ? "实验" : "待配置";
  renderAnimationRoute(data.videoToSprite);

  els.capabilityPill.classList.toggle("ready", Boolean(data.twoD?.available));
  els.capabilityPill.classList.toggle("warn", !data.threeD?.available);
  els.capabilityPill.querySelector("span:last-child").textContent = data.threeD?.available
    ? "2D / 3D 可用"
    : "2D 可用";

  const missing = [
    ...(data.poseControl?.missing || []).map((item) => `Pose: ${item}`),
    ...(data.layerSeparation?.missing || []).map((item) => `Layer: ${item}`),
    ...(data.threeD?.missing || []).map((item) => `3D: ${item}`),
    ...(data.videoToSprite?.missing || []).map((item) => `Video: ${item}`),
  ];
  els.warningList.innerHTML = missing.length
    ? missing.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "<li>无</li>";
  update3DButton();
  renderMotionControlState();
  renderRouteComparison();
  updateLayerButton();
  updateWalkDirectionControls();
  updateRewardButton();
}

function renderAnimationRoute(video = {}) {
  const videoButton = document.querySelector('[data-route="video"]');
  if (!videoButton) return;
  videoButton.disabled = !video.available;
  videoButton.classList.toggle("available", Boolean(video.available));
  els.videoRouteStatus.textContent = video.available
    ? "可 A/B 测试"
    : "节点未齐";
  if (!video.available && state.animationRoute === "video") {
    setAnimationRoute("frames");
  }
  updateRouteControls();
}

function setAnimationRoute(route) {
  if (route === "video" && !state.capabilities?.videoToSprite?.available) return;
  state.animationRoute = route === "video" ? "video" : "frames";
  els.routeOptions.forEach((button) => {
    button.classList.toggle("active", button.dataset.route === state.animationRoute);
  });
  updateRouteControls();
  renderMotionControlState();
  if (state.animationRoute === "video") {
    renderVideoRoutePlan();
  }
  renderRouteComparison();
}

function updateRouteControls() {
  if (!els.generatePackBtn) return;
  const label = els.generatePackBtn.querySelector("span");
  if (state.animationRoute === "video") {
    label.textContent = "生成视频精灵图";
    els.generatePackBtn.disabled = !packGenerationAvailable();
    els.generatePackBtn.title = "用当前 2D 源帧提交 Wan 视频任务，完成后自动抽帧导出 sprite sheet";
    return;
  }
  const frameCount = presetFrameCount();
  const referenceState = spriteReferenceState();
  label.textContent = frameCount
    ? referenceState.state === "invalid" ? "参考图不适合" : "生成资产包"
    : "整包不可用";
  els.generatePackBtn.disabled = !packGenerationAvailable();
  els.generatePackBtn.title = referenceState.state === "invalid" || referenceState.state === "pending"
    ? referenceState.message
    : frameCount
    ? `${frameCount} 帧云端资产包`
    : "当前预设只支持单张 2D 生成；请使用“生成 2D”或选择动作、地图、UI、VFX 整包预设";
}

function renderVideoRoutePlan() {
  const video = state.capabilities?.videoToSprite || {};
  renderPlan({
    kind: "video-to-sprite",
    status: state.last2d?.result ? "ready-to-generate" : "needs-source-frame",
    route: "纯色背景视频 -> 抽关键帧 -> 抠背景 -> 对齐 -> Sprite Sheet",
    detectedNodes: (video.openSourceNodes || video.detectedNodes || []).slice(0, 12),
    sourceFrame: state.last2d?.result?.filename || "先生成或选择一个 2D 角色/怪物源帧",
    targetAssets: ["monster-actions", "character-actions"],
    plannedChecks: [
      "主体身份一致性",
      "动作幅度",
      "背景可抠图程度",
      "中心点漂移",
      "帧间缩放一致性",
      "循环可用性",
    ],
    note: state.last2d?.result
      ? "当前入口会用这张 2D 源帧提交 Wan 视频任务，完成后在浏览器抽 4 个关键帧并导出透明 Sprite Sheet"
      : "先生成或恢复一张 2D 源帧，再提交纯色背景视频生成和关键帧导出",
  });
}

function renderRouteComparison() {
  renderUsageGuidance(state.lastUsage);
  renderAssetBlueprint();
  if (!els.routeComparison || !els.routeRecommendation) return;
  const decision = buildRouteDecision();
  els.routeRecommendation.textContent = decision.recommendation;
  els.routeRecommendation.classList.toggle("video", decision.recommendation.includes("视频"));
  els.routeComparison.innerHTML = `
    <p class="route-summary">${escapeHtml(decision.summary)}</p>
    <div class="route-cards">
      ${decision.cards.map((card) => `
        <article class="route-card ${card.route === state.animationRoute ? "active" : ""}">
          <div>
            <strong>${escapeHtml(card.title)}</strong>
            <span>${escapeHtml(card.cost)}</span>
          </div>
          <p>${escapeHtml(card.bestFor)}</p>
          <small>${escapeHtml(card.risk)}</small>
        </article>
      `).join("")}
    </div>
  `;
}

function renderAssetBlueprint() {
  if (!els.assetBlueprint) return;
  const preset = els.preset.value;
  const blueprint = PACK_BLUEPRINTS[preset] || SINGLE_BLUEPRINTS[preset] || singleBlueprintFromInput();
  const frameCount = presetFrameCount(preset);
  const estimate = estimateCurrentUsageCost();
  const isPack = frameCount > 0;
  const capability = blueprintCapabilityText(preset);
  const samples = Array.isArray(blueprint.samples) ? blueprint.samples : [];
  els.assetBlueprint.classList.toggle("single", !isPack);
  els.assetBlueprint.innerHTML = `
    <div class="asset-blueprint-head">
      <div class="asset-blueprint-title">
        <span class="asset-blueprint-icon"><i data-lucide="${escapeHtml(blueprint.icon || "boxes")}"></i></span>
        <div>
          <strong>${escapeHtml(blueprint.title)}</strong>
          <small>${escapeHtml(capability)}</small>
        </div>
      </div>
      <div class="asset-blueprint-cost">
        <span>${escapeHtml(estimate.label)}</span>
        <strong>${escapeHtml(String(estimate.cost))}</strong>
      </div>
    </div>
    <p>${escapeHtml(blueprint.summary)}</p>
    <div class="asset-blueprint-specs">
      <span><b>${isPack ? frameCount : 1}</b>${isPack ? "张输出" : "张预览"}</span>
      <span><b>${escapeHtml(blueprint.format || "-")}</b>规格</span>
      ${(blueprint.qa || []).map((item) => `<span><b>QA</b>${escapeHtml(item)}</span>`).join("")}
    </div>
    <div class="asset-blueprint-body">
      <div class="asset-blueprint-exports">
        ${(blueprint.exports || []).map((item) => `<code>${escapeHtml(item)}</code>`).join("")}
      </div>
      <div class="asset-blueprint-samples">
        ${samples.length
          ? samples.map((sample) => assetBlueprintSampleHtml(sample)).join("")
          : `<div class="asset-blueprint-empty">暂无官方样本</div>`}
      </div>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
}

function blueprintCapabilityText(preset) {
  if (preset === "monster-actions") return "主攻：2D 怪物动作 + SAM3 Spine";
  if (preset === "character-actions") return "主攻：2D 角色动作 + 姿态控制";
  if (preset === "character-walk-4dir") {
    return state.capabilities?.canDirectionalWalk
      ? "方向行走：4 向（可扩展 8 向）行走表"
      : "方向行走：当前后端未开启（待 canDirectionalWalk）";
  }
  if (preset === "map-tiles") return "地图：tileability QA";
  if (preset === "ui-kit" || preset === "ui-icons") return "UI：切图与导入清单";
  if (preset === "skill-vfx") return "VFX：帧表与透明导出";
  return "单张：定稿与源图准备";
}

function singleBlueprintFromInput() {
  const assetType = els.assetType.value;
  const map = {
    character: ["user-round", "角色单张", "用于角色定稿，后续可切到角色动作包"],
    creature: ["ghost", "怪物单张", "用于怪物定稿，后续可切到怪物动作包或 SAM3 分层"],
    ui: ["layout-panel-top", "UI 单件", "用于按钮、面板、HUD 元件的单张定稿"],
    map: ["map", "地图单张", "用于地形风格和俯视构图验证"],
    vfx: ["sparkles", "特效单张", "用于技能视觉方向验证，后续可切到四帧 VFX"],
    icon: ["gem", "图标单张", "用于装备、材料和技能图标定稿"],
  };
  const [icon, title, summary] = map[assetType] || ["image", "单张素材", "用于快速验证素材方向"];
  return {
    icon,
    title,
    summary,
    format: "single",
    qa: ["主体清楚", "背景可处理", "可再生产"],
    exports: ["PNG", shouldUseAlphaForSingleInput(currentInput()) ? "Alpha" : "Original"],
    samples: SINGLE_BLUEPRINTS.sprite.samples,
  };
}

function shouldUseAlphaForSingleInput(input = {}) {
  return input.assetType !== "map" && !["map-tiles", "map-tile"].includes(input.preset);
}

function assetBlueprintSampleHtml(sample) {
  const src = `${OFFICIAL_ASSET_BASE}${sample.file}`;
  return `
    <figure class="asset-blueprint-sample ${sample.wide ? "wide" : ""}">
      <img src="${escapeHtml(src)}" alt="${escapeHtml(sample.label || "")}" loading="lazy" />
      <figcaption>${escapeHtml(sample.label || sample.file)}</figcaption>
    </figure>
  `;
}

function renderMotionControlState() {
  if (!els.motionControlSection) return;
  const preset = els.preset.value;
  const isCharacterActions = preset === "character-actions";
  const isMonsterActions = preset === "monster-actions";
  if (!isCharacterActions && !isMonsterActions) {
    els.motionControlSection.hidden = true;
    return;
  }

  els.motionControlSection.hidden = false;
  const referenceState = spriteReferenceState(preset);
  const reference = referenceState.ok ? referenceImageForPack() : null;
  const referenceName = reference?.filename || "";
  const poseKnown = Boolean(state.capabilities);
  const poseAvailable = Boolean(state.capabilities?.poseControl?.available);
  const layerText = layerSeparationSummary();
  els.motionControlStatus.classList.toggle("video", false);

  if (referenceState.state === "invalid" || referenceState.state === "pending") {
    els.motionControlStatus.textContent = referenceState.state === "invalid" ? "参考图无效" : "检测参考图";
    els.motionControlDetail.textContent = referenceState.message;
    els.motionControlPreview.innerHTML = isCharacterActions
      ? CHARACTER_POSE_ORDER.map((id) => motionPoseFrameHtml(id, false)).join("")
      : ["idle", "move", "attack", "death"].map((id) => `
        <figure class="motion-action-chip">
          <strong>${escapeHtml(id)}</strong>
        </figure>
      `).join("");
    return;
  }

  if (isCharacterActions) {
    const poseActive = Boolean(reference && poseAvailable);
    els.motionControlStatus.textContent = poseActive
      ? "OpenPose 4 帧"
      : reference
        ? poseKnown ? "参考图锁定" : "Pose 检测中"
        : "待定稿";
    const detail = poseActive
      ? `参考 ${referenceName} / Idle Walk Attack Hurt`
      : reference
        ? `参考 ${referenceName} / img2img`
        : "Text-to-image / Idle Walk Attack Hurt";
    els.motionControlDetail.textContent = `${detail} / ${layerText}`;
    els.motionControlPreview.innerHTML = CHARACTER_POSE_ORDER.map((id) => motionPoseFrameHtml(id, poseActive)).join("");
    return;
  }

  els.motionControlStatus.textContent = reference ? "参考图锁定" : "独立生成";
  const detail = reference
    ? `参考 ${referenceName} / Idle Move Attack Death`
    : "Text-to-image / Idle Move Attack Death";
  els.motionControlDetail.textContent = `${detail} / ${layerText}`;
  els.motionControlPreview.innerHTML = ["idle", "move", "attack", "death"].map((id) => `
    <figure class="motion-action-chip ${reference ? "active" : ""}">
      <strong>${escapeHtml(id)}</strong>
    </figure>
  `).join("");
}

function layerSeparationSummary() {
  if (!state.capabilities) return "分层检测中";
  if (state.capabilities.layerSeparation?.available) return "SAM 分层可实验";
  if (state.capabilities.layerSeparation?.missing?.includes("missing SAM3 checkpoint")) return "缺 SAM3 模型";
  return "Spine 模板导出";
}

function motionPoseFrameHtml(id, active) {
  const src = drawPoseTemplate(id);
  return `
    <figure class="motion-pose-frame ${active ? "active" : ""}">
      <img src="${escapeHtml(src)}" alt="" />
      <figcaption>${escapeHtml(id)}</figcaption>
    </figure>
  `;
}

function renderRouteAbComparison({ status = "processing", quality = null, frames = [] } = {}) {
  if (!els.routeAbSection || !els.routeAbComparison || !els.routeAbStatus) return;
  const shouldShow = state.animationRoute === "video" || Boolean(state.lastVideoSprite);
  els.routeAbSection.hidden = !shouldShow;
  if (!shouldShow) return;

  const motion = quality?.motion || quality?.summary?.motion || null;
  const videoFrames = frames.length
    ? frames.map((frame) => ({
      label: frame.label,
      src: frame.url,
    }))
    : [];
  const isReady = status === "ready" && videoFrames.length > 0;
  els.routeAbStatus.textContent = isReady ? "已对比" : "抽帧中";
  els.routeAbStatus.classList.toggle("video", true);
  const sampleButtons = state.videoDemos.length > 1
    ? `<div class="route-ab-samples">${state.videoDemos.map((demo) => `
      <button type="button" data-video-demo-id="${escapeHtml(demo.id)}" class="${demo.id === state.activeVideoDemoId ? "active" : ""}">
        ${escapeHtml(demo.title || demo.id)}
      </button>
    `).join("")}</div>`
    : "";
  const sampleDiagnostics = state.videoDemos.length > 1
    ? `<div class="route-ab-diagnostics">${state.videoDemos.map((demo) => {
      const sampleQuality = demo.id === state.activeVideoDemoId && quality ? quality : demo.quality;
      return routeAbSampleDiagnosticHtml(demo, sampleQuality);
    }).join("")}</div>`
    : "";

  els.routeAbComparison.innerHTML = `
    ${sampleButtons}
    ${sampleDiagnostics}
    <article class="route-ab-card ${isReady ? "active" : ""}">
      <div class="route-ab-heading">
        <strong>视频 K 帧</strong>
        <span>80 点 / WEBM</span>
      </div>
      ${isReady
        ? `<div class="route-ab-strip">${videoFrames.map((frame) => routeAbFrameHtml(frame)).join("")}</div>`
        : `<div class="route-ab-empty">等待视频抽帧完成</div>`}
      <div class="route-ab-metrics">
        <span><b>${motion ? motion.motionScore : "-"}</b>动作</span>
        <span><b>${motion ? motion.loopScore : "-"}</b>循环</span>
        <span><b>${quality ? quality.score : "-"}</b>质检</span>
      </div>
    </article>
    <article class="route-ab-card">
      <div class="route-ab-heading">
        <strong>分帧生成</strong>
        <span>48 点 / 4 帧</span>
      </div>
      <div class="route-ab-strip">${MONSTER_ACTIONS_DEMO_FRAMES.map((frame) => routeAbFrameHtml(frame)).join("")}</div>
      <div class="route-ab-metrics">
        <span><b>可</b>重跑</span>
        <span><b>ZIP</b>导入</span>
        <span><b>库</b>归档</span>
      </div>
    </article>
  `;
}

function routeAbSampleDiagnosticHtml(demo, quality = {}) {
  const motion = quality?.motion || quality?.summary?.motion || null;
  const verdict = videoSpriteSampleVerdict(motion);
  return `
    <article class="route-ab-diagnostic ${demo.id === state.activeVideoDemoId ? "active" : ""} ${verdict.tone}">
      <div>
        <strong>${escapeHtml(demo.title || demo.id)}</strong>
        <span>${escapeHtml(verdict.label)}</span>
      </div>
      <dl>
        <div><dt>动作</dt><dd>${metricLabel(motion?.motionScore)}</dd></div>
        <div><dt>循环</dt><dd>${metricLabel(motion?.loopScore)}</dd></div>
        <div><dt>回环差</dt><dd>${motion?.loopDelta != null ? `${Math.round(Number(motion.loopDelta) * 100)}%` : "--"}</dd></div>
      </dl>
    </article>
  `;
}

function videoSpriteSampleVerdict(motion) {
  const loopScore = Number(motion?.loopScore);
  const motionScore = Number(motion?.motionScore);
  if (!Number.isFinite(loopScore) || !Number.isFinite(motionScore)) {
    return { label: "待抽帧", tone: "pending" };
  }
  if (loopScore < 35) {
    return { label: "强动作反例", tone: "warn" };
  }
  if (loopScore < 55) {
    return { label: "只做 A/B", tone: "trial" };
  }
  return { label: "可继续调参", tone: "pass" };
}

function metricLabel(value) {
  const n = Number(value);
  return Number.isFinite(n) ? String(Math.round(n)) : "--";
}

function routeAbFrameHtml(frame) {
  return `
    <figure class="route-ab-frame">
      <img src="${escapeHtml(frame.src)}" alt="" />
      <figcaption>${escapeHtml(frame.label)}</figcaption>
    </figure>
  `;
}

function clearRouteAbComparison() {
  if (!els.routeAbSection) return;
  els.routeAbSection.hidden = true;
  if (els.routeAbComparison) els.routeAbComparison.innerHTML = "";
}

function buildRouteDecision() {
  const input = currentInput();
  const costs = state.capabilities?.usage?.costs || {};
  const frameCount = presetFrameCount(input.preset);
  const isPack = frameCount > 0;
  const singleCost = Number(costs.generate2d) || 20;
  const packCost = isPack
    ? frameCount * (Number(costs.generate2dPackFrame) || 12)
    : singleCost;
  const videoCost = Number(costs.generateVideoSprite) || 80;
  const sourceReady = Boolean(state.last2d?.result?.filename);
  const videoResultReady = Boolean(state.lastVideoSprite?.url);
  const videoReady = Boolean(state.capabilities?.videoToSprite?.available);
  const isMotionAsset = ["character", "creature"].includes(input.assetType)
    || ["character-actions", "monster-actions"].includes(input.preset);
  const isVfx = input.assetType === "vfx" || input.preset === "skill-vfx";
  const isStaticProduction = ["map", "ui", "icon", "weapon", "prop"].includes(input.assetType)
    && !isVfx;

  let recommendation = "分帧主线";
  let summary = "分帧生成更适合当前生产：每帧可单独重跑、可进素材库、成本可预期，适合角色、怪物、UI、地图和 VFX 的可控交付";

  if (!isPack) {
    recommendation = "单张 2D 预览";
    summary = "当前预设用于先生成单张 2D 图，适合快速定角色、头像、图标或构图方向；正式生产 sprite sheet、地图、UI 或 VFX 时再切到整包预设";
  } else if (isMotionAsset) {
    recommendation = videoResultReady
      ? "视频 A/B 示例"
      : sourceReady && videoReady
        ? "分帧主线 + 视频 A/B"
        : "先分帧定稿";
    summary = videoResultReady
      ? "当前已有纯色背景 WEBM，可以直接抽关键帧、抠背景、脚底对齐并导出 Sprite Sheet；正式生产仍建议用分帧生成保底，再用视频路线比较动作连贯性"
      : sourceReady && videoReady
        ? "角色和怪物动作可以做视频 K 帧 A/B：视频路线动作更连贯，但一致性和抠背景仍要看质检；分帧路线仍是可重跑、可控、便宜的生产基线"
        : "先用分帧生成做出可用角色/怪物源帧和动作包；有稳定源帧后，再用纯色背景视频 K 帧测试动作连贯性";
  } else if (isVfx) {
    recommendation = "分帧 VFX 优先";
    summary = "技能特效四段式 charge/burst/impact/fade 更适合先走分帧生成，方便单帧重跑和控制节奏；视频 K 帧适合后续测试流体爆发感";
  } else if (isStaticProduction) {
    recommendation = "不要用视频";
    summary = "UI、地图、道具、图标不适合视频 K 帧。它们需要切图、平铺或静态构图约束，应该继续走分帧/表格生成和对应 QA";
  }

  return {
    recommendation,
    summary,
    cards: [
      {
        route: "frames",
        title: "分帧生成",
        cost: isPack ? `${packCost} 点 / ${frameCount} 帧` : `${packCost} 点 / 单张`,
        bestFor: !isPack
          ? "单张概念图、头像、图标和角色方向验证；不提交云端资产包"
          : isStaticProduction
          ? "静态素材、地图 tile、UI、图标，以及需要逐帧重跑的动作包"
          : "当前主线：可控四帧动作、素材库归档、单帧重跑和引擎 ZIP",
        risk: isPack
          ? "动作连续性取决于提示词、参考图和姿态控制；大幅动作可能牺牲角色一致性"
          : "不会生成 sprite sheet、透明帧、ZIP 或引擎导入清单；定稿后需要切换到整包预设继续生产",
      },
      {
        route: "video",
        title: "纯色视频 K 帧",
        cost: `${videoCost} 点 / WEBM`,
        bestFor: isMotionAsset
          ? videoResultReady
            ? "当前视频结果可直接抽 4 帧、抠背景、脚底对齐并导出引擎 ZIP"
            : sourceReady
              ? "已有源帧时可测试角色/怪物动作连贯性，浏览器会抽 4 帧、抠背景、脚底对齐"
              : "需要先有一张 2D 源帧，才能提交视频精灵图"
          : "主要用于角色/怪物动作实验；静态资产不建议走这条线",
        risk: videoReady
          ? "成本更高，结果依赖纯色背景和后处理；动作/循环评分低时应回到分帧基线或重调 prompt"
          : "当前 Comfy 视频节点未齐，不能提交",
      },
    ],
  };
}

function renderQueueConfig(comfy = {}) {
  const configured = Boolean(comfy.configured);
  els.queueSection.hidden = !configured;
  if (!configured) return;
  if (accessToken()) {
    refreshQueueStatus().catch((error) => {
      els.queueStatus.textContent = `队列读取失败：${error.message}`;
    });
  } else {
    renderQueueEmpty("保存访问令牌后查看队列");
  }
}

function renderCloudJobsConfig(storage = {}) {
  const configured = Boolean(storage.configured);
  els.cloudJobsSection.hidden = !configured;
  if (!configured) return;
  if (accessToken()) {
    refreshCloudJobs().catch((error) => {
      els.cloudJobStatus.textContent = `任务读取失败：${error.message}`;
    });
  } else {
    renderCloudJobsEmpty("保存访问令牌后查看云端任务");
  }
}

async function refreshCloudJobs() {
  if (!state.capabilities?.storage?.configured || !accessToken()) {
    renderCloudJobsEmpty(accessToken() ? "当前环境未启用素材存储" : "保存访问令牌后查看云端任务");
    return;
  }
  els.cloudJobStatus.textContent = "读取任务中...";
  const headers = authHeaders();
  const [jobsResponse, packsResponse] = await Promise.all([
    fetch("/api/jobs?limit=16", { headers }),
    fetch("/api/packs?limit=8", { headers }),
  ]);
  const jobsData = await jobsResponse.json().catch(() => null);
  const packsData = await packsResponse.json().catch(() => null);
  if (jobsResponse.status === 401 || packsResponse.status === 401) {
    showAuthRequired("令牌缺失或无效");
  }
  if (!jobsResponse.ok) {
    throw new Error(jobsData?.message || jobsData?.error || `${jobsResponse.status}`);
  }
  if (!packsResponse.ok) {
    throw new Error(packsData?.message || packsData?.error || `${packsResponse.status}`);
  }
  renderCloudJobsState({
    jobs: jobsData?.jobs || [],
    packs: packsData?.packs || [],
  });
}

function refreshCloudJobsInBackground() {
  if (!state.capabilities?.storage?.configured || !accessToken()) return;
  refreshCloudJobs().catch((error) => {
    els.cloudJobStatus.textContent = `任务读取失败：${error.message}`;
  });
}

function renderCloudJobsEmpty(message) {
  state.cloudPacks = [];
  state.cloudJobs = [];
  els.cloudJobList.innerHTML = `<div class="history-empty">${escapeHtml(message)}</div>`;
  els.cloudJobStatus.textContent = message;
}

function renderCloudJobsState(data = {}) {
  els.cloudJobsSection.hidden = false;
  state.cloudPacks = Array.isArray(data.packs) ? data.packs : [];
  state.cloudJobs = Array.isArray(data.jobs) ? data.jobs : [];
  if (state.cloudPacks.length === 0 && state.cloudJobs.length === 0) {
    renderCloudJobsEmpty("暂无云端任务");
    return;
  }

  const packIds = new Set(state.cloudPacks.map((pack) => pack.packId).filter(Boolean));
  const visibleJobs = state.cloudJobs.filter((job) => !job.packId || !packIds.has(job.packId));
  const packCards = state.cloudPacks.map(renderCloudPackCard);
  const jobCards = visibleJobs.map((job) => {
    const title = cloudJobTitle(job);
    const label = cloudJobKindLabel(job);
    const status = cloudJobStatusText(job.status);
    const statusClass = cloudJobStatusClass(job.status);
    const detail = [
      job.packPreset || job.input?.preset,
      job.frameLabel,
      formatHistoryTime(job.updatedAt || job.createdAt),
    ].filter(Boolean).join(" / ");
    const openLink = job.status === "complete" && job.result?.url
      ? `<a class="cloud-job-action" href="${escapeHtml(job.result.url)}" target="_blank" rel="noreferrer" aria-label="打开结果"><i data-lucide="external-link"></i></a>`
      : "";
    return `
      <article class="cloud-job" data-cloud-prompt-id="${escapeHtml(job.promptId)}">
        <button class="cloud-job-thumb" type="button" data-cloud-action="restore" aria-label="恢复云端任务">
          ${cloudJobPreview(job)}
        </button>
        <button class="cloud-job-body" type="button" data-cloud-action="restore">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(label)} · <b class="${statusClass}">${escapeHtml(status)}</b></span>
          <small>${escapeHtml(detail || job.promptId)}</small>
        </button>
        <div class="cloud-job-actions">
          <button class="cloud-job-action" type="button" data-cloud-action="restore" aria-label="恢复或继续轮询">
            <i data-lucide="rotate-ccw"></i>
          </button>
          ${openLink}
        </div>
      </article>
    `;
  });
  els.cloudJobList.innerHTML = [...packCards, ...jobCards].join("");
  els.cloudJobStatus.textContent = `云端任务已同步：${state.cloudPacks.length} 个资产包，${visibleJobs.length} 条单任务`;
  if (window.lucide) window.lucide.createIcons();
}

function renderCloudPackCard(pack) {
  const status = cloudJobStatusText(pack.status);
  const statusClass = cloudJobStatusClass(pack.status);
  const counts = pack.counts || {};
  const title = cloudPackTitle(pack);
  const detail = [
    pack.preset,
    `${counts.complete || 0}/${counts.total || pack.frames?.length || 0} 帧`,
    formatHistoryTime(pack.updatedAt || pack.createdAt),
  ].filter(Boolean).join(" / ");
  const openLink = pack.cover?.url
    ? `<a class="cloud-job-action" href="${escapeHtml(pack.cover.url)}" target="_blank" rel="noreferrer" aria-label="打开封面"><i data-lucide="external-link"></i></a>`
    : "";
  return `
    <article class="cloud-job cloud-pack" data-cloud-pack-id="${escapeHtml(pack.packId)}">
      <button class="cloud-job-thumb" type="button" data-cloud-action="restore-pack" aria-label="恢复云端资产包">
        ${cloudPackPreview(pack)}
      </button>
      <button class="cloud-job-body" type="button" data-cloud-action="restore-pack">
        <strong>${escapeHtml(title)}</strong>
        <span>资产包 · <b class="${statusClass}">${escapeHtml(status)}</b></span>
        <small>${escapeHtml(detail || pack.packId)}</small>
      </button>
      <div class="cloud-job-actions">
        <button class="cloud-job-action" type="button" data-cloud-action="restore-pack" aria-label="恢复资产包">
          <i data-lucide="folder-down"></i>
        </button>
        ${openLink}
      </div>
    </article>
  `;
}

function cloudJobPreview(job) {
  if (job.kind !== "3d" && job.result?.url && String(job.result.contentType || "").startsWith("image/")) {
    return `<img src="${escapeHtml(job.result.url)}" alt="" />`;
  }
  return `<i data-lucide="${job.kind === "3d" ? "box" : "image"}"></i>`;
}

function cloudPackPreview(pack) {
  if (pack.cover?.url && String(pack.cover.contentType || "").startsWith("image/")) {
    return `<img src="${escapeHtml(pack.cover.url)}" alt="" />`;
  }
  return `<i data-lucide="folder"></i>`;
}

function cloudPackTitle(pack) {
  const brief = pack.input?.brief;
  if (brief) return brief.length > 24 ? `${brief.slice(0, 24)}...` : brief;
  return pack.preset || pack.packKind || "云端资产包";
}

function cloudJobTitle(job) {
  if (job.groupKind === "2d-pack" && job.frameLabel) {
    return `${job.plan?.title || job.packPreset || "资产包"} / ${job.frameLabel}`;
  }
  return job.plan?.title || job.input?.brief || job.result?.filename || job.promptId || "云端任务";
}

function cloudJobKindLabel(job) {
  if (job.groupKind === "2d-pack") return "资产包";
  if (job.kind === "3d") return "3D";
  return "2D";
}

function cloudJobStatusText(status) {
  const map = {
    queued: "等待中",
    running: "运行中",
    not_in_queue: "队列未发现",
    complete: "完成",
    complete_no_result: "无结果",
    partial: "部分完成",
    success: "完成",
    error: "失败",
  };
  return map[status] || status || "未知";
}

function cloudJobStatusClass(status) {
  return `cloud-job-state-${String(status || "unknown").replace(/[^a-z0-9_-]+/gi, "-")}`;
}

function restoreCloudJob(promptId) {
  const job = state.cloudJobs.find((entry) => entry.promptId === promptId);
  if (!job) return;
  clearPoll();
  state.activeInput = job.input || currentInput();
  renderPlan({
    source: "cloud-job",
    promptId: job.promptId,
    status: job.status,
    input: job.input || null,
    plan: job.plan || null,
  });

  if (job.status === "complete" && job.result?.url) {
    if (job.kind === "3d") {
      state.last3d = { status: "complete", promptId: job.promptId, result: job.result };
      showModel(job.result.url);
    } else if (job.kind === "video-sprite") {
      showVideo(job.result.url, job.result.filename);
    } else {
      state.last2d = { status: "complete", promptId: job.promptId, result: job.result };
      showImage(job.result.url, job.result.filename);
      update3DButton();
    }
    return;
  }

  if (["error", "complete_no_result"].includes(job.status)) {
    showError(`云端任务${cloudJobStatusText(job.status)}`);
    return;
  }

  setBusy(true, "恢复轮询");
  startQueuePolling(job.promptId);
  pollJob(job.promptId, job.kind === "3d" ? "3d" : job.kind === "video-sprite" ? "video-sprite" : "2d");
}

async function restoreCloudPack(packId) {
  let pack = state.cloudPacks.find((entry) => entry.packId === packId);
  if (!pack && accessToken()) {
    const response = await fetch(`/api/packs/${encodeURIComponent(packId)}`, {
      headers: authHeaders(),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || data?.error || `${response.status}`);
    }
    pack = data.pack;
  }
  if (!pack) return;

  clearPoll();
  setBusy(true, "恢复资产包");
  let keepBusy = false;
  try {
    const restoredPack = packFromCloudManifest(pack);
    state.pack = restoredPack;
    state.packResults = {};
    state.activeInput = pack.input || currentInput();
    renderPlan({
      source: "cloud-pack",
      packId: pack.packId,
      status: pack.status,
      counts: pack.counts,
      input: pack.input || null,
      metadata: pack.metadata || null,
    });
    showPack(restoredPack.jobs, restoredPack);
    const pendingFrames = [];
    for (const frame of pack.frames || []) {
      if (frame.status === "complete" && frame.result?.url) {
        state.packResults[frame.id] = {
          ...frame.result,
          url: frame.result.url,
          label: frame.label,
          seed: frame.seed,
          promptId: frame.promptId,
          dimensions: frame.dimensions,
        };
        updatePackCard(frame.id, {
          status: "complete",
          url: frame.result.url,
          filename: frame.result.filename,
        });
      } else if (["error", "complete_no_result"].includes(frame.status)) {
        updatePackCard(frame.id, {
          status: "error",
          message: cloudJobStatusText(frame.status),
        });
      } else {
        pendingFrames.push(frame);
      }
    }

    if (pendingFrames.length > 0) {
      keepBusy = true;
      startQueuePolling(pendingFrames[0]?.promptId);
      pollPack(restoredPack);
      return;
    }

    if (Object.keys(state.packResults).length > 0) {
      await preparePackDownloads(restoredPack);
      await preparePackProductionPreview(restoredPack);
      updateLayerButton();
    } else {
      showError("云端资产包还没有可恢复的完成帧");
    }
  } finally {
    if (!keepBusy) setBusy(false);
  }
}

function packFromCloudManifest(pack) {
  const frames = Array.isArray(pack.frames) ? pack.frames : [];
  return {
    ok: true,
    kind: "2d-pack",
    packId: pack.packId,
    preset: pack.preset,
    packKind: pack.packKind,
    metadata: pack.metadata || {
      output: "separate-images",
      columns: 4,
      rows: Math.max(1, Math.ceil(frames.length / 4)),
      cellWidth: frames[0]?.dimensions?.width || 512,
      cellHeight: frames[0]?.dimensions?.height || 512,
      items: frames.map((frame, index) => ({
        id: frame.id,
        label: frame.label,
        index,
        row: Math.floor(index / 4),
        column: index % 4,
      })),
    },
    jobs: frames.map((frame) => ({
      id: frame.id,
      label: frame.label,
      promptId: frame.promptId,
      clientId: frame.clientId,
      seed: frame.seed,
      dimensions: frame.dimensions,
      pollUrl: frame.pollUrl || `/api/jobs/${frame.promptId}?kind=2d`,
    })),
  };
}

function renderUsageConfig(usage = {}) {
  const configured = Boolean(usage.configured);
  els.usageSection.hidden = !configured;
  updateRewardButton();
  if (!configured) return;
  const costs = usage.costs || {};
  els.usageCosts.innerHTML = [
    ["提示词", costs.prompt],
    ["2D", costs.generate2d],
    ["资产包/帧", costs.generate2dPackFrame],
    ["Spine 分层", costs.generateLayerSeparation],
    ["视频精灵", costs.generateVideoSprite],
    ["3D", costs.generate3d],
  ].map(([label, value]) => `<span>${escapeHtml(label)} <b>${Number(value) || 0}</b></span>`).join("");
  renderRouteComparison();
  if (accessToken()) {
    refreshUsageStatus().catch((error) => {
      els.usageStatus.textContent = `额度读取失败：${error.message}`;
    });
  } else {
    renderUsageEmpty("保存访问令牌后查看额度");
  }
}

function renderAuthState(auth = {}) {
  const required = Boolean(auth.required);
  els.authSection.hidden = !required;
  els.accessToken.value = accessToken();
  els.authStatus.textContent = required
    ? accessToken()
      ? "令牌已保存在当前浏览器"
      : "需要访问令牌才能提交生成任务"
    : "当前环境未启用访问令牌";
}

function showAuthRequired(message) {
  els.authSection.hidden = false;
  els.authStatus.textContent = message;
}

async function refreshUsageStatus() {
  if (!state.capabilities?.usage?.configured || !accessToken()) {
    renderUsageEmpty(accessToken() ? "当前环境未启用额度统计" : "保存访问令牌后查看额度");
    return;
  }
  els.usageStatus.textContent = "读取额度中...";
  const response = await fetch("/api/usage", {
    headers: authHeaders(),
  });
  const data = await response.json().catch(() => null);
  if (response.status === 401) {
    showAuthRequired("令牌缺失或无效");
  }
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `${response.status}`);
  }
  renderUsageState(data);
}

async function refreshQueueStatus() {
  if (!state.capabilities?.comfy?.configured || !accessToken()) {
    renderQueueEmpty(accessToken() ? "当前环境未配置 Comfy" : "保存访问令牌后查看队列");
    return;
  }
  const params = new URLSearchParams();
  if (state.activeQueuePromptId) params.set("promptId", state.activeQueuePromptId);
  els.queueStatus.textContent = "读取队列中...";
  const response = await fetch(`/api/queue${params.toString() ? `?${params}` : ""}`, {
    headers: authHeaders(),
  });
  const data = await response.json().catch(() => null);
  if (response.status === 401) {
    showAuthRequired("令牌缺失或无效");
  }
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `${response.status}`);
  }
  renderQueueState(data);
}

function renderQueueEmpty(message) {
  els.queueRunning.textContent = "-";
  els.queuePending.textContent = "-";
  els.queueStatus.textContent = message;
}

function renderQueueState(data = {}) {
  els.queueSection.hidden = false;
  els.queueRunning.textContent = String(data.running ?? "-");
  els.queuePending.textContent = String(data.pending ?? "-");
  els.queueStatus.textContent = queueStatusText(data);
}

function queueStatusText(data) {
  const current = data.current;
  if (!current) return `队列已同步：共 ${data.total ?? 0} 个任务`;
  if (current.state === "running") return "当前任务运行中";
  if (current.state === "pending") return `当前任务等待中，第 ${Number(current.index || 0) + 1} 位`;
  return "当前任务不在队列中，可能已完成或正在写出结果";
}

function startQueuePolling(promptId) {
  state.activeQueuePromptId = promptId || null;
  if (state.queuePolling) clearInterval(state.queuePolling);
  refreshQueueStatus().catch((error) => {
    els.queueStatus.textContent = `队列读取失败：${error.message}`;
  });
  state.queuePolling = setInterval(() => {
    refreshQueueStatus().catch((error) => {
      els.queueStatus.textContent = `队列读取失败：${error.message}`;
    });
  }, 3500);
}

function stopQueuePolling() {
  if (state.queuePolling) clearInterval(state.queuePolling);
  state.queuePolling = null;
  state.activeQueuePromptId = null;
  refreshQueueStatus().catch((error) => {
    els.queueStatus.textContent = `队列读取失败：${error.message}`;
  });
}

function renderUsageEmpty(message) {
  els.usageHourly.textContent = "-";
  els.usageDaily.textContent = "-";
  els.usageHourlyReset.textContent = "-";
  els.usageDailyReset.textContent = "-";
  state.lastUsage = null;
  renderUsageGuidance(null);
  els.usageStatus.textContent = message;
}

function renderUsageState(usage = {}) {
  state.lastUsage = usage;
  els.usageSection.hidden = false;
  els.usageHourly.textContent = `${usage.hourly?.remaining ?? "-"} / ${usage.hourly?.limit ?? "-"}`;
  els.usageDaily.textContent = `${usage.daily?.remaining ?? "-"} / ${usage.daily?.limit ?? "-"}`;
  els.usageHourlyReset.textContent = `重置 ${formatUsageReset(usage.hourly?.resetAt)}`;
  els.usageDailyReset.textContent = `重置 ${formatUsageReset(usage.daily?.resetAt)}`;
  renderUsageGuidance(usage);
  updateRewardButton();
  els.usageStatus.textContent = usage.allowed === false
    ? "当前额度已达到限制"
    : "额度已同步";
}

function formatUsageReset(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderUsageGuidance(usage) {
  if (!els.usageGuidance) return;
  if (!usage?.configured || !accessToken()) {
    els.usageGuidance.className = "usage-guidance";
    els.usageGuidance.textContent = "保存访问令牌后显示本次生成预计消耗";
    return;
  }
  const estimate = estimateCurrentUsageCost();
  const hourlyRemaining = Number(usage.hourly?.remaining ?? 0);
  const dailyRemaining = Number(usage.daily?.remaining ?? 0);
  const hourlyEnough = hourlyRemaining >= estimate.cost;
  const dailyEnough = dailyRemaining >= estimate.cost;
  const ready = hourlyEnough && dailyEnough;
  els.usageGuidance.className = `usage-guidance ${ready ? "ready" : "warn"}`;
  if (ready) {
    els.usageGuidance.textContent = `${estimate.label}预计消耗 ${estimate.cost} 灵石；当前小时和今日额度都足够`;
    return;
  }
  const missing = [
    hourlyEnough ? "" : `小时差 ${Math.max(0, estimate.cost - hourlyRemaining)}`,
    dailyEnough ? "" : `今日差 ${Math.max(0, estimate.cost - dailyRemaining)}`,
  ].filter(Boolean).join("，");
  const reset = !dailyEnough
    ? `今日重置 ${formatUsageReset(usage.daily?.resetAt)}`
    : `小时重置 ${formatUsageReset(usage.hourly?.resetAt)}`;
  els.usageGuidance.textContent = `${estimate.label}预计消耗 ${estimate.cost} 灵石；${missing}，${reset}`;
}

function estimateCurrentUsageCost() {
  const costs = state.capabilities?.usage?.costs || {};
  if (state.mode === "3d") {
    return { label: "3D 生成", cost: Number(costs.generate3d) || 120 };
  }
  if (state.animationRoute === "video") {
    return { label: "视频精灵", cost: Number(costs.generateVideoSprite) || 80 };
  }
  if (isPackPreset()) {
    const frameCost = Number(costs.generate2dPackFrame) || 12;
    if (isDirectionalWalkPreset()) {
      return { label: "方向行走包", cost: Math.max(1, directionalWalkFrameCount()) * frameCost };
    }
    const frames = presetFrameCount();
    return { label: "资产包", cost: Math.max(1, frames) * frameCost };
  }
  return { label: "单张 2D", cost: Number(costs.generate2d) || 20 };
}

function update3DButton() {
  const can3d = Boolean(state.capabilities?.threeD?.available && state.last2d?.result);
  els.generate3dBtn.disabled = !can3d;
}

function updateLayerButton(busy = false) {
  if (!els.generateLayersBtn) return;
  const available = layerGenerationAvailable();
  els.generateLayersBtn.disabled = busy || !available;
  els.generateLayersBtn.classList.toggle("disabled", busy || !available);
  els.generateLayersBtn.title = state.capabilities?.layerSeparation?.available
    ? available
      ? "用当前动作包首帧提交 SAM3 Spine 分层预览"
      : "需要完成的角色/怪物动作包和访问令牌"
    : "需要在 Comfy 安装 SAM3 checkpoint";
}

async function planPrompt() {
  setBusy(true, "整理提示词");
  try {
    const plan = await api("/api/prompt", {
      method: "POST",
      body: JSON.stringify(currentInput()),
    });
    state.plan = plan;
    renderPlan(plan);
  } catch (error) {
    renderPlan({ error: error.message });
  } finally {
    setBusy(false);
  }
}

async function generate2D() {
  clearPoll();
  revokePackFrameDownloads();
  const input = currentInput();
  state.activeInput = input;
  setBusy(true, "2D 生成中");
  showImage(null);
  try {
    const job = await api("/api/generate/2d", {
      method: "POST",
      body: JSON.stringify(input),
    });
    state.plan = job.plan;
    renderPlan(job.plan);
    startQueuePolling(job.promptId);
    pollJob(job.promptId, "2d");
  } catch (error) {
    showError(error.message);
    setBusy(false);
  }
}

async function generatePack() {
  if (state.animationRoute === "video") {
    await generateVideoSprite();
    return;
  }
  if (!isPackPreset()) {
    updateRouteControls();
    renderRouteComparison();
    showError("当前预设只支持单张 2D 生成，请点击“生成 2D”或选择可整包生成的生产预设");
    return;
  }
  const referenceState = spriteReferenceState();
  if (!referenceState.ok) {
    updateRouteControls();
    renderMotionControlState();
    showError(referenceState.message);
    return;
  }
  clearPoll();
  const input = {
    ...currentInput(),
    referenceImage: referenceImageForPack(),
    poseImages: poseImagesForPack(),
    requestId: createClientRequestId("2d-pack"),
  };
  state.activeInput = input;
  setBusy(true, "资产包提交中");
  showPack([], null);
  try {
    const pack = await api("/api/generate/2d-pack", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!pack.ok) {
      showError([pack.message, ...(pack.supportedPresets || [])].join("\n"));
      setBusy(false);
      return;
    }
    acceptSubmittedPack(pack);
  } catch (error) {
    const recovered = await recoverSubmittedPack(input.requestId);
    if (recovered?.ok) {
      acceptSubmittedPack(recovered);
      return;
    }
    showError(error.message);
    setBusy(false);
  }
}

function acceptSubmittedPack(pack) {
  const jobs = Array.isArray(pack.jobs) ? pack.jobs : [];
  state.pack = pack;
  state.packResults = {};
  renderPlan({
    kind: pack.kind,
    preset: pack.preset,
    packKind: pack.packKind,
    metadata: pack.metadata,
    reference: pack.metadata?.reference,
    jobs: jobs.map((job) => ({
      id: job.id,
      label: job.label,
      promptId: job.promptId,
      seed: job.seed,
      referenceDenoise: job.referenceDenoise,
      dimensions: job.dimensions,
    })),
  });
  showPack(jobs, pack);
  startQueuePolling(jobs[0]?.promptId);
  pollPack(pack);
}

async function generateVideoSprite() {
  clearPoll();
  const source = state.last2d?.result;
  const input = currentInput();
  state.activeInput = input;
  if (!source?.filename) {
    renderVideoRoutePlan();
    showError("先生成或从历史恢复一张 2D 角色/怪物源帧，再生成视频精灵图");
    return;
  }
  setBusy(true, "视频精灵提交中");
  try {
    const job = await api("/api/generate/video-sprite", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        submit: true,
        comfyImage: {
          filename: source.filename,
          subfolder: source.subfolder,
          type: source.type,
        },
      }),
    });
    state.plan = job.plan || job;
    renderPlan({
      kind: job.kind,
      status: job.status,
      promptId: job.promptId,
      seed: job.seed,
      dimensions: job.dimensions,
      sourceFrame: source.filename,
      plan: job.plan,
    });
    if (!job.ok) {
      showError(job.message || job.error || "视频精灵图任务提交失败");
      setBusy(false);
      return;
    }
    startQueuePolling(job.promptId);
    pollJob(job.promptId, "video-sprite");
  } catch (error) {
    showError(error.message);
    setBusy(false);
  }
}

function referenceImageForPack() {
  if (!isSpriteActionPreset()) return null;
  const referenceState = spriteReferenceState();
  if (!referenceState.ok) return null;
  const result = state.last2d?.result;
  if (!result?.filename) return null;
  return {
    filename: result.filename,
    subfolder: result.subfolder || "",
    type: result.type || "output",
  };
}

function poseImagesForPack() {
  if (els.preset.value !== "character-actions") return null;
  if (!state.capabilities?.poseControl?.available) return null;
  if (!referenceImageForPack()) return null;
  return {
    idle: drawPoseTemplate("idle"),
    walk: drawPoseTemplate("walk"),
    attack: drawPoseTemplate("attack"),
    hurt: drawPoseTemplate("hurt"),
  };
}

function drawPoseTemplate(kind) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const poses = {
    idle: {
      nose: [256, 108],
      lEye: [244, 102],
      rEye: [268, 102],
      lEar: [234, 108],
      rEar: [278, 108],
      neck: [256, 155],
      lShoulder: [208, 166],
      rShoulder: [304, 166],
      lElbow: [200, 232],
      rElbow: [316, 232],
      lHand: [196, 288],
      rHand: [320, 288],
      lHip: [228, 286],
      rHip: [284, 286],
      lKnee: [220, 360],
      rKnee: [292, 360],
      lFoot: [208, 442],
      rFoot: [304, 442],
    },
    walk: {
      nose: [252, 108],
      lEye: [240, 102],
      rEye: [264, 102],
      lEar: [230, 108],
      rEar: [274, 108],
      neck: [255, 154],
      lShoulder: [212, 166],
      rShoulder: [300, 166],
      lElbow: [230, 226],
      rElbow: [276, 228],
      lHand: [250, 286],
      rHand: [258, 288],
      lHip: [232, 288],
      rHip: [288, 288],
      lKnee: [198, 350],
      rKnee: [320, 356],
      lFoot: [156, 426],
      rFoot: [364, 440],
    },
    attack: {
      nose: [244, 108],
      lEye: [232, 102],
      rEye: [256, 102],
      lEar: [222, 108],
      rEar: [266, 108],
      neck: [252, 152],
      lShoulder: [198, 170],
      rShoulder: [310, 156],
      lElbow: [150, 214],
      rElbow: [376, 150],
      lHand: [102, 252],
      rHand: [458, 112],
      lHip: [228, 292],
      rHip: [292, 282],
      lKnee: [202, 368],
      rKnee: [334, 346],
      lFoot: [174, 446],
      rFoot: [388, 402],
    },
    hurt: {
      nose: [292, 118],
      lEye: [280, 112],
      rEye: [304, 112],
      lEar: [270, 118],
      rEar: [314, 118],
      neck: [272, 166],
      lShoulder: [224, 184],
      rShoulder: [316, 190],
      lElbow: [180, 246],
      rElbow: [352, 252],
      lHand: [136, 302],
      rHand: [390, 318],
      lHip: [224, 302],
      rHip: [282, 294],
      lKnee: [202, 374],
      rKnee: [300, 364],
      lFoot: [172, 446],
      rFoot: [338, 436],
    },
  };
  const p = poses[kind] || poses.idle;

  const limbs = [
    ["nose", "neck", "#ffffff"],
    ["nose", "lEye", "#ff3333"],
    ["lEye", "lEar", "#ff8833"],
    ["nose", "rEye", "#ffff33"],
    ["rEye", "rEar", "#88ff33"],
    ["neck", "lShoulder", "#33ff33"],
    ["lShoulder", "lElbow", "#33ff88"],
    ["lElbow", "lHand", "#33ffff"],
    ["neck", "rShoulder", "#3388ff"],
    ["rShoulder", "rElbow", "#3333ff"],
    ["rElbow", "rHand", "#8833ff"],
    ["neck", "lHip", "#ff33ff"],
    ["lHip", "lKnee", "#ff3388"],
    ["lKnee", "lFoot", "#ff3333"],
    ["neck", "rHip", "#ffaa33"],
    ["rHip", "rKnee", "#ffff33"],
    ["rKnee", "rFoot", "#88ff33"],
  ];
  for (const [from, to, color] of limbs) {
    drawOpenPoseLine(ctx, p[from], p[to], color);
  }

  for (const point of Object.values(p)) {
    drawOpenPosePoint(ctx, point);
  }
  return canvas.toDataURL("image/png");
}

function drawOpenPoseLine(ctx, from, to, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
}

function drawOpenPosePoint(ctx, point) {
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(point[0], point[1], 6, 0, Math.PI * 2);
  ctx.fill();
}

async function generate3D() {
  if (!state.last2d?.result) return;
  clearPoll();
  state.activeInput = currentInput();
  setBusy(true, "3D 生成中");
  try {
    const job = await api("/api/generate/3d", {
      method: "POST",
      body: JSON.stringify({
        ...currentInput(),
        comfyImage: {
          filename: state.last2d.result.filename,
          subfolder: state.last2d.result.subfolder,
          type: state.last2d.result.type,
        },
      }),
    });
    if (!job.ok) {
      showError([job.message, ...(job.missing || [])].join("\n"));
      setBusy(false);
      return;
    }
    startQueuePolling(job.promptId);
    pollJob(job.promptId, "3d");
  } catch (error) {
    showError(error.message);
    setBusy(false);
  }
}

function pollJob(promptId, kind) {
  let attempts = 0;
  const maxAttempts = kind === "3d" ? 420 : 180;
  const tick = async () => {
    attempts += 1;
    try {
      const data = await api(`/api/jobs/${encodeURIComponent(promptId)}?kind=${kind}`);
      if (data.status === "complete" && data.result?.url) {
        if (kind === "3d") {
          state.last3d = data;
          showModel(data.result.url);
          addHistoryEntry({
            type: "3d",
            input: state.activeInput || currentInput(),
            result: data.result,
            promptId,
          });
        } else if (kind === "video-sprite") {
          showVideo(data.result.url, data.result.filename);
          addHistoryEntry({
            type: "video-sprite",
            input: state.activeInput || currentInput(),
            result: data.result,
            promptId,
            plan: state.plan,
          });
        } else {
          state.last2d = data;
          showImage(data.result.url, data.result.filename);
          addHistoryEntry({
            type: "2d",
            input: state.activeInput || currentInput(),
            result: data.result,
            promptId,
            plan: state.plan,
          });
        }
        refreshCloudJobsInBackground();
        setBusy(false);
        clearPoll();
        stopQueuePolling();
        update3DButton();
        return;
      }
      if (data.status === "error" || data.status === "complete_no_result") {
        showError(formatJobFailure(data));
        refreshCloudJobsInBackground();
        setBusy(false);
        clearPoll();
        stopQueuePolling();
        return;
      }
      if (data.status === "not_in_queue") {
        els.stageStatus.textContent = "队列未发现，等待历史结果";
      }
      if (attempts >= maxAttempts) {
        showError("生成超时。Comfy 可能仍在运行，请稍后从任务历史或输出目录确认结果");
        refreshCloudJobsInBackground();
        setBusy(false);
        clearPoll();
        stopQueuePolling();
        return;
      }
      els.stageStatus.textContent = attempts % 2 === 0 ? "队列运行中" : "等待结果";
    } catch (error) {
      showError(error.message);
      refreshCloudJobsInBackground();
      setBusy(false);
      clearPoll();
      stopQueuePolling();
    }
  };
  tick();
  state.polling = setInterval(tick, 1800);
}

function pollPack(pack) {
  const pending = new Map(pack.jobs.map((job) => [job.promptId, job]));
  let attempts = 0;
  const tick = async () => {
    attempts += 1;
    try {
      await Promise.all(
        [...pending.entries()].map(async ([promptId, job]) => {
          const data = await api(`/api/jobs/${encodeURIComponent(promptId)}?kind=2d`);
          if (data.status === "complete" && data.result?.url) {
            state.packResults[job.id] = {
              ...data.result,
              url: data.result.url,
              label: job.label,
              seed: job.seed,
              promptId: job.promptId,
              dimensions: job.dimensions,
            };
            updatePackCard(job.id, {
              status: "complete",
              url: data.result.url,
              filename: data.result.filename,
            });
            pending.delete(promptId);
          } else if (data.status === "error" || data.status === "complete_no_result") {
            updatePackCard(job.id, {
              status: "error",
              message: formatJobFailure(data),
            });
            pending.delete(promptId);
          } else if (data.status === "not_in_queue") {
            updatePackCard(job.id, {
              status: "not_in_queue",
              message: "队列未发现，等待历史结果",
            });
          }
        }),
      );
      if (pending.size === 0) {
        setBusy(false);
        await preparePackDownloads(pack);
        await preparePackProductionPreview(pack);
        updateLayerButton();
        addHistoryEntry({
          type: "pack",
          input: state.activeInput || currentInput(),
          pack,
          results: state.packResults,
        });
        refreshCloudJobsInBackground();
        clearPoll();
        stopQueuePolling();
        return;
      }
      if (attempts >= 180) {
        for (const job of pending.values()) {
          updatePackCard(job.id, { status: "error", message: "生成超时" });
        }
        refreshCloudJobsInBackground();
        setBusy(false);
        clearPoll();
        stopQueuePolling();
        return;
      }
      state.activeQueuePromptId = [...pending.keys()][0] || null;
      els.stageStatus.textContent = `资产包生成中 ${pack.jobs.length - pending.size}/${pack.jobs.length}`;
    } catch (error) {
      showError(error.message);
      refreshCloudJobsInBackground();
      setBusy(false);
      clearPoll();
      stopQueuePolling();
    }
  };
  tick();
  state.packPolling = setInterval(tick, 2200);
}

function formatJobFailure(data) {
  const messages = data.rawStatus?.messages || [];
  const last = Array.isArray(messages) ? messages[messages.length - 1] : null;
  const detail = last?.[1]?.exception_message || last?.[1]?.exception_type || data.status;
  return `生成失败：${detail}`;
}

function clearPoll() {
  if (state.polling) clearInterval(state.polling);
  if (state.packPolling) clearInterval(state.packPolling);
  if (state.layerPolling) clearInterval(state.layerPolling);
  state.polling = null;
  state.packPolling = null;
  state.layerPolling = null;
}

function renderPlan(plan) {
  els.promptPlan.textContent = JSON.stringify(plan, null, 2);
}

function shouldLoadVideoSpriteDemo() {
  const params = new URLSearchParams(window.location.search);
  return params.get("demo") === "video-sprite";
}

function requestedGeneratorPreset() {
  const params = new URLSearchParams(window.location.search);
  const preset = params.get("preset") || "";
  if (!preset) return "";
  return Array.from(els.preset.options).some((option) => option.value === preset) ? preset : "";
}

function requestedGeneratorInput() {
  const params = new URLSearchParams(window.location.search);
  return {
    preset: requestedGeneratorPreset(),
    assetType: optionValueFromQuery(els.assetType, params.get("assetType")),
    style: optionValueFromQuery(els.style, params.get("style")),
    camera: optionValueFromQuery(els.camera, params.get("camera")),
    actionStrength: optionValueFromQuery(els.actionStrength, params.get("actionStrength")),
    brief: params.get("brief") || "",
  };
}

function optionValueFromQuery(select, value) {
  if (!value) return "";
  return Array.from(select.options).some((option) => option.value === value) ? value : "";
}

function applyInitialQueryInput(input = {}) {
  if (input.assetType) els.assetType.value = input.assetType;
  if (input.style) els.style.value = input.style;
  if (input.camera) els.camera.value = input.camera;
  if (input.actionStrength) els.actionStrength.value = input.actionStrength;
  if (input.brief) {
    els.brief.value = input.brief;
    els.brief.dataset.autofill = "false";
  }
  updateRouteControls();
  renderMotionControlState();
}

function requestedVideoSpriteSampleId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("sample") || "";
}

async function loadVideoSpriteDemo() {
  clearPoll();
  const input = {
    mode: "2d",
    brief: "纯色背景视频生成怪物动作，再自动抽帧、抠背景、脚底对齐并导出 Sprite Sheet",
    assetType: "creature",
    style: "pixel",
    camera: "front",
    preset: "monster-actions",
    actionStrength: "balanced",
    animationRoute: "video",
  };
  state.activeInput = input;
  applyHistoryInput(input);
  if (state.capabilities?.videoToSprite?.available) {
    setAnimationRoute("video");
  }
  els.emptyState.hidden = false;
  els.resultImage.hidden = true;
  els.resultVideo.hidden = true;
  els.resultVideo.removeAttribute("src");
  els.resultGrid.hidden = true;
  els.modelViewer.hidden = true;
  els.emptyState.querySelector("strong").textContent = "加载视频精灵 Demo";
  els.emptyState.querySelector("span").textContent = "正在读取公开样本并准备浏览器抽帧导出";
  renderPlan({
    kind: "video-sprite-demo",
    status: "loading",
    route: "WEBM -> sample frames -> alpha remove -> baseline normalize -> Sprite Sheet / Metadata / ZIP",
  });
  renderRouteAbComparison({ status: "processing" });

  try {
    const response = await api("/api/demo/video-sprite");
    state.videoDemos = Array.isArray(response.demos) ? response.demos : [];
    const requestedId = requestedVideoSpriteSampleId();
    const demo = state.videoDemos.find((item) => item.id === requestedId)
      || response.demo
      || state.videoDemos[0]
      || null;
    if (!response.available || !demo?.url) {
      throw new Error("视频精灵 Demo 暂不可用");
    }
    restoreVideoSpriteDemo(demo);
  } catch (error) {
    showError(error.message);
  }
}

function restoreVideoSpriteDemo(demo) {
  if (!demo?.url) return;
  state.activeVideoDemoId = demo.id || null;
  renderPlan({
    kind: "video-sprite-demo",
    status: "ready",
    demoId: demo.id,
    title: demo.title,
    promptId: demo.promptId,
    filename: demo.filename,
    sourceFrame: demo.sourceFrame,
    dimensions: demo.dimensions,
    quality: demo.quality,
    zipFiles: demo.zipFiles,
    route: "WEBM -> sample frames -> alpha remove -> baseline normalize -> Sprite Sheet / Metadata / ZIP",
  });
  showVideo(demo.url, demo.filename);
}

function loadHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    state.history = Array.isArray(parsed) ? parsed.slice(0, HISTORY_LIMIT) : [];
  } catch {
    state.history = [];
  }
  renderHistory();
}

function addHistoryEntry(entry) {
  const createdAt = new Date().toISOString();
  const id = `${createdAt}-${Math.random().toString(36).slice(2, 8)}`;
  const input = sanitizeHistoryInput(entry.input || currentInput());
  const title = titleFromHistoryInput(input);
  const normalized = {
    id,
    createdAt,
    title,
    type: entry.type,
    input,
    result: entry.result || null,
    promptId: entry.promptId || null,
    plan: entry.plan || null,
    pack: entry.pack || null,
    results: entry.results || null,
  };
  state.history = [normalized, ...state.history.filter((item) => item.id !== id)].slice(0, HISTORY_LIMIT);
  saveHistory();
  renderHistory();
}

function sanitizeHistoryInput(input) {
  const { poseImages, ...rest } = input || {};
  return rest;
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
  } catch (error) {
    console.warn("History save failed", error);
  }
}

function renderHistory() {
  if (!els.historyList) return;
  if (state.history.length === 0) {
    els.historyList.innerHTML = `<div class="history-empty">暂无历史</div>`;
    return;
  }
  els.historyList.innerHTML = state.history.map((item) => {
    const image = historyImageUrl(item);
    const label = item.type === "pack"
      ? "资产包"
      : item.type === "3d"
        ? "3D"
        : item.type === "video-sprite"
          ? "视频精灵"
          : "2D";
    const detail = [
      item.input?.preset,
      item.input?.style,
      item.pack?.packKind,
    ].filter(Boolean).join(" / ");
    return `
      <article class="history-item" data-history-id="${escapeHtml(item.id)}">
        <button class="history-thumb" type="button" data-history-action="restore" aria-label="恢复历史">
          ${image ? `<img src="${escapeHtml(image)}" alt="" />` : `<i data-lucide="image"></i>`}
        </button>
        <button class="history-body" type="button" data-history-action="restore">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(label)} · ${escapeHtml(formatHistoryTime(item.createdAt))}</span>
          <small>${escapeHtml(detail || "production")}</small>
        </button>
        <button class="history-delete" type="button" data-history-action="delete" aria-label="删除历史">
          <i data-lucide="x"></i>
        </button>
      </article>
    `;
  }).join("");
  if (window.lucide) window.lucide.createIcons();
}

function restoreHistory(id) {
  const item = state.history.find((entry) => entry.id === id);
  if (!item) return;
  clearPoll();
  applyHistoryInput(item.input);
  renderPlan(item.plan || {
    source: "history",
    type: item.type,
    createdAt: item.createdAt,
    input: item.input,
  });
  if (item.type === "pack") {
    restorePackHistory(item);
  } else if (item.type === "3d") {
    state.last3d = { status: "complete", result: item.result, promptId: item.promptId };
    showModel(item.result.url);
  } else if (item.type === "video-sprite") {
    showVideo(item.result.url, item.result.filename);
  } else {
    state.last2d = { status: "complete", result: item.result, promptId: item.promptId };
    showImage(item.result.url, item.result.filename);
    update3DButton();
  }
}

async function restorePackHistory(item) {
  if (!item.pack) {
    showError("历史资产包缺少 metadata");
    return;
  }
  state.pack = item.pack;
  state.packResults = item.results || {};
  showPack(item.pack?.jobs || [], item.pack);
  for (const [id, result] of Object.entries(state.packResults)) {
    updatePackCard(id, {
      status: "complete",
      url: result.url,
      filename: result.filename,
    });
  }
  await preparePackDownloads(item.pack);
  await preparePackProductionPreview(item.pack);
  setBusy(false);
}

function deleteHistory(id) {
  state.history = state.history.filter((item) => item.id !== id);
  saveHistory();
  renderHistory();
}

function clearHistory() {
  state.history = [];
  saveHistory();
  renderHistory();
}

function applyHistoryInput(input = {}) {
  if (input.assetType) els.assetType.value = input.assetType;
  if (input.style) els.style.value = input.style;
  if (input.camera) els.camera.value = input.camera;
  if (input.preset) els.preset.value = input.preset;
  if (input.actionStrength) els.actionStrength.value = input.actionStrength;
  if (input.brief) {
    els.brief.value = input.brief;
    els.brief.dataset.autofill = "false";
  }
  state.mode = input.mode || "2d";
  els.modeTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === state.mode);
  });
  if (input.animationRoute === "video" && state.capabilities?.videoToSprite?.available) {
    setAnimationRoute("video");
  } else if (input.animationRoute === "frames") {
    setAnimationRoute("frames");
  } else {
    updateRouteControls();
    renderRouteComparison();
  }
}

function historyImageUrl(item) {
  if (item.type === "pack") {
    return Object.values(item.results || {})[0]?.url || null;
  }
  if (item.type === "video-sprite") return null;
  return item.result?.url || null;
}

function titleFromHistoryInput(input = {}) {
  const text = input.brief || input.preset || "生成结果";
  return text.length > 24 ? `${text.slice(0, 24)}...` : text;
}

function formatHistoryTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showImage(url, filename = "lingji_asset.png") {
  const alphaRequest = ++state.singleAlphaRequest;
  state.lastVideoSprite = null;
  clearRouteAbComparison();
  state.packDownloadGeneration += 1;
  clearPackPreview();
  els.modelViewer.hidden = true;
  els.resultVideo.hidden = true;
  els.resultVideo.removeAttribute("src");
  els.resultGrid.hidden = true;
  setDownload(els.downloadSheet, null);
  setDownload(els.downloadMetadata, null);
  setDownload(els.downloadZip, null);
  setDownload(els.downloadPreview, null);
  setDownload(els.downloadTransparent, null);
  setDownload(els.download3d, null);
  state.last2dDimensions = null;
  els.resultImage.onload = null;
  els.resultImage.onerror = null;
  if (!url) {
    resetEmptyState();
    els.resultImage.hidden = true;
    els.emptyState.hidden = false;
    setDownload(els.download2d, null);
    return;
  }
  els.emptyState.hidden = true;
  els.resultImage.onload = () => {
    state.last2dDimensions = {
      width: els.resultImage.naturalWidth,
      height: els.resultImage.naturalHeight,
    };
    updateRouteControls();
    renderMotionControlState();
    renderRouteComparison();
  };
  els.resultImage.onerror = () => {
    state.last2dDimensions = null;
    updateRouteControls();
    renderMotionControlState();
  };
  els.resultImage.src = url;
  els.resultImage.hidden = false;
  els.download2d.download = filename;
  setDownload(els.download2d, url);
  renderMotionControlState();
  renderRouteComparison();
  prepareTransparentDownload(url, filename, els.downloadTransparent, alphaRequest)
    .catch((error) => console.warn("Transparent PNG export failed", error));
}

function showModel(url) {
  state.lastVideoSprite = null;
  clearRouteAbComparison();
  state.packDownloadGeneration += 1;
  clearPackPreview();
  els.emptyState.hidden = true;
  els.resultImage.hidden = true;
  els.resultVideo.hidden = true;
  els.resultVideo.removeAttribute("src");
  els.resultGrid.hidden = true;
  setDownload(els.download2d, null);
  setDownload(els.downloadTransparent, null);
  setDownload(els.downloadSheet, null);
  setDownload(els.downloadMetadata, null);
  setDownload(els.downloadZip, null);
  setDownload(els.downloadPreview, null);
  setDownload(els.download3d, null);
  ensureModelViewerLoaded().catch((error) => {
    console.warn("Model viewer load failed", error);
  });
  els.modelViewer.src = url;
  els.modelViewer.hidden = false;
  setDownload(els.download3d, url);
  renderRouteComparison();
}

function ensureModelViewerLoaded() {
  if (customElements.get("model-viewer")) return Promise.resolve();
  if (modelViewerLoadPromise) return modelViewerLoadPromise;
  modelViewerLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/@google/model-viewer@4.1.0/dist/model-viewer.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("model-viewer 加载失败"));
    document.head.appendChild(script);
  });
  return modelViewerLoadPromise;
}

function showVideo(url, filename = "lingji_video_sprite.webm") {
  const generation = ++state.packDownloadGeneration;
  state.lastVideoSprite = url ? { url, filename } : null;
  clearPackPreview();
  els.emptyState.hidden = true;
  els.resultImage.hidden = true;
  els.resultGrid.hidden = true;
  els.modelViewer.hidden = true;
  setDownload(els.download2d, url);
  setDownload(els.downloadTransparent, null);
  setDownload(els.downloadSheet, null);
  setDownload(els.downloadMetadata, null);
  setDownload(els.downloadZip, null);
  setDownload(els.downloadPreview, null);
  setDownload(els.download3d, null);
  els.download2d.download = filename;
  els.resultVideo.src = url;
  els.resultVideo.hidden = false;
  els.resultVideo.play().catch(() => {});
  renderRouteComparison();
  prepareVideoSpriteDownloads(url, filename, generation)
    .catch((error) => console.warn("Video sprite export failed", error));
}

async function prepareVideoSpriteDownloads(sourceUrl, filename, generation) {
  const frames = await captureVideoSpriteFrames(sourceUrl, VIDEO_SPRITE_FRAME_COUNT, generation);
  if (generation !== state.packDownloadGeneration || frames.length === 0) return;

  const quality = await analyzeVideoSpriteQuality(frames);
  const metadata = buildVideoSpriteMetadata(filename, frames, quality);
  const sheetBlob = await composeVideoSpriteSheet(frames, metadata.cellWidth, metadata.cellHeight);
  const previewBlob = await composePreviewStrip(frames, 256);
  const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" });
  const qualityBlob = new Blob([JSON.stringify(quality, null, 2)], { type: "application/json" });
  if (generation !== state.packDownloadGeneration) return;

  setObjectDownload(els.downloadTransparent, frames[0].transparentBlob, `${videoSpriteBaseFilename(filename)}-frame-01-alpha.png`);
  setObjectDownload(els.downloadSheet, sheetBlob, `${videoSpriteBaseFilename(filename)}-sheet.png`);
  setObjectDownload(els.downloadMetadata, metadataBlob, `${videoSpriteBaseFilename(filename)}-metadata.json`);
  setObjectDownload(els.downloadPreview, previewBlob, `${videoSpriteBaseFilename(filename)}-preview.png`);
  setAnimationFrames(frames.map((frame) => frame.url), {
    width: metadata.cellWidth,
    height: metadata.cellHeight,
    label: `${videoSpriteBaseFilename(filename)}-animation`,
  });
  renderRouteAbComparison({ status: "ready", quality, frames });
  renderPlan({
    kind: "video-sprite-export",
    sourceVideo: filename,
    frames: metadata.items.length,
    sheet: {
      columns: metadata.columns,
      rows: metadata.rows,
      cellWidth: metadata.cellWidth,
      cellHeight: metadata.cellHeight,
    },
    alpha: metadata.alpha,
    normalization: metadata.normalization,
    pixelCleanup: metadata.pixelCleanup,
    manifests: [
      "manifest/engine-import.json",
      "manifest/phaser-animations.json",
      "manifest/unity-sprites.json",
      "manifest/godot-sprites.json",
    ],
    quality: {
      status: quality.status,
      score: quality.score,
      summary: quality.summary,
      warnings: quality.warnings.slice(0, 6),
    },
  });

  try {
    const zipBlob = await createVideoSpriteZipBlob({
      sourceUrl,
      filename,
      frames,
      metadata,
      quality,
      sheetBlob,
      previewBlob,
      metadataBlob,
      qualityBlob,
    });
    if (generation !== state.packDownloadGeneration) return;
    setObjectDownload(els.downloadZip, zipBlob, `${videoSpriteBaseFilename(filename)}-export.zip`);
  } catch (error) {
    console.warn("Video sprite ZIP export failed", error);
    if (generation === state.packDownloadGeneration) {
      setDownload(els.downloadZip, null);
    }
  }
}

async function captureVideoSpriteFrames(sourceUrl, count, generation) {
  const video = await loadVideoElement(sourceUrl);
  const rawFrames = [];
  try {
    const width = video.videoWidth || 512;
    const height = video.videoHeight || 512;
    const times = videoSpriteFrameTimes(video, count);
    for (const [index, time] of times.entries()) {
      if (generation !== state.packDownloadGeneration) return [];
      await seekVideo(video, time);
      const originalCanvas = captureVideoCanvas(video, width, height);
      const transparentCanvas = cloneCanvas(originalCanvas);
      const transparentCtx = transparentCanvas.getContext("2d", { willReadFrequently: true });
      removeCornerBackground(transparentCtx, transparentCanvas.width, transparentCanvas.height);
      const originalBlob = await canvasToBlob(originalCanvas, "image/png");
      const rawAlpha = measureAlphaCanvas(transparentCanvas);
      rawFrames.push({
        index,
        label: videoSpriteFrameLabel(index),
        time: roundMetric(time),
        width,
        height,
        originalBlob,
        transparentCanvas,
        rawAlpha,
      });
    }
    if (generation !== state.packDownloadGeneration) return [];
    return await normalizeVideoSpriteFrames(rawFrames, width, height, generation);
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
}

async function normalizeVideoSpriteFrames(rawFrames, width, height, generation) {
  const frames = [];
  const config = VIDEO_SPRITE_NORMALIZE_CONFIG;
  const targetMaxWidth = width * config.targetMaxWidthRatio;
  const targetMaxHeight = height * config.targetMaxHeightRatio;
  const baselineY = height * config.baselineRatio;
  const padding = Math.round(Math.min(width, height) * config.paddingRatio);

  for (const raw of rawFrames) {
    if (generation !== state.packDownloadGeneration) return frames;
    const normalizedCanvas = document.createElement("canvas");
    normalizedCanvas.width = width;
    normalizedCanvas.height = height;
    const normalizedCtx = normalizedCanvas.getContext("2d", { willReadFrequently: true });
    normalizedCtx.clearRect(0, 0, width, height);
    normalizedCtx.imageSmoothingEnabled = false;

    const bounds = raw.rawAlpha.bounds;
    let transform = {
      method: config.method,
      scale: 1,
      x: 0,
      y: 0,
      width,
      height,
      baselineY: Math.round(baselineY),
      sourceBounds: bounds,
    };

    if (bounds) {
      const scale = clampNumber(
        Math.min(targetMaxWidth / bounds.width, targetMaxHeight / bounds.height),
        config.minScale,
        config.maxScale,
      );
      const drawWidth = Math.max(1, Math.round(bounds.width * scale));
      const drawHeight = Math.max(1, Math.round(bounds.height * scale));
      let drawX = Math.round((width - drawWidth) / 2);
      let drawY = Math.round(baselineY - drawHeight);
      drawX = clampNumber(drawX, padding - Math.max(0, drawWidth - width), width - padding - drawWidth);
      drawY = clampNumber(drawY, padding - Math.max(0, drawHeight - height), height - padding - drawHeight);
      normalizedCtx.drawImage(
        raw.transparentCanvas,
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        Math.round(drawX),
        Math.round(drawY),
        drawWidth,
        drawHeight,
      );
      transform = {
        ...transform,
        scale: roundMetric(scale),
        x: Math.round(drawX),
        y: Math.round(drawY),
        width: drawWidth,
        height: drawHeight,
      };
    } else {
      normalizedCtx.drawImage(raw.transparentCanvas, 0, 0);
    }

    const rawTransparentBlob = await canvasToBlob(raw.transparentCanvas, "image/png");
    cleanupTransparentPixelEdges(normalizedCtx, width, height);
    const transparentBlob = await canvasToBlob(normalizedCanvas, "image/png");
    const alpha = measureAlphaCanvas(normalizedCanvas);
    if (generation !== state.packDownloadGeneration) return frames;
    const url = URL.createObjectURL(transparentBlob);
    state.packPreviewObjectUrls.push(url);
    frames.push({
      ...raw,
      alpha,
      transform,
      rawTransparentBlob,
      transparentBlob,
      url,
    });
  }

  return frames;
}

function loadVideoElement(sourceUrl) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    let settled = false;
    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("error", onError);
    };
    const finish = () => {
      if (settled || !video.videoWidth) return;
      settled = true;
      cleanup();
      resolve(video);
    };
    const onLoadedMetadata = () => {
      if (video.readyState >= 2) {
        finish();
      }
    };
    const onLoadedData = () => finish();
    const onError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("视频加载失败，无法抽帧"));
    };
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("error", onError);
    video.src = sourceUrl;
    video.load();
  });
}

function videoSpriteFrameTimes(video, count) {
  const duration = Number.isFinite(video.duration) && video.duration > 0
    ? video.duration
    : video.seekable?.length
      ? video.seekable.end(video.seekable.length - 1)
      : 0;
  if (!Number.isFinite(duration) || duration <= 0.2) {
    return Array.from({ length: count }, () => 0);
  }
  const anchors = count === 4
    ? [0.08, 0.35, 0.62, 0.88]
    : Array.from({ length: count }, (_, index) => (index + 1) / (count + 1));
  return anchors.map((anchor) => Math.min(Math.max(duration * anchor, 0), Math.max(duration - 0.04, 0)));
}

function seekVideo(video, time) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      requestAnimationFrame(() => resolve());
    };
    const onSeeked = () => finish();
    const onError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("视频定位失败，无法抽帧"));
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    if (Math.abs(video.currentTime - time) < 0.015 && video.readyState >= 2) {
      finish();
      return;
    }
    video.currentTime = time;
  });
}

function captureVideoCanvas(video, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(video, 0, 0, width, height);
  return canvas;
}

function cleanupTransparentPixelEdges(ctx, width, height) {
  const image = ctx.getImageData(0, 0, width, height);
  const { data } = image;
  const { alphaCutoff, solidCutoff } = VIDEO_SPRITE_PIXEL_CLEANUP_CONFIG;
  for (let offset = 0; offset < data.length; offset += 4) {
    const alpha = data[offset + 3];
    if (alpha <= alphaCutoff) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 0;
    } else if (alpha >= solidCutoff) {
      data[offset + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function cloneCanvas(source) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  return canvas;
}

function canvasToBlob(canvas, type = "image/png") {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas 导出失败"));
      }
    }, type);
  });
}

function measureAlphaCanvas(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return measureAlphaData({ data: imageData.data, width: canvas.width, height: canvas.height });
}

function clampNumber(value, min, max) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.max(low, Math.min(high, value));
}

async function analyzeVideoSpriteQuality(frames) {
  const measuredFrames = [];
  const warnings = [];
  const motion = await analyzeVideoSpriteMotion(frames);

  for (const frame of frames) {
    const alpha = frame.alpha || await measureAlphaBlob(frame.transparentBlob);
    const frameWarnings = videoSpriteFrameWarnings(frame, alpha);
    measuredFrames.push({
      index: frame.index,
      label: frame.label,
      time: frame.time,
      alpha,
      rawAlpha: frame.rawAlpha,
      transform: frame.transform,
      warnings: frameWarnings,
    });
    warnings.push(...frameWarnings);
  }

  const bounds = measuredFrames.map((frame) => frame.alpha.boundsAreaRatio).filter((value) => value > 0);
  const minBounds = Math.min(...bounds);
  const maxBounds = Math.max(...bounds);
  const maxCenterOffset = Math.max(0, ...measuredFrames.map((frame) => frame.alpha.centerOffset));
  if (bounds.length >= 2 && minBounds > 0 && maxBounds / minBounds > 1.85) {
    warnings.push(qualityWarning("warn", "video", "视频帧主体尺度变化较大"));
  }
  if (maxCenterOffset > 0.24) {
    warnings.push(qualityWarning("warn", "video", "视频帧中心漂移较大"));
  }
  const maxScale = Math.max(0, ...measuredFrames.map((frame) => frame.transform?.scale || 1));
  const minScale = Math.min(...measuredFrames.map((frame) => frame.transform?.scale || 1));
  if (Number.isFinite(minScale) && minScale > 0 && maxScale / minScale > 1.55) {
    warnings.push(qualityWarning("warn", "video", "视频帧缩放修正幅度差异较大"));
  }
  warnings.push(...videoSpriteMotionWarnings(motion));

  const score = Math.max(0, 100 - warnings.reduce((total, warning) => (
    total + (warning.severity === "fail" ? 22 : 9)
  ), 0));

  return {
    version: 1,
    kind: "video-sprite",
    status: warnings.some((warning) => warning.severity === "fail") ? "fail" : warnings.length ? "warn" : "pass",
    score,
    summary: {
      frames: measuredFrames.length,
      warnings: warnings.length,
      averageCoverage: roundMetric(average(measuredFrames.map((frame) => frame.alpha.coverage))),
      averageBounds: roundMetric(average(measuredFrames.map((frame) => frame.alpha.boundsAreaRatio))),
      maxCenterOffset: roundMetric(maxCenterOffset),
      minNormalizeScale: roundMetric(Number.isFinite(minScale) ? minScale : 0),
      maxNormalizeScale: roundMetric(maxScale),
      durationSampleEnd: roundMetric(Math.max(0, ...measuredFrames.map((frame) => frame.time))),
      motion,
    },
    motion,
    warnings,
    frames: measuredFrames,
  };
}

async function analyzeVideoSpriteMotion(frames) {
  const imageData = await Promise.all(frames.map((frame) => imageDataFromBlob(frame.transparentBlob)));
  const pairDeltas = [];
  for (let index = 1; index < imageData.length; index += 1) {
    pairDeltas.push({
      from: frames[index - 1]?.label || `frame-${index}`,
      to: frames[index]?.label || `frame-${index + 1}`,
      delta: roundMetric(videoSpriteImageDelta(imageData[index - 1], imageData[index])),
    });
  }
  const loopDelta = imageData.length >= 2
    ? videoSpriteImageDelta(imageData[imageData.length - 1], imageData[0])
    : 0;
  const deltas = pairDeltas.map((pair) => pair.delta);
  const averageFrameDelta = roundMetric(average(deltas));
  const minFrameDelta = roundMetric(Math.min(...deltas.filter(Number.isFinite)));
  const maxFrameDelta = roundMetric(Math.max(0, ...deltas));
  return {
    method: "visible-pixel-delta-v1",
    averageFrameDelta,
    minFrameDelta: Number.isFinite(minFrameDelta) ? minFrameDelta : 0,
    maxFrameDelta,
    loopDelta: roundMetric(loopDelta),
    motionScore: Math.round(clampNumber((averageFrameDelta - 0.025) / 0.16, 0, 1) * 100),
    loopScore: Math.round(100 - clampNumber(loopDelta / 0.36, 0, 1) * 100),
    pairDeltas,
  };
}

function videoSpriteImageDelta(a, b) {
  const width = Math.min(a.width, b.width);
  const height = Math.min(a.height, b.height);
  const stride = Math.max(1, Math.floor(Math.min(width, height) / 128));
  let total = 0;
  let samples = 0;

  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const offsetA = (y * a.width + x) * 4;
      const offsetB = (y * b.width + x) * 4;
      const alphaA = a.data[offsetA + 3] / 255;
      const alphaB = b.data[offsetB + 3] / 255;
      const visible = Math.max(alphaA, alphaB);
      if (visible <= 0.08) continue;
      const alphaDelta = Math.abs(alphaA - alphaB);
      const colorDelta = (
        Math.abs(a.data[offsetA] - b.data[offsetB])
        + Math.abs(a.data[offsetA + 1] - b.data[offsetB + 1])
        + Math.abs(a.data[offsetA + 2] - b.data[offsetB + 2])
      ) / 765;
      total += alphaDelta * 0.6 + colorDelta * visible * 0.4;
      samples += 1;
    }
  }

  return samples ? total / samples : 0;
}

function videoSpriteMotionWarnings(motion = {}) {
  const warnings = [];
  if (motion.averageFrameDelta < 0.025) {
    warnings.push(qualityWarning("fail", "motion", "视频抽帧几乎没有动作变化"));
  } else if (motion.averageFrameDelta < 0.055) {
    warnings.push(qualityWarning("warn", "motion", "视频帧动作变化偏弱"));
  }
  if (motion.minFrameDelta > 0 && motion.minFrameDelta < 0.018) {
    warnings.push(qualityWarning("warn", "motion", "视频抽帧存在近似重复帧"));
  }
  if (motion.averageFrameDelta > 0.5) {
    warnings.push(qualityWarning("warn", "motion", "视频抽帧动作跳变过大"));
  }
  if (motion.loopDelta > 0.34) {
    warnings.push(qualityWarning("warn", "loop", "视频首尾帧循环差异过大"));
  }
  return warnings;
}

function videoSpriteFrameWarnings(frame, alpha) {
  const warnings = [];
  if (!frame.rawAlpha?.bounds) {
    warnings.push(qualityWarning("fail", frame.label, `${frame.label} 未检测到可抠出的主体`));
    return warnings;
  }
  if (alpha.coverage < 0.018) {
    warnings.push(qualityWarning("warn", frame.label, `${frame.label} 主体占比过低`));
  }
  if (alpha.boundsAreaRatio > 0.78) {
    warnings.push(qualityWarning("warn", frame.label, `${frame.label} 主体过满`));
  }
  if (alpha.centerOffset > 0.2) {
    warnings.push(qualityWarning("warn", frame.label, `${frame.label} 偏离中心`));
  }
  if (alpha.edgeMargin <= 3) {
    warnings.push(qualityWarning("warn", frame.label, `${frame.label} 主体触边`));
  }
  if (frame.transform?.scale <= VIDEO_SPRITE_NORMALIZE_CONFIG.minScale + 0.01) {
    warnings.push(qualityWarning("warn", frame.label, `${frame.label} 标准化缩小幅度较大`));
  }
  if (frame.transform?.scale >= VIDEO_SPRITE_NORMALIZE_CONFIG.maxScale - 0.01) {
    warnings.push(qualityWarning("warn", frame.label, `${frame.label} 标准化放大幅度较大`));
  }
  return warnings;
}

function buildVideoSpriteMetadata(filename, frames, quality) {
  const cellWidth = frames[0]?.width || 512;
  const cellHeight = frames[0]?.height || 512;
  return {
    version: 1,
    kind: "video-sprite",
    sourceVideo: filename,
    columns: frames.length,
    rows: 1,
    cellWidth,
    cellHeight,
    animation: {
      loop: true,
      suggestedFps: 8,
      frameOrder: frames.map((frame) => frame.label),
      motion: quality?.motion || quality?.summary?.motion || null,
    },
    alpha: ALPHA_CONFIG,
    normalization: VIDEO_SPRITE_NORMALIZE_CONFIG,
    pixelCleanup: VIDEO_SPRITE_PIXEL_CLEANUP_CONFIG,
    quality,
    items: frames.map((frame) => {
      const baseName = videoSpriteFrameBaseName(frame);
      return {
        id: frame.label,
        label: frame.label,
        index: frame.index,
        row: 0,
        column: frame.index,
        x: frame.index * cellWidth,
        y: 0,
        width: cellWidth,
        height: cellHeight,
        time: frame.time,
        source: `frames/original/${baseName}.png`,
        rawTransparentSource: `frames/raw-transparent/${baseName}_raw_alpha.png`,
        transparentSource: `frames/transparent/${baseName}_alpha.png`,
        sourceBounds: frame.rawAlpha?.bounds || null,
        normalizedBounds: frame.alpha?.bounds || null,
        transform: frame.transform,
      };
    }),
  };
}

async function composeVideoSpriteSheet(frames, cellWidth, cellHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = frames.length * cellWidth;
  canvas.height = cellHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const frame of frames) {
    const image = await loadImage(frame.url);
    ctx.drawImage(image, frame.index * cellWidth, 0, cellWidth, cellHeight);
  }
  return canvasToBlob(canvas, "image/png");
}

async function createVideoSpriteZipBlob({
  sourceUrl,
  filename,
  frames,
  metadata,
  quality,
  sheetBlob,
  previewBlob,
  metadataBlob,
  qualityBlob,
}) {
  const files = [
    { path: "metadata.json", blob: metadataBlob },
    { path: "quality-report.json", blob: qualityBlob },
    { path: "sheet.png", blob: sheetBlob },
    { path: "preview/video-sprite-preview.png", blob: previewBlob },
    { path: "manifest/engine-import.json", blob: jsonBlob(videoSpriteEngineManifest(metadata, filename, quality)) },
    { path: "manifest/phaser-animations.json", blob: jsonBlob(videoSpritePhaserManifest(metadata, filename)) },
    { path: "manifest/unity-sprites.json", blob: jsonBlob(videoSpriteUnityManifest(metadata, filename)) },
    { path: "manifest/godot-sprites.json", blob: jsonBlob(videoSpriteGodotManifest(metadata, filename)) },
  ];

  try {
    const sourceVideoBlob = await fetchBlob(sourceUrl);
    files.push({ path: `source/${safeZipSegment(filename, "source-video")}.webm`, blob: sourceVideoBlob });
  } catch (error) {
    console.warn("Source video ZIP entry skipped", error);
  }

  for (const frame of frames) {
    const baseName = videoSpriteFrameBaseName(frame);
    files.push({ path: `frames/original/${baseName}.png`, blob: frame.originalBlob });
    files.push({ path: `frames/raw-transparent/${baseName}_raw_alpha.png`, blob: frame.rawTransparentBlob });
    files.push({ path: `frames/transparent/${baseName}_alpha.png`, blob: frame.transparentBlob });
  }

  return createZipBlob(files);
}

function jsonBlob(value) {
  return new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
}

function videoSpriteEngineManifest(metadata, filename, quality) {
  const frames = videoSpriteManifestFrames(metadata);
  const animation = videoSpriteManifestAnimation(metadata, filename, frames);
  return {
    schema: "lingji-forge.video-sprite.engine-import.v1",
    kind: "video-sprite",
    sourceVideo: metadata?.sourceVideo || filename,
    sheet: "sheet.png",
    preview: "preview/video-sprite-preview.png",
    cell: {
      width: metadata?.cellWidth || null,
      height: metadata?.cellHeight || null,
      columns: metadata?.columns || frames.length,
      rows: metadata?.rows || 1,
    },
    alpha: metadata?.alpha || null,
    normalization: metadata?.normalization || null,
    pixelCleanup: metadata?.pixelCleanup || null,
    quality: quality || metadata?.quality || null,
    frames,
    animations: [animation],
    notes: [
      "Use sheet.png for atlas imports or frames/transparent/*.png for individual transparent sprites.",
      "normalizedBounds and transform describe browser-side baseline normalization from the source video.",
      "Pivot is bottom-centered for character and monster sprites.",
    ],
  };
}

function videoSpritePhaserManifest(metadata, filename) {
  const frames = videoSpriteManifestFrames(metadata);
  const animation = videoSpriteManifestAnimation(metadata, filename, frames);
  return {
    schema: "lingji-forge.video-sprite.phaser.v1",
    textureKey: animation.name,
    image: "sheet.png",
    frameWidth: metadata?.cellWidth || null,
    frameHeight: metadata?.cellHeight || null,
    frameIndexes: frames.map((frame) => frame.index),
    frames: frames.map((frame) => ({
      key: frame.key,
      index: frame.index,
      rect: frame.rect,
      path: frame.transparentPath,
    })),
    animations: [
      {
        key: animation.name,
        frameRate: animation.fps,
        repeat: -1,
        frames: frames.map((frame) => frame.key),
        frameIndexes: frames.map((frame) => frame.index),
      },
    ],
  };
}

function videoSpriteUnityManifest(metadata, filename) {
  const frames = videoSpriteManifestFrames(metadata);
  const animation = videoSpriteManifestAnimation(metadata, filename, frames);
  return {
    schema: "lingji-forge.video-sprite.unity.v1",
    texture: "sheet.png",
    textureType: "Sprite",
    spriteMode: "Multiple",
    pixelsPerUnit: 100,
    filterMode: "Point",
    pivot: { x: 0.5, y: 0.1 },
    sprites: frames.map((frame) => ({
      name: frame.key,
      rect: frame.rect,
      path: frame.transparentPath,
      pivot: frame.pivot,
      sourceBounds: frame.sourceBounds,
      normalizedBounds: frame.normalizedBounds,
    })),
    animationClip: {
      name: animation.name,
      sampleRate: animation.fps,
      loopTime: animation.loop,
      frames: frames.map((frame) => frame.key),
    },
  };
}

function videoSpriteGodotManifest(metadata, filename) {
  const frames = videoSpriteManifestFrames(metadata);
  const animation = videoSpriteManifestAnimation(metadata, filename, frames);
  return {
    schema: "lingji-forge.video-sprite.godot.v1",
    texture: "sheet.png",
    import: {
      textureFilter: "nearest",
      hframes: metadata?.columns || frames.length,
      vframes: metadata?.rows || 1,
      fps: animation.fps,
      loop: animation.loop,
    },
    sprites: frames.map((frame) => ({
      name: frame.key,
      atlasIndex: frame.index,
      region: frame.rect,
      path: frame.transparentPath,
      pivot: frame.pivot,
    })),
    animatedSprite2D: {
      animation: animation.name,
      frames: frames.map((frame) => ({
        texture: frame.transparentPath,
        duration: frame.duration,
      })),
    },
  };
}

function videoSpriteManifestAnimation(metadata, filename, frames) {
  const fps = Number.isFinite(metadata?.animation?.suggestedFps) ? metadata.animation.suggestedFps : 8;
  const sourceName = metadata?.sourceVideo || filename || "video-sprite";
  return {
    name: safeZipSegment(sourceName, "video-sprite"),
    fps,
    loop: metadata?.animation?.loop !== false,
    frames: frames.map((frame) => frame.key),
  };
}

function videoSpriteManifestFrames(metadata) {
  const fps = Number.isFinite(metadata?.animation?.suggestedFps) ? metadata.animation.suggestedFps : 8;
  return (metadata?.items || []).map((item) => {
    const index = Number.isFinite(item.index) ? item.index : 0;
    return {
      key: item.id || item.label || `frame-${index + 1}`,
      label: item.label || item.id || `Frame ${index + 1}`,
      index,
      row: Number.isFinite(item.row) ? item.row : 0,
      column: Number.isFinite(item.column) ? item.column : index,
      rect: {
        x: Number.isFinite(item.x) ? item.x : index * (item.width || 0),
        y: Number.isFinite(item.y) ? item.y : 0,
        width: item.width,
        height: item.height,
      },
      duration: roundMetric(1 / fps),
      pivot: { x: 0.5, y: 0.9 },
      originalPath: item.source,
      rawTransparentPath: item.rawTransparentSource,
      transparentPath: item.transparentSource,
      time: item.time,
      sourceBounds: item.sourceBounds,
      normalizedBounds: item.normalizedBounds,
      transform: item.transform,
    };
  });
}

function videoSpriteFrameBaseName(frame) {
  const index = Number.isFinite(frame.index) ? frame.index + 1 : 1;
  return `${String(index).padStart(2, "0")}-${safeZipSegment(frame.label, `frame-${index}`)}`;
}

function videoSpriteBaseFilename(filename) {
  return safeZipSegment(filename, "video-sprite");
}

function videoSpriteFrameLabel(index) {
  return ["idle", "move", "attack", "recover"][index] || `frame-${index + 1}`;
}

function showPack(jobs, pack = null) {
  revokePackFrameDownloads();
  state.lastVideoSprite = null;
  state.lastLayerSeparation = null;
  clearRouteAbComparison();
  clearPackPreview();
  renderMotionControlState();
  state.packDownloadGeneration += 1;
  els.modelViewer.hidden = true;
  els.resultImage.hidden = true;
  els.resultVideo.hidden = true;
  els.resultVideo.removeAttribute("src");
  els.emptyState.hidden = jobs.length > 0;
  els.resultGrid.hidden = jobs.length === 0;
  const reference = pack?.metadata?.reference?.source || referenceImageForPack();
  const poseEnabled = Boolean(pack?.metadata?.reference?.poseControl || (
    reference && els.preset.value === "character-actions" && state.capabilities?.poseControl?.available
  ));
  const referenceName = typeof reference === "string" ? reference : reference?.filename;
  const referenceBanner = referenceName
    ? `<div class="pack-banner">使用 2D 定稿作为动作参考${poseEnabled ? "，并启用姿态控制" : ""}：${escapeHtml(referenceName)}</div>`
    : `<div class="pack-banner muted">未锁定定稿：将直接生成独立资产</div>`;
  els.resultGrid.innerHTML = `${referenceBanner}${jobs.map((job) => `
    <article class="pack-card" data-pack-id="${escapeHtml(job.id)}">
      <div class="pack-preview">
        <span class="spinner small"></span>
      </div>
      <div class="pack-meta">
        <strong>${escapeHtml(job.label)}</strong>
        <span>排队中</span>
      </div>
    </article>
  `).join("")}`;
  setDownload(els.download2d, null);
  setDownload(els.downloadTransparent, null);
  setDownload(els.downloadSheet, null);
  setDownload(els.downloadMetadata, null);
  setDownload(els.downloadZip, null);
  setDownload(els.downloadPreview, null);
  setDownload(els.download3d, null);
  updateLayerButton(true);
}

function updatePackCard(id, update) {
  const card = els.resultGrid.querySelector(`[data-pack-id="${CSS.escape(id)}"]`);
  if (!card) return;
  const preview = card.querySelector(".pack-preview");
  const meta = card.querySelector(".pack-meta span");
  if (update.status === "complete") {
    preview.innerHTML = `<img src="${escapeHtml(update.url)}" alt="${escapeHtml(update.filename)}" />`;
    meta.innerHTML = `
      <span class="pack-links">
        <a href="${escapeHtml(update.url)}" download>${escapeHtml(update.filename)}</a>
        <a class="pack-alpha-link disabled" data-pack-alpha-id="${escapeHtml(id)}">透明 PNG</a>
      </span>
    `;
    preparePackFrameDownload(id, update.url, update.filename, state.packDownloadGeneration)
      .catch((error) => console.warn("Pack frame transparent export failed", error));
  } else if (update.status === "error") {
    preview.innerHTML = `<i data-lucide="circle-alert"></i>`;
    meta.textContent = update.message || "生成失败";
    if (window.lucide) window.lucide.createIcons();
  } else if (update.status === "not_in_queue") {
    meta.textContent = update.message || "队列未发现，等待历史结果";
  }
}

async function preparePackDownloads(pack) {
  const generation = state.packDownloadGeneration;
  const items = pack.metadata?.items || [];
  const completeItems = items
    .map((item) => ({ ...item, result: state.packResults[item.id] }))
    .filter((item) => item.result?.url);
  if (completeItems.length === 0) return;

  const quality = await analyzePackQuality(pack, completeItems);
  const usesTransparentFrames = packUsesTransparentFrames(pack);
  const metadata = {
    version: 1,
    preset: pack.preset,
    packKind: pack.packKind,
    columns: pack.metadata.columns,
    rows: pack.metadata.rows,
    cellWidth: pack.metadata.cellWidth,
    cellHeight: pack.metadata.cellHeight,
    alpha: usesTransparentFrames ? ALPHA_CONFIG : null,
    quality,
    items: completeItems.map((item) => ({
      id: item.id,
      label: item.label,
      index: item.index,
      row: item.row,
      column: item.column,
      x: item.column * pack.metadata.cellWidth,
      y: item.row * pack.metadata.cellHeight,
      width: pack.metadata.cellWidth,
      height: pack.metadata.cellHeight,
      source: item.result.filename,
      transparentSource: usesTransparentFrames ? alphaFilename(item.result.filename) : null,
      zipSource: `frames/original/${packFrameBaseName(item)}.png`,
      zipTransparentSource: usesTransparentFrames ? `frames/transparent/${packFrameBaseName(item)}_alpha.png` : null,
      promptId: item.result.promptId,
      seed: item.result.seed,
      referenceDenoise: item.result.referenceDenoise,
    })),
  };

  const sheetBlob = await composeSheet(pack, completeItems);
  const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" });
  const qualityBlob = new Blob([JSON.stringify(quality, null, 2)], { type: "application/json" });
  if (generation !== state.packDownloadGeneration) return;
  renderPackQuality(quality);
  renderPackImportSummary(pack);
  setObjectDownload(els.downloadSheet, sheetBlob, `${pack.preset || "asset-pack"}-sheet.png`);
  setObjectDownload(els.downloadMetadata, metadataBlob, `${pack.preset || "asset-pack"}-metadata.json`);

  try {
    const cloudZip = await fetchCloudPackZip(pack);
    const zipBlob = cloudZip?.blob || await createPackZipBlob(pack, completeItems, sheetBlob, metadataBlob, qualityBlob);
    if (generation !== state.packDownloadGeneration) return;
    setObjectDownload(
      els.downloadZip,
      zipBlob,
      cloudZip?.filename || `${safeZipSegment(pack.preset, "asset-pack")}-export.zip`,
    );
  } catch (error) {
    console.warn("Pack ZIP export failed", error);
    if (generation === state.packDownloadGeneration) {
      setDownload(els.downloadZip, null);
    }
  }
}

async function fetchCloudPackZip(pack) {
  if (!pack?.packId || !accessToken()) return null;
  const response = await fetch(`/api/packs/${encodeURIComponent(pack.packId)}/download.zip`, {
    headers: authHeaders(),
  });
  if (response.status === 401) {
    showAuthRequired("令牌缺失或无效");
    return null;
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    console.warn("Cloud pack ZIP unavailable, falling back to browser ZIP", data?.message || data?.error || response.status);
    return null;
  }
  return {
    blob: await response.blob(),
    filename: filenameFromDisposition(response.headers.get("content-disposition"))
      || `${safeZipSegment(pack.preset, "asset-pack")}-${String(pack.packId).slice(0, 8)}.zip`,
  };
}

async function generatePackLayers() {
  if (!accessToken()) {
    showAuthRequired("生成 Spine 分层需要访问令牌");
    return;
  }
  if (!layerGenerationAvailable()) {
    renderLayerSeparationCard("error", {
      message: state.capabilities?.layerSeparation?.available
        ? "请先完成一个角色/怪物动作包"
        : "Comfy 还没有可用的 SAM3 模型",
    });
    return;
  }

  setBusy(true, "Spine 分层提交中");
  renderLayerSeparationCard("queued", { message: "SAM3 分层任务已准备提交" });
  const requestId = createClientRequestId("layer-separation");
  try {
    const job = await api(`/api/packs/${encodeURIComponent(state.pack.packId)}/layers/generate`, {
      method: "POST",
      body: JSON.stringify({ frameId: "idle", requestId }),
    });
    if (!job.ok) {
      renderLayerSeparationCard("error", { message: job.message || job.error || "分层不可用" });
      setBusy(false);
      return;
    }
    acceptLayerSeparationJob(job);
  } catch (error) {
    const recovered = await recoverSubmittedLayer(requestId);
    if (recovered?.ok) {
      acceptLayerSeparationJob(recovered);
      return;
    }
    renderLayerSeparationCard("error", { message: error.message });
    setBusy(false);
  }
}

function acceptLayerSeparationJob(job) {
  state.lastLayerSeparation = job;
  renderLayerSeparationCard("queued", {
    message: `SAM3 分层已提交：${job.promptId}`,
    job,
  });
  startQueuePolling(job.promptId);
  pollLayerSeparation(job);
}

function pollLayerSeparation(job) {
  if (state.layerPolling) clearInterval(state.layerPolling);
  let attempts = 0;
  const tick = async () => {
    attempts += 1;
    try {
      const data = await api(`/api/jobs/${encodeURIComponent(job.promptId)}?kind=layer-separation`);
      if (data.status === "complete" && data.result?.files?.length) {
        state.lastLayerSeparation = {
          ...job,
          result: data.result,
        };
        if (state.pack?.packId === job.packId) {
          state.pack = {
            ...state.pack,
            spineSam3Layers: spineSam3SummaryFromLayerJob(job, data.result),
          };
          renderPackImportSummary(state.pack);
        }
        renderLayerSeparationCard("complete", {
          job,
          result: data.result,
        });
        setBusy(false);
        refreshCloudJobsInBackground();
        if (state.layerPolling) clearInterval(state.layerPolling);
        state.layerPolling = null;
      } else if (data.status === "error" || data.status === "complete_no_result") {
        renderLayerSeparationCard("error", { message: formatJobFailure(data) });
        setBusy(false);
        if (state.layerPolling) clearInterval(state.layerPolling);
        state.layerPolling = null;
      } else if (attempts >= 80) {
        renderLayerSeparationCard("error", { message: "SAM3 分层超时，请稍后从云端任务列表恢复" });
        setBusy(false);
        if (state.layerPolling) clearInterval(state.layerPolling);
        state.layerPolling = null;
      } else {
        renderLayerSeparationCard("queued", {
          message: "SAM3 分层运行中",
          job,
        });
      }
    } catch (error) {
      renderLayerSeparationCard("error", { message: error.message });
      setBusy(false);
      if (state.layerPolling) clearInterval(state.layerPolling);
      state.layerPolling = null;
    }
  };
  tick();
  state.layerPolling = setInterval(tick, 2500);
}

function renderLayerSeparationCard(status, payload = {}) {
  let card = els.resultGrid.querySelector(".layer-separation-card");
  if (!card) {
    card = document.createElement("article");
    card.className = "layer-separation-card";
    const anchor = els.resultGrid.querySelector(".pack-import-summary")
      || els.resultGrid.querySelector(".pack-quality-card")
      || els.resultGrid.querySelector(".pack-banner");
    if (anchor) {
      anchor.insertAdjacentElement("afterend", card);
    } else {
      els.resultGrid.prepend(card);
    }
  }
  card.classList.toggle("is-error", status === "error");
  if (status === "complete") {
    const files = payload.result?.files || [];
    card.innerHTML = `
      <div class="quality-heading">
        <strong>Spine 分层预览</strong>
        <span>${files.length} 张 SAM3 mask</span>
      </div>
      <div class="layer-preview-grid">
        ${files.map((file) => `
          <figure>
            <img src="${escapeHtml(file.url || file.comfyUrl)}" alt="${escapeHtml(file.label || file.layerId || file.filename)}" />
            <figcaption>${escapeHtml(file.label || file.layerId || file.filename)}</figcaption>
          </figure>
        `).join("")}
      </div>
    `;
    return;
  }
  card.innerHTML = `
    <div class="quality-heading">
      <strong>Spine 分层预览</strong>
      <span>${status === "error" ? "失败" : "处理中"}</span>
    </div>
    <p>${escapeHtml(payload.message || "等待 SAM3 返回分层 mask")}</p>
  `;
}

function spineSam3SummaryFromLayerJob(job, result) {
  return {
    available: true,
    mode: "sam3-text-mask-cutouts",
    jobId: job.promptId,
    frameId: job.frameId || null,
    files: Array.isArray(result?.files) ? result.files.length : 0,
    skeleton: "spine/sam3-layers/skeleton.json",
    atlas: "spine/sam3-layers/parts.atlas",
    sheet: "spine/sam3-layers/parts.png",
    parts: "spine/sam3-layers/parts.json",
    quality: "spine/sam3-layers/quality.json",
    imageFolder: "spine/sam3-layers/parts/",
    maskFolder: "spine/sam3-layers/masks/",
  };
}

function filenameFromDisposition(disposition) {
  const value = String(disposition || "");
  const utf8 = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8) return decodeURIComponent(utf8[1].replace(/"/g, ""));
  const ascii = value.match(/filename="?([^";]+)"?/i);
  return ascii ? ascii[1] : null;
}

async function createPackZipBlob(pack, items, sheetBlob, metadataBlob, qualityBlob) {
  const usesTransparentFrames = packUsesTransparentFrames(pack);
  const files = [
    { path: "metadata.json", blob: metadataBlob },
    { path: "quality-report.json", blob: qualityBlob },
    { path: "sheet.png", blob: sheetBlob },
  ];
  const frames = [];

  for (const item of items) {
    const baseName = packFrameBaseName(item);
    const originalBlob = await fetchBlob(item.result.url);
    const transparentBlob = usesTransparentFrames ? await packTransparentBlob(item) : null;
    frames.push({ item, baseName, transparentBlob });
    files.push({ path: `frames/original/${baseName}.png`, blob: originalBlob });
    if (transparentBlob) files.push({ path: `frames/transparent/${baseName}_alpha.png`, blob: transparentBlob });
  }

  const previewBlob = await composePackZipPreview(pack, frames);
  if (previewBlob) {
    files.push({ path: `preview/${packPreviewFilename(pack)}`, blob: previewBlob });
  }

  return createZipBlob(files);
}

function packUsesTransparentFrames(pack) {
  return pack?.packKind !== "tile-pack";
}

async function packTransparentBlob(item) {
  const objectUrl = state.packFrameObjectUrls[item.id];
  return objectUrl ? fetchBlob(objectUrl) : transparentBlobFromUrl(item.result.url);
}

async function composePackZipPreview(pack, frames) {
  if (pack.packKind === "tile-pack") {
    return composeTileabilityPreview(pack, frames.map((frame) => frame.item));
  }
  if (pack.packKind !== "sprite-actions") return null;

  const objectUrls = [];
  try {
    const previewItems = frames.map((frame) => {
      const url = URL.createObjectURL(frame.transparentBlob);
      objectUrls.push(url);
      return { ...frame.item, url };
    });
    return await composePreviewStrip(previewItems, 256);
  } finally {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }
}

function packFrameBaseName(item) {
  const itemIndex = Number(item.index);
  const index = Number.isFinite(itemIndex) ? itemIndex + 1 : 1;
  return `${String(index).padStart(2, "0")}-${safeZipSegment(item.id || item.label, `frame-${index}`)}`;
}

function packPreviewFilename(pack) {
  if (pack.packKind === "tile-pack") return "tileability-preview.png";
  if (pack.packKind === "sprite-actions") return "animation-preview.png";
  return "preview.png";
}

async function fetchBlob(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`文件下载失败：${url}`);
  }
  return response.blob();
}

async function createZipBlob(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  let centralSize = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const bytes = new Uint8Array(await file.blob.arrayBuffer());
    const crc = crc32(bytes);
    const { time, date } = dosDateTime(new Date());
    const localHeader = zipLocalHeader(nameBytes, bytes.length, crc, time, date);
    const centralHeader = zipCentralHeader(nameBytes, bytes.length, crc, time, date, offset);

    localParts.push(localHeader, nameBytes, bytes);
    centralParts.push(centralHeader, nameBytes);
    offset += localHeader.byteLength + nameBytes.byteLength + bytes.byteLength;
    centralSize += centralHeader.byteLength + nameBytes.byteLength;
  }

  const end = zipEndRecord(files.length, centralSize, offset);
  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}

function zipLocalHeader(nameBytes, size, crc, time, date) {
  const header = new Uint8Array(30);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, time, true);
  view.setUint16(12, date, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, size, true);
  view.setUint32(22, size, true);
  view.setUint16(26, nameBytes.byteLength, true);
  view.setUint16(28, 0, true);
  return header;
}

function zipCentralHeader(nameBytes, size, crc, time, date, offset) {
  const header = new Uint8Array(46);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, time, true);
  view.setUint16(14, date, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, size, true);
  view.setUint32(24, size, true);
  view.setUint16(28, nameBytes.byteLength, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, offset, true);
  return header;
}

function zipEndRecord(entryCount, centralSize, centralOffset) {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  view.setUint16(20, 0, true);
  return header;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  const table = crc32.table || (crc32.table = makeCrc32Table());
  for (const byte of bytes) {
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeCrc32Table() {
  return Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    return value >>> 0;
  });
}

function dosDateTime(value) {
  const year = Math.max(1980, value.getFullYear());
  return {
    time: (value.getHours() << 11) | (value.getMinutes() << 5) | Math.floor(value.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((value.getMonth() + 1) << 5) | value.getDate(),
  };
}

function safeZipSegment(value, fallback) {
  const segment = String(value || fallback)
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return segment || fallback;
}

async function analyzePackQuality(pack, items) {
  const frames = [];
  const warnings = [];

  for (const item of items) {
    const transparentBlob = await packTransparentBlob(item);
    const alpha = await measureAlphaBlob(transparentBlob);
    const tile = pack.packKind === "tile-pack" ? await measureTileEdges(item.result.url) : null;
    const itemWarnings = qualityWarningsForItem(pack, item, alpha, tile);

    frames.push({
      id: item.id,
      label: item.label,
      index: item.index,
      alpha,
      tile,
      warnings: itemWarnings,
    });
    warnings.push(...itemWarnings);
  }

  warnings.push(...qualityWarningsForPack(pack, frames));
  const tileFrames = frames.filter((frame) => frame.tile);
  const score = Math.max(0, 100 - warnings.reduce((total, warning) => (
    total + (warning.severity === "fail" ? 22 : 9)
  ), 0));

  return {
    version: 1,
    packKind: pack.packKind,
    status: warnings.some((warning) => warning.severity === "fail") ? "fail" : warnings.length ? "warn" : "pass",
    score,
    summary: {
      frames: frames.length,
      warnings: warnings.length,
      averageCoverage: roundMetric(average(frames.map((frame) => frame.alpha.coverage))),
      averageBounds: roundMetric(average(frames.map((frame) => frame.alpha.boundsAreaRatio))),
      maxCenterOffset: roundMetric(Math.max(0, ...frames.map((frame) => frame.alpha.centerOffset))),
      maxTileEdgeMismatch: roundMetric(Math.max(0, ...frames.map((frame) => frame.tile?.edgeMismatch || 0))),
      maxTileBandMismatch: roundMetric(Math.max(0, ...frames.map((frame) => frame.tile?.bandMismatch || 0))),
      maxTileCornerMismatch: roundMetric(Math.max(0, ...frames.map((frame) => frame.tile?.cornerMismatch || 0))),
      minTileabilityScore: tileFrames.length
        ? Math.min(...tileFrames.map((frame) => frame.tile.tileabilityScore))
        : null,
      averageTileabilityScore: tileFrames.length
        ? roundMetric(average(tileFrames.map((frame) => frame.tile.tileabilityScore)))
        : null,
    },
    warnings,
    frames,
  };
}

function qualityWarningsForItem(pack, item, alpha, tile) {
  const warnings = [];
  const isTile = pack.packKind === "tile-pack";
  if (!isTile) {
    if (alpha.coverage < 0.018) {
      warnings.push(qualityWarning("warn", item.id, `${item.label} 主体占比过低`));
    }
    if (alpha.boundsAreaRatio > 0.78) {
      warnings.push(qualityWarning("warn", item.id, `${item.label} 主体过满`));
    }
    if (alpha.centerOffset > 0.2) {
      warnings.push(qualityWarning("warn", item.id, `${item.label} 偏离中心`));
    }
    if (alpha.edgeMargin <= 3) {
      warnings.push(qualityWarning("warn", item.id, `${item.label} 主体触边`));
    }
  }
  if (isTile && tile) {
    if (tile.tileabilityScore < 45) {
      warnings.push(qualityWarning("fail", item.id, `${item.label} 平铺评分过低`));
    } else if (tile.tileabilityScore < 68) {
      warnings.push(qualityWarning("warn", item.id, `${item.label} 平铺评分偏低`));
    }
    if (tile.edgeMismatch > 0.32) {
      warnings.push(qualityWarning("warn", item.id, `${item.label} tile 最外边缘不连续`));
    }
    if (tile.bandMismatch > 0.28) {
      warnings.push(qualityWarning("warn", item.id, `${item.label} tile 边缘纹理带不连续`));
    }
    if (tile.cornerMismatch > 0.36) {
      warnings.push(qualityWarning("warn", item.id, `${item.label} tile 四角色彩差异过大`));
    }
  }
  return warnings;
}

function qualityWarningsForPack(pack, frames) {
  if (pack.packKind !== "sprite-actions" || frames.length < 2) return [];
  const bounds = frames.map((frame) => frame.alpha.boundsAreaRatio).filter((value) => value > 0);
  if (bounds.length < 2) return [];
  const minBounds = Math.min(...bounds);
  const maxBounds = Math.max(...bounds);
  const maxCenterOffset = Math.max(...frames.map((frame) => frame.alpha.centerOffset));
  const warnings = [];

  if (minBounds > 0 && maxBounds / minBounds > 1.85) {
    warnings.push(qualityWarning("warn", "pack", "动作帧主体尺度不一致"));
  }
  if (maxCenterOffset > 0.24) {
    warnings.push(qualityWarning("warn", "pack", "动作帧中心漂移较大"));
  }
  return warnings;
}

function qualityWarning(severity, itemId, message) {
  return { severity, itemId, message };
}

async function measureAlphaBlob(blob) {
  const imageData = await imageDataFromBlob(blob);
  return measureAlphaData(imageData);
}

function measureAlphaData({ data, width, height }) {
  let count = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let sumX = 0;
  let sumY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha <= 24) continue;
      count += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      sumX += x;
      sumY += y;
    }
  }

  if (count === 0) {
    return {
      coverage: 0,
      boundsAreaRatio: 0,
      centerOffset: 1,
      edgeMargin: 0,
      bounds: null,
    };
  }

  const boundsWidth = maxX - minX + 1;
  const boundsHeight = maxY - minY + 1;
  const centerX = sumX / count;
  const centerY = sumY / count;
  return {
    coverage: roundMetric(count / (width * height)),
    boundsAreaRatio: roundMetric((boundsWidth * boundsHeight) / (width * height)),
    centerOffset: roundMetric(Math.hypot((centerX / width) - 0.5, (centerY / height) - 0.5)),
    edgeMargin: Math.min(minX, minY, width - 1 - maxX, height - 1 - maxY),
    bounds: { x: minX, y: minY, width: boundsWidth, height: boundsHeight },
  };
}

async function measureTileEdges(url) {
  const { data, width, height } = await imageDataFromUrl(url);
  const leftRight = edgeColorDistance(data, width, height, "horizontal");
  const topBottom = edgeColorDistance(data, width, height, "vertical");
  const bandLeftRight = edgeBandDistance(data, width, height, "horizontal");
  const bandTopBottom = edgeBandDistance(data, width, height, "vertical");
  const cornerMismatch = tileCornerMismatch(data, width, height);
  const edgeMismatch = roundMetric((leftRight + topBottom) / 2);
  const bandMismatch = roundMetric((bandLeftRight + bandTopBottom) / 2);
  const weightedMismatch = (edgeMismatch * 0.46) + (bandMismatch * 0.38) + (cornerMismatch * 0.16);
  return {
    leftRight: roundMetric(leftRight),
    topBottom: roundMetric(topBottom),
    bandLeftRight: roundMetric(bandLeftRight),
    bandTopBottom: roundMetric(bandTopBottom),
    edgeMismatch,
    bandMismatch,
    cornerMismatch: roundMetric(cornerMismatch),
    worstAxis: Math.max(leftRight, bandLeftRight) >= Math.max(topBottom, bandTopBottom) ? "horizontal" : "vertical",
    tileabilityScore: Math.max(0, Math.min(100, Math.round(100 - (weightedMismatch * 170)))),
  };
}

function edgeColorDistance(data, width, height, direction) {
  const samples = Math.min(direction === "horizontal" ? height : width, 96);
  const step = (direction === "horizontal" ? height : width) / samples;
  let total = 0;
  for (let sample = 0; sample < samples; sample += 1) {
    const index = Math.min(Math.floor((sample + 0.5) * step), (direction === "horizontal" ? height : width) - 1);
    const a = direction === "horizontal"
      ? pixelAt(data, width, 0, index)
      : pixelAt(data, width, index, 0);
    const b = direction === "horizontal"
      ? pixelAt(data, width, width - 1, index)
      : pixelAt(data, width, index, height - 1);
    total += Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b) / 441.67295593;
  }
  return total / samples;
}

function edgeBandDistance(data, width, height, direction) {
  const limit = direction === "horizontal" ? height : width;
  const samples = Math.min(limit, 96);
  const step = limit / samples;
  const band = Math.max(2, Math.min(12, Math.floor(Math.min(width, height) * 0.018)));
  let total = 0;
  for (let sample = 0; sample < samples; sample += 1) {
    const index = Math.min(Math.floor((sample + 0.5) * step), limit - 1);
    const a = edgeBandColor(data, width, height, direction, "start", index, band);
    const b = edgeBandColor(data, width, height, direction, "end", index, band);
    total += colorDistance(a, b);
  }
  return total / samples;
}

function edgeBandColor(data, width, height, direction, side, index, band) {
  let r = 0;
  let g = 0;
  let b = 0;
  for (let offset = 0; offset < band; offset += 1) {
    const x = direction === "horizontal"
      ? side === "start" ? offset : width - 1 - offset
      : index;
    const y = direction === "vertical"
      ? side === "start" ? offset : height - 1 - offset
      : index;
    const pixel = pixelAt(data, width, x, y);
    r += pixel.r;
    g += pixel.g;
    b += pixel.b;
  }
  return { r: r / band, g: g / band, b: b / band };
}

function tileCornerMismatch(data, width, height) {
  const size = Math.max(3, Math.min(16, Math.floor(Math.min(width, height) * 0.025)));
  const corners = [
    patchAverageColor(data, width, 0, 0, size, size),
    patchAverageColor(data, width, width - size, 0, size, size),
    patchAverageColor(data, width, 0, height - size, size, size),
    patchAverageColor(data, width, width - size, height - size, size, size),
  ];
  const distances = [];
  for (let a = 0; a < corners.length; a += 1) {
    for (let b = a + 1; b < corners.length; b += 1) {
      distances.push(colorDistance(corners[a], corners[b]));
    }
  }
  return Math.max(0, ...distances);
}

function patchAverageColor(data, width, x, y, patchWidth, patchHeight) {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let py = y; py < y + patchHeight; py += 1) {
    for (let px = x; px < x + patchWidth; px += 1) {
      const pixel = pixelAt(data, width, px, py);
      r += pixel.r;
      g += pixel.g;
      b += pixel.b;
      count += 1;
    }
  }
  return { r: r / count, g: g / count, b: b / count };
}

function colorDistance(a, b) {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b) / 441.67295593;
}

function pixelAt(data, width, x, y) {
  const offset = (y * width + x) * 4;
  return {
    r: data[offset],
    g: data[offset + 1],
    b: data[offset + 2],
  };
}

async function imageDataFromBlob(blob) {
  const url = URL.createObjectURL(blob);
  try {
    return await imageDataFromUrl(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function imageDataFromUrl(url) {
  const image = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data: imageData.data, width: canvas.width, height: canvas.height };
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((total, value) => total + value, 0) / clean.length : 0;
}

function roundMetric(value) {
  return Math.round(value * 1000) / 1000;
}

function renderPackQuality(quality) {
  els.resultGrid.querySelector(".pack-quality-card")?.remove();
  const warnings = quality.warnings.slice(0, 5);
  const statusLabel = quality.status === "pass" ? "可导入" : quality.status === "fail" ? "需重做" : "需检查";
  const isTilePack = quality.packKind === "tile-pack";
  const metrics = isTilePack
    ? [
      `<span><b>${quality.summary.frames}</b>tile</span>`,
      `<span><b>${Math.round(quality.summary.averageTileabilityScore || 0)}</b>平铺</span>`,
      `<span><b>${Math.round((quality.summary.maxTileEdgeMismatch || 0) * 100)}%</b>边缘</span>`,
      `<span><b>${Math.round((quality.summary.maxTileBandMismatch || 0) * 100)}%</b>边带</span>`,
      `<span><b>${Math.round((quality.summary.maxTileCornerMismatch || 0) * 100)}%</b>四角</span>`,
    ]
    : [
      `<span><b>${quality.summary.frames}</b>帧</span>`,
      `<span><b>${Math.round(quality.summary.averageCoverage * 100)}%</b>主体</span>`,
      `<span><b>${Math.round(quality.summary.averageBounds * 100)}%</b>边界</span>`,
      `<span><b>${Math.round(quality.summary.maxCenterOffset * 100)}%</b>偏移</span>`,
      `<span><b>${Math.round((quality.summary.maxTileEdgeMismatch || 0) * 100)}%</b>接缝</span>`,
    ];
  const card = document.createElement("article");
  card.className = `pack-quality-card ${quality.status}`;
  card.innerHTML = `
    <div class="quality-heading">
      <strong>导入检查</strong>
      <span>${escapeHtml(statusLabel)} · ${quality.score}/100</span>
    </div>
    <div class="quality-metrics">
      ${metrics.join("")}
    </div>
    <ul class="quality-warnings">
      ${warnings.length
        ? warnings.map((warning) => `<li>${escapeHtml(warning.message)}</li>`).join("")
        : "<li>无明显导入风险</li>"}
    </ul>
  `;
  const banner = els.resultGrid.querySelector(".pack-banner");
  if (banner) {
    banner.insertAdjacentElement("afterend", card);
  } else {
    els.resultGrid.prepend(card);
  }
}

function renderPackImportSummary(pack) {
  els.resultGrid.querySelector(".pack-import-summary")?.remove();
  const manifests = packImportManifestNames(pack);
  if (manifests.length === 0) return;
  const card = document.createElement("article");
  card.className = "pack-import-summary";
  const detail = packHasSpineExport(pack)
    ? packHasSam3Layers(pack)
      ? "云端 ZIP 已包含 Spine runtime、rig-template 和 SAM3 分层 cutout"
      : "云端 ZIP 已包含 Spine attachment-swap runtime 导出和 rig-template 编辑模板"
    : pack.packKind === "tile-pack"
      ? "云端 ZIP 已包含 Tiled tileset 清单，地图 tile 保持不透明导入"
      : pack.packKind === "ui-pack" || pack.packKind === "icon-pack"
        ? "云端 ZIP 已包含 UI atlas 和 Phaser atlas，可从 sheet.png 按命名区域导入"
        : "云端 ZIP 已包含常用引擎导入清单";
  card.innerHTML = `
    <div class="quality-heading">
      <strong>云端导入包</strong>
      <span>${escapeHtml(detail)}</span>
    </div>
    <div class="pack-import-badges">
      ${manifests.map((name) => `<code>${escapeHtml(name)}</code>`).join("")}
    </div>
  `;
  const anchor = els.resultGrid.querySelector(".pack-quality-card") || els.resultGrid.querySelector(".pack-banner");
  if (anchor) {
    anchor.insertAdjacentElement("afterend", card);
  } else {
    els.resultGrid.prepend(card);
  }
  renderSam3PartComparison(pack);
}

function renderSam3PartComparison(pack) {
  els.resultGrid.querySelector(".sam3-part-compare")?.remove();
  if (!packHasSam3Layers(pack)) return;
  const parts = ["head", "torso", "hips", "arm_l", "arm_r", "leg_l", "leg_r"];
  const card = document.createElement("section");
  card.className = "sam3-part-compare";
  card.setAttribute("aria-label", "SAM3 Spine 分层对比");
  card.innerHTML = `
    <div class="sam3-part-compare-head">
      <div>
        <strong>SAM3 Spine 分层对比</strong>
        <span>原始 cutout / cleaned cutout · 用于判断 Spine 分层是否可继续编辑</span>
      </div>
      <code data-sam3-preview-status>preview loading</code>
    </div>
    <div class="sam3-quality-strip" data-sam3-quality-strip>
      <span class="sam3-quality-pill info">读取质量摘要</span>
    </div>
    <p class="sam3-diagnostics" data-sam3-diagnostics>正在载入 SAM3 semantic diagnostics</p>
    <div class="sam3-part-grid">
      ${parts.map((part) => `
        <article class="sam3-part-row">
          <strong>${escapeHtml(sam3PartLabel(part))}</strong>
          ${renderSam3PartSlot(pack, "parts", part, "原始")}
          ${renderSam3PartSlot(pack, "cleaned-parts", part, "Cleaned")}
        </article>
      `).join("")}
    </div>
  `;
  const anchor = els.resultGrid.querySelector(".pack-import-summary")
    || els.resultGrid.querySelector(".pack-quality-card")
    || els.resultGrid.querySelector(".pack-banner");
  if (anchor) {
    anchor.insertAdjacentElement("afterend", card);
  } else {
    els.resultGrid.prepend(card);
  }
  loadSam3PartComparisons(pack, card).catch((error) => {
    console.warn("SAM3 part comparison failed", error);
  });
}

function renderSam3PartSlot(pack, variant, part, label) {
  return `
    <a class="sam3-part-slot loading"
      href="${escapeHtml(sam3PartPreviewPath(pack, variant, part))}"
      target="_blank"
      rel="noreferrer"
      data-sam3-part-slot
      data-sam3-variant="${escapeHtml(variant)}"
      data-sam3-part="${escapeHtml(part)}">
      <span>${escapeHtml(label)}</span>
      <img alt="${escapeHtml(`${label} ${sam3PartLabel(part)}`)}" loading="lazy" />
    </a>
  `;
}

function sam3PartPreviewPath(pack, variant, part) {
  return `/api/packs/${encodeURIComponent(pack.packId)}/spine-sam3/${encodeURIComponent(variant)}/${encodeURIComponent(part)}.png`;
}

function sam3PartLabel(part) {
  return {
    head: "Head",
    torso: "Torso",
    hips: "Hips",
    arm_l: "Arm L",
    arm_r: "Arm R",
    leg_l: "Leg L",
    leg_r: "Leg R",
  }[part] || part;
}

function sam3QualityStatusLabel(status) {
  return {
    pass: "PASS",
    warn: "WARN",
    fail: "FAIL",
  }[status] || "CHECK";
}

function sam3SemanticProfileLabel(profile) {
  return {
    default: "Default",
    "monster-sideview-v1": "Monster side-view",
  }[profile] || profile || "Default";
}

function sam3SideViewOcclusionLabels(quality) {
  const pairBalance = quality?.semantics?.pairBalance || {};
  return [
    pairBalance.arms?.sideViewOcclusion ? "arms" : "",
    pairBalance.legs?.sideViewOcclusion ? "legs" : "",
  ].filter(Boolean);
}

function sam3QualityPillsHtml(data) {
  const quality = data?.quality || {};
  const cleanup = data?.cleanup?.summary || {};
  const summary = quality.summary || {};
  const profile = quality.semantics?.profile || "default";
  const remainingRiskyPairs = cleanup.remainingRiskyPairs ?? summary.cleanupRemainingRiskyPairs;
  const cleanupActions = cleanup.actions ?? summary.cleanupActions;
  const trimmedPixels = cleanup.trimmedPixels;
  const sideViewOcclusion = sam3SideViewOcclusionLabels(quality);
  const chips = [
    { label: "Score", value: `${quality.score ?? "-"} / 100`, tone: quality.status || "info" },
    { label: "Profile", value: sam3SemanticProfileLabel(profile), tone: profile === "monster-sideview-v1" ? "info" : "" },
    { label: "Risky left", value: remainingRiskyPairs ?? "-", tone: Number(remainingRiskyPairs || 0) === 0 ? "pass" : "warn" },
    cleanupActions != null
      ? { label: "Cleanup", value: trimmedPixels != null ? `${cleanupActions} / ${trimmedPixels}px` : cleanupActions, tone: "info" }
      : null,
    sideViewOcclusion.length
      ? { label: "Side-view", value: sideViewOcclusion.join(", "), tone: "info" }
      : null,
  ].filter(Boolean);
  return chips.map((chip) => `
    <span class="sam3-quality-pill ${escapeHtml(chip.tone || "info")}">
      <b>${escapeHtml(chip.label)}</b>${escapeHtml(String(chip.value))}
    </span>
  `).join("");
}

function sam3DiagnosticsText(data) {
  const quality = data?.quality || {};
  const sideViewOcclusion = sam3SideViewOcclusionLabels(quality);
  const warnings = Array.isArray(quality.warnings)
    ? quality.warnings.filter((warning) => warning.severity === "warn" || warning.severity === "fail")
    : [];
  if (warnings.length) {
    return warnings.slice(0, 2).map((warning) => warning.message).join(" · ");
  }
  if (sideViewOcclusion.length) {
    return `侧身怪物 profile 已把 ${sideViewOcclusion.join(" / ")} 的近中心点记录为遮挡诊断，不作为结构告警扣分`;
  }
  const semanticDiagnostics = quality.summary?.semanticDiagnostics;
  return semanticDiagnostics
    ? `${semanticDiagnostics} 条 semantic diagnostics，未发现需要阻断的结构告警`
    : "无结构性分层告警";
}

async function loadSam3PartComparisons(pack, card) {
  const status = card.querySelector("[data-sam3-preview-status]");
  const qualityStrip = card.querySelector("[data-sam3-quality-strip]");
  const diagnostics = card.querySelector("[data-sam3-diagnostics]");
  const slots = [...card.querySelectorAll("[data-sam3-part-slot]")];
  try {
    const data = await api(`/api/packs/${encodeURIComponent(pack.packId)}/spine-sam3/preview.json`);
    const partByName = new Map((data.parts || []).map((part) => [part.name, part]));
    for (const slot of slots) {
      const variant = slot.dataset.sam3Variant;
      const partName = slot.dataset.sam3Part;
      const img = slot.querySelector("img");
      const item = partByName.get(partName);
      const payload = variant === "cleaned-parts" ? item?.cleaned : item?.original;
      if (!img || !payload?.dataUrl) {
        slot.classList.remove("loading");
        slot.classList.add("failed");
        continue;
      }
      img.src = payload.dataUrl;
      slot.classList.remove("loading");
      slot.classList.add("ready");
      if (payload.cleanup?.trimmedPixels) {
        slot.title = `${sam3PartLabel(partName)} · trimmed ${payload.cleanup.trimmedPixels}px`;
      }
    }
    if (status) {
      status.textContent = `${sam3QualityStatusLabel(data.quality?.status)} · ${data.quality?.score ?? "-"} / 100`;
    }
    if (qualityStrip) qualityStrip.innerHTML = sam3QualityPillsHtml(data);
    if (diagnostics) diagnostics.textContent = sam3DiagnosticsText(data);
  } catch (error) {
    for (const slot of slots) {
      slot.classList.remove("loading");
      slot.classList.add("failed");
    }
    if (status) status.textContent = "preview failed";
    if (diagnostics) diagnostics.textContent = "SAM3 preview 读取失败，请稍后重试";
    throw error;
  }
}

function packImportManifestNames(pack) {
  const base = [
    "manifest/engine-import.json",
    "manifest/phaser-animations.json",
    "manifest/unity-sprites.json",
    "manifest/godot-sprites.json",
  ];
  if (pack.packKind === "tile-pack") return [...base, "manifest/tiled-tileset.json"];
  if (pack.packKind === "ui-pack" || pack.packKind === "icon-pack") {
    return [...base, "manifest/ui-atlas.json", "manifest/phaser-atlas.json"];
  }
  if (packHasSpineExport(pack)) {
    const spine = [
      ...base,
      "spine/skeleton.json",
      "spine/skeleton.atlas",
      "spine/rig-template/skeleton.json",
      "spine/rig-template/parts.atlas",
      "spine/rig-template/parts.json",
      "spine/rig-template/quality.json",
    ];
    if (packHasSam3Layers(pack)) {
      spine.push(
        "spine/sam3-layers/skeleton.json",
        "spine/sam3-layers/parts.atlas",
        "spine/sam3-layers/parts.json",
        "spine/sam3-layers/quality.json",
        "spine/sam3-layers/cleanup.json",
        "spine/sam3-layers/cleaned-skeleton.json",
        "spine/sam3-layers/cleaned-parts.atlas",
      );
    }
    return spine;
  }
  return base;
}

function packHasSpineExport(pack) {
  return pack?.packKind === "sprite-actions";
}

function packHasSam3Layers(pack) {
  return Boolean(pack?.spineSam3Layers?.available || pack?.spineSam3Layers?.jobId);
}

async function preparePackProductionPreview(pack) {
  const generation = state.packDownloadGeneration;
  const completeItems = orderedCompleteItems(pack);
  if (completeItems.length === 0) return;
  if (pack.packKind === "sprite-actions" || isDirectionalWalkPreset(pack.preset)) {
    await prepareSpriteAnimationPreview(pack, completeItems, generation);
  } else if (pack.packKind === "tile-pack") {
    await prepareTileabilityPreview(pack, completeItems, generation);
  }
}

async function prepareSpriteAnimationPreview(pack, items, generation) {
  const frameUrls = [];
  for (const item of items) {
    const blob = await transparentBlobFromUrl(item.result.url);
    if (generation !== state.packDownloadGeneration) {
      return;
    }
    const url = URL.createObjectURL(blob);
    state.packPreviewObjectUrls.push(url);
    frameUrls.push({ ...item, url });
  }
  if (frameUrls.length === 0 || generation !== state.packDownloadGeneration) return;

  setAnimationFrames(frameUrls.map((frame) => frame.url), {
    width: pack.metadata?.cellWidth,
    height: pack.metadata?.cellHeight,
    label: `${pack.preset || "sprite"}-animation`,
  });

  const previewBlob = await composePreviewStrip(frameUrls, 256);
  if (generation !== state.packDownloadGeneration) return;
  setObjectDownload(els.downloadPreview, previewBlob, `${pack.preset || "sprite"}-animation-preview.png`);
  const previewDetail = pack.preset === "skill-vfx"
    ? "按生成顺序轮播，检查蓄力、爆发、命中、消散的节奏、峰值亮度和透明边缘"
    : "按生成顺序轮播，检查角色一致性、动作幅度和轮廓可读性；云端 ZIP 同步提供 Spine JSON/Atlas";

  const card = insertPackPreviewCard({
    title: "动作预览",
    detail: previewDetail,
    body: `
      <div class="animation-preview">
        <div class="animation-frame">
          <img data-animation-frame alt="动作帧预览" src="${escapeHtml(frameUrls[0].url)}" />
        </div>
        <div class="animation-thumbs">
          ${frameUrls.map((item, index) => `
            <button class="${index === 0 ? "active" : ""}" type="button" data-frame-index="${index}">
              <img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.label)}" />
              <span>${escapeHtml(item.label)}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `,
  });
  startAnimationPreview(card, frameUrls);
}

async function prepareTileabilityPreview(pack, items, generation) {
  const previewBlob = await composeTileabilityPreview(pack, items);
  if (generation !== state.packDownloadGeneration) return;
  setObjectDownload(els.downloadPreview, previewBlob, `${pack.preset || "tiles"}-tileability-preview.png`);
  insertPackPreviewCard({
    title: "平铺检查",
    detail: "每个 tile 以 2×2 重复显示，质量报告同步检查最外边缘、边缘纹理带和四角色彩差异",
    body: `
      <div class="tileability-preview">
        <img src="${escapeHtml(els.downloadPreview.href)}" alt="地图 tile 平铺检查" />
      </div>
    `,
  });
}

function orderedCompleteItems(pack) {
  return (pack.metadata?.items || [])
    .map((item) => ({ ...item, result: state.packResults[item.id] }))
    .filter((item) => item.result?.url)
    .sort((a, b) => a.index - b.index);
}

function insertPackPreviewCard({ title, detail, body }) {
  els.resultGrid.querySelector(".pack-production-preview")?.remove();
  const card = document.createElement("article");
  card.className = "pack-production-preview";
  card.innerHTML = `
    <div>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detail)}</span>
    </div>
    ${body}
  `;
  const banner = els.resultGrid.querySelector(".pack-banner");
  if (banner) {
    banner.insertAdjacentElement("afterend", card);
  } else {
    els.resultGrid.prepend(card);
  }
  return card;
}

function startAnimationPreview(card, frames) {
  clearInterval(state.packPreviewTimer);
  const image = card.querySelector("[data-animation-frame]");
  const buttons = [...card.querySelectorAll("[data-frame-index]")];
  let index = 0;
  const showFrame = (nextIndex) => {
    index = nextIndex % frames.length;
    image.src = frames[index].url;
    buttons.forEach((button, buttonIndex) => {
      button.classList.toggle("active", buttonIndex === index);
    });
  };
  buttons.forEach((button) => {
    button.addEventListener("click", () => showFrame(Number(button.dataset.frameIndex || 0)));
  });
  state.packPreviewTimer = setInterval(() => showFrame(index + 1), 420);
}

async function composeSheet(pack, items) {
  const cellWidth = pack.metadata.cellWidth;
  const cellHeight = pack.metadata.cellHeight;
  const canvas = document.createElement("canvas");
  canvas.width = pack.metadata.columns * cellWidth;
  canvas.height = pack.metadata.rows * cellHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const item of items) {
    const image = await loadImage(item.result.url);
    const frame = document.createElement("canvas");
    frame.width = cellWidth;
    frame.height = cellHeight;
    const frameCtx = frame.getContext("2d", { willReadFrequently: true });
    frameCtx.clearRect(0, 0, cellWidth, cellHeight);
    drawContain(frameCtx, image, cellWidth, cellHeight);
    removeCornerBackground(frameCtx, cellWidth, cellHeight);
    ctx.drawImage(frame, item.column * cellWidth, item.row * cellHeight);
  }

  return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function composePreviewStrip(items, cellSize) {
  const canvas = document.createElement("canvas");
  canvas.width = items.length * cellSize;
  canvas.height = cellSize;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const [index, item] of items.entries()) {
    const image = await loadImage(item.url);
    drawContainAt(ctx, image, index * cellSize, 0, cellSize, cellSize);
  }
  return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function composeTileabilityPreview(pack, items) {
  const cellSize = 256;
  const tileSize = cellSize / 2;
  const columns = pack.metadata.columns || 4;
  const rows = pack.metadata.rows || Math.ceil(items.length / columns);
  const canvas = document.createElement("canvas");
  canvas.width = columns * cellSize;
  canvas.height = rows * cellSize;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const item of items) {
    const image = await loadImage(item.result.url);
    const x = item.column * cellSize;
    const y = item.row * cellSize;
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 2; column += 1) {
        drawCoverAt(ctx, image, x + column * tileSize, y + row * tileSize, tileSize, tileSize);
      }
    }
  }
  return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function prepareTransparentDownload(sourceUrl, filename, downloadEl, requestId) {
  const blob = await transparentBlobFromUrl(sourceUrl);
  if (requestId && requestId !== state.singleAlphaRequest) return;
  setObjectDownload(downloadEl, blob, alphaFilename(filename));
}

async function preparePackFrameDownload(id, sourceUrl, filename, generation) {
  const blob = await transparentBlobFromUrl(sourceUrl);
  if (generation !== state.packDownloadGeneration) return;
  const link = els.resultGrid.querySelector(`[data-pack-alpha-id="${CSS.escape(id)}"]`);
  if (!link) return;
  if (state.packFrameObjectUrls[id]) URL.revokeObjectURL(state.packFrameObjectUrls[id]);
  const objectUrl = URL.createObjectURL(blob);
  state.packFrameObjectUrls[id] = objectUrl;
  link.href = objectUrl;
  link.download = alphaFilename(filename);
  link.classList.remove("disabled");
}

async function transparentBlobFromUrl(sourceUrl) {
  const image = await loadImage(sourceUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);
  removeCornerBackground(ctx, canvas.width, canvas.height);
  return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function alphaFilename(filename = "lingji_asset.png") {
  const clean = filename.split("/").pop() || "lingji_asset.png";
  return clean.replace(/(\.[^.]+)?$/, "_alpha.png");
}

function drawContain(ctx, image, width, height) {
  drawContainAt(ctx, image, 0, 0, width, height);
}

function drawContainAt(ctx, image, x, y, width, height) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawCoverAt(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function removeCornerBackground(ctx, width, height) {
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const totalPixels = width * height;
  const samplePoints = [
    0,
    (width - 1) * 4,
    ((height - 1) * width) * 4,
    (((height - 1) * width) + width - 1) * 4,
  ];
  const bg = samplePoints.reduce((acc, offset) => {
    acc.r += data[offset];
    acc.g += data[offset + 1];
    acc.b += data[offset + 2];
    return acc;
  }, { r: 0, g: 0, b: 0 });
  bg.r /= samplePoints.length;
  bg.g /= samplePoints.length;
  bg.b /= samplePoints.length;

  const threshold = ALPHA_CONFIG.threshold;
  const feather = ALPHA_CONFIG.feather;
  const maxDistance = threshold + feather;
  const visited = new Uint8Array(totalPixels);
  const queue = new Uint32Array(totalPixels);
  let read = 0;
  let write = 0;

  // Only remove background pixels connected to the canvas edge so interior highlights survive.
  const enqueueIfBackground = (index) => {
    if (visited[index]) return;
    const offset = index * 4;
    const distance = backgroundColorDistance(data, offset, bg);
    if (distance > maxDistance) return;
    visited[index] = 1;
    queue[write] = index;
    write += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueueIfBackground(x);
    enqueueIfBackground((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueueIfBackground(y * width);
    enqueueIfBackground(y * width + width - 1);
  }

  while (read < write) {
    const index = queue[read];
    read += 1;
    const x = index % width;
    const y = Math.floor(index / width);
    const offset = index * 4;
    const distance = backgroundColorDistance(data, offset, bg);
    const alpha = distance <= threshold
      ? 0
      : Math.round(255 * ((distance - threshold) / feather));
    data[offset + 3] = Math.min(data[offset + 3], alpha);

    if (x > 0) enqueueIfBackground(index - 1);
    if (x < width - 1) enqueueIfBackground(index + 1);
    if (y > 0) enqueueIfBackground(index - width);
    if (y < height - 1) enqueueIfBackground(index + width);
  }
  ctx.putImageData(image, 0, 0);
}

function backgroundColorDistance(data, offset, bg) {
  return Math.hypot(data[offset] - bg.r, data[offset + 1] - bg.g, data[offset + 2] - bg.b);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`图片加载失败：${url}`));
    image.src = url;
  });
}

function showError(message) {
  els.emptyState.hidden = false;
  els.emptyState.querySelector("strong").textContent = "生成失败";
  els.emptyState.querySelector("span").textContent = message;
}

function resetEmptyState() {
  els.emptyState.querySelector("strong").textContent = "等待生成";
  els.emptyState.querySelector("span").textContent = "2D 资产会显示在这里，3D GLB 可直接预览或下载";
}

function setBusy(busy, label = "生成中") {
  els.stageOverlay.hidden = !busy;
  els.stageStatus.textContent = label;
  els.planBtn.disabled = busy;
  els.generate2dBtn.disabled = busy || !state.capabilities?.twoD?.available;
  els.generatePackBtn.disabled = busy || !packGenerationAvailable();
  updateLayerButton(busy);
  update3DButton();
  if (busy) els.generate3dBtn.disabled = true;
  if (!busy) updateRouteControls();
}

function setDownload(el, url) {
  revokeObjectDownload(el);
  if (!url) {
    el.classList.add("disabled");
    el.removeAttribute("href");
    return;
  }
  el.href = url;
  el.classList.remove("disabled");
}

function setObjectDownload(el, blob, filename) {
  revokeObjectDownload(el);
  if (!blob) {
    setDownload(el, null);
    return;
  }
  const url = URL.createObjectURL(blob);
  el.dataset.objectUrl = url;
  el.href = url;
  el.download = filename;
  el.classList.remove("disabled");
}

function revokeObjectDownload(el) {
  if (el?.dataset?.objectUrl) {
    URL.revokeObjectURL(el.dataset.objectUrl);
    delete el.dataset.objectUrl;
  }
}

function revokePackFrameDownloads() {
  for (const url of Object.values(state.packFrameObjectUrls)) {
    URL.revokeObjectURL(url);
  }
  state.packFrameObjectUrls = {};
}

function clearPackPreview() {
  if (state.packPreviewTimer) clearInterval(state.packPreviewTimer);
  state.packPreviewTimer = null;
  for (const url of state.packPreviewObjectUrls) {
    URL.revokeObjectURL(url);
  }
  state.packPreviewObjectUrls = [];
  // The GIF frame URLs are the same blob URLs tracked above, so drop them too.
  clearAnimationFrames();
  els.resultGrid.querySelector(".pack-production-preview")?.remove();
  els.resultGrid.querySelector(".pack-quality-card")?.remove();
  els.resultGrid.querySelector(".pack-import-summary")?.remove();
  els.resultGrid.querySelector(".sam3-part-compare")?.remove();
  els.resultGrid.querySelector(".layer-separation-card")?.remove();
  setDownload(els.downloadPreview, null);
}

// ─────────────────────────── Animated GIF export ────────────────────────────
// Frames are blob: object URLs (same-origin, untainted canvas) tracked in
// state.packPreviewObjectUrls and revoked by clearPackPreview, so they stay
// valid until the next generation. GIF encoding happens on demand (click) via
// gif-encoder.js to avoid encoding work the user never asked for.

function gifFramesAvailable() {
  return Boolean(state.animationFrames && state.animationFrames.urls.length >= 2);
}

function setAnimationFrames(urls, meta = {}) {
  const list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (list.length < 2) {
    clearAnimationFrames();
    return;
  }
  state.animationFrames = {
    urls: list,
    width: Math.max(1, Math.round(Number(meta.width) || 512)),
    height: Math.max(1, Math.round(Number(meta.height) || 512)),
    label: meta.label || "lingji-animation",
    delay: Number(meta.delay) || GIF_FRAME_DELAY_MS,
  };
  updateGifButton();
}

function clearAnimationFrames() {
  state.animationFrames = null;
  updateGifButton();
}

function updateGifButton() {
  if (!els.downloadGif) return;
  const available = gifFramesAvailable();
  const disabled = !available || state.gifBusy;
  els.downloadGif.disabled = disabled;
  els.downloadGif.classList.toggle("disabled", disabled);
  els.downloadGif.title = available
    ? tr("gifReadyHint", { count: state.animationFrames.urls.length }, `导出 ${state.animationFrames.urls.length} 帧动画 GIF`)
    : tr("gifNeedFrames", {}, "多帧动画（≥2 帧）才能导出 GIF");
}

function gifTargetDimensions(width, height) {
  const w = Math.max(1, Math.round(Number(width) || 256));
  const h = Math.max(1, Math.round(Number(height) || 256));
  const longest = Math.max(w, h);
  if (longest <= GIF_MAX_DIMENSION) return { width: w, height: h };
  const scale = GIF_MAX_DIMENSION / longest;
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

async function downloadAnimatedGif() {
  if (!gifFramesAvailable()) {
    updateGifButton();
    return;
  }
  const encoder = typeof window !== "undefined" ? window.LingjiGifEncoder : null;
  if (!encoder || typeof encoder.encodeGifFromUrls !== "function") {
    els.downloadGif.title = tr("gifEncoderMissing", {}, "GIF 编码器未加载，请刷新页面");
    return;
  }
  const frames = state.animationFrames;
  const target = gifTargetDimensions(frames.width, frames.height);
  const labelEl = els.downloadGif.querySelector("span");
  const originalLabel = labelEl ? labelEl.textContent : "";
  state.gifBusy = true;
  updateGifButton();
  if (labelEl) labelEl.textContent = tr("gifEncoding", {}, "GIF 生成中…");
  try {
    const blob = await encoder.encodeGifFromUrls(frames.urls, target.width, target.height, {
      delay: frames.delay,
      transparent: true,
      loop: 0,
    });
    triggerBlobDownload(blob, gifFilename(frames.label));
    els.downloadGif.title = tr("gifReadyHint", { count: frames.urls.length }, `已导出 ${frames.urls.length} 帧动画 GIF`);
  } catch (error) {
    console.warn("GIF export failed", error);
    els.downloadGif.title = tr("gifFailed", {}, "GIF 导出失败，请重试");
  } finally {
    state.gifBusy = false;
    if (labelEl) labelEl.textContent = originalLabel || tr("gifDownload", {}, "下载 GIF");
    updateGifButton();
  }
}

function gifFilename(label) {
  return `${safeZipSegment(label || "lingji-animation", "lingji-animation")}.gif`;
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ───────────────────── 4-direction walk selector controls ───────────────────

function updateWalkDirectionControls() {
  if (!els.walkDirectionField) return;
  const supported = isDirectionalWalkPreset() && Boolean(state.capabilities?.canDirectionalWalk);
  els.walkDirectionField.hidden = !supported;
  els.walkDirOptions?.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.walkMode) === state.walkMode);
  });
  if (els.walkDirectionHint) {
    els.walkDirectionHint.textContent = state.walkMode === 8
      ? tr("walkHint8", {}, "8 朝向（含斜向），每朝行走帧按行排列；质量依赖模型（quality-WIP）")
      : tr("walkHint4", {}, "下 / 左 / 右 / 上 四朝向，每朝行走帧按行排列");
  }
}

function setWalkMode(mode) {
  state.walkMode = Number(mode) === 8 ? 8 : 4;
  updateWalkDirectionControls();
  renderAssetBlueprint();
  renderUsageGuidance(state.lastUsage);
}

// ────────────────────── Rewarded-ad → spirit-stone credits ──────────────────

function setRewardStatus(text) {
  if (els.rewardStatus) els.rewardStatus.textContent = text;
}

// Translate the few static labels that are authored inline in index.html so the
// English locale (?lang=en or /en/) does not show hard-coded Chinese.
function applyStaticI18n() {
  const gifLabel = els.downloadGif?.querySelector("span");
  if (gifLabel) gifLabel.textContent = tr("gifDownload", {}, "下载 GIF");
  const walkLabel = document.getElementById("walkDirectionLabel");
  if (walkLabel) walkLabel.textContent = tr("walkDirectionLabel", {}, "行走朝向");
  setRewardStatus(tr("rewardHint", {}, "看一条广告可领 5 灵石，每日最多 3 次"));
  if (els.watchAdRewardLabel) {
    els.watchAdRewardLabel.textContent = tr("rewardButton", {}, "看广告领灵石");
  }
}

function updateRewardButton() {
  if (!els.watchAdRewardBtn) return;
  const configured = Boolean(state.capabilities?.usage?.configured);
  els.watchAdRewardBtn.hidden = !configured;
  const disabled = state.rewardBusy || !accessToken();
  els.watchAdRewardBtn.disabled = disabled;
  els.watchAdRewardBtn.classList.toggle("disabled", disabled);
  if (!state.rewardBusy && els.watchAdRewardLabel) {
    els.watchAdRewardLabel.textContent = tr("rewardButton", {}, "看广告领灵石");
  }
}

// Simulated rewarded-video playback. TODO(ad-sdk): swap this for a real rewarded
// video SDK (AdMob / WeChat / Douyin). This期 only handles the "ad finished →
// server grants credits" side; the server is the source of truth for the grant.
function playRewardAd() {
  const totalMs = 3000;
  const stepMs = 500;
  return new Promise((resolve) => {
    let elapsed = 0;
    const tick = () => {
      elapsed += stepMs;
      const remainingSeconds = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
      if (els.watchAdRewardLabel) {
        els.watchAdRewardLabel.textContent = remainingSeconds > 0
          ? tr("rewardWatching", { seconds: remainingSeconds }, `广告播放中…${remainingSeconds}s`)
          : tr("rewardClaiming", {}, "正在发放灵石…");
      }
      if (elapsed >= totalMs) {
        resolve();
        return;
      }
      state.rewardAdTimer = setTimeout(tick, stepMs);
    };
    state.rewardAdTimer = setTimeout(tick, stepMs);
  });
}

async function watchAdForReward() {
  if (state.rewardBusy) return;
  if (!accessToken()) {
    const message = tr("rewardNeedToken", {}, "先保存访问令牌再领取灵石");
    showAuthRequired(message);
    setRewardStatus(message);
    return;
  }
  if (!state.capabilities?.usage?.configured) {
    setRewardStatus(tr("rewardUnavailable", {}, "当前环境未启用灵石额度"));
    return;
  }
  state.rewardBusy = true;
  updateRewardButton();
  try {
    await playRewardAd();
    const response = await fetch("/api/usage/reward", {
      method: "POST",
      headers: authHeaders({ "content-type": "application/json" }),
      body: JSON.stringify({ nonce: createClientRequestId("reward") }),
    });
    const data = await response.json().catch(() => null);
    if (response.status === 401) {
      const message = tr("rewardNeedToken", {}, "先保存访问令牌再领取灵石");
      showAuthRequired(message);
      setRewardStatus(message);
      return;
    }
    if (response.status === 429) {
      if (data?.usage) renderUsageState(data.usage);
      setRewardStatus(tr("rewardLimit", {}, "今日领取已达上限，明日再来"));
      return;
    }
    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || data?.error || `${response.status}`);
    }
    if (data.usage) renderUsageState(data.usage);
    const granted = Number(data.granted ?? 0);
    const remaining = Number(data.remainingRewards ?? 0);
    setRewardStatus(tr(
      "rewardSuccess",
      { granted, remaining },
      `灵石 +${granted}，今日还可领 ${remaining} 次`,
    ));
  } catch (error) {
    console.warn("Reward claim failed", error);
    setRewardStatus(tr("rewardFailed", { message: error.message }, `领取失败：${error.message}`));
  } finally {
    state.rewardBusy = false;
    updateRewardButton();
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

els.modeTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.mode = tab.dataset.mode;
    els.modeTabs.forEach((item) => item.classList.toggle("active", item === tab));
    renderRouteComparison();
    update3DButton();
  });
});

els.routeOptions.forEach((button) => {
  button.addEventListener("click", () => setAnimationRoute(button.dataset.route));
});

els.planBtn.addEventListener("click", planPrompt);
els.generate2dBtn.addEventListener("click", generate2D);
els.generatePackBtn.addEventListener("click", generatePack);
els.generate3dBtn.addEventListener("click", generate3D);
els.generateLayersBtn?.addEventListener("click", generatePackLayers);
els.saveAccessTokenBtn.addEventListener("click", () => {
  const token = els.accessToken.value.trim();
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    els.authStatus.textContent = "令牌已保存";
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    els.authStatus.textContent = "令牌已清除";
  }
  refreshUsageStatus().catch((error) => {
    els.usageStatus.textContent = `额度读取失败：${error.message}`;
  });
  refreshQueueStatus().catch((error) => {
    els.queueStatus.textContent = `队列读取失败：${error.message}`;
  });
  refreshCloudJobs().catch((error) => {
    els.cloudJobStatus.textContent = `任务读取失败：${error.message}`;
  });
  updateLayerButton();
  updateRewardButton();
});
els.downloadGif?.addEventListener("click", () => {
  downloadAnimatedGif().catch((error) => console.warn("GIF export failed", error));
});
els.walkDirOptions.forEach((button) => {
  button.addEventListener("click", () => setWalkMode(button.dataset.walkMode));
});
els.watchAdRewardBtn?.addEventListener("click", () => {
  watchAdForReward().catch((error) => console.warn("Reward claim failed", error));
});
els.refreshUsageBtn.addEventListener("click", () => {
  refreshUsageStatus().catch((error) => {
    els.usageStatus.textContent = `额度读取失败：${error.message}`;
  });
});
els.refreshQueueBtn.addEventListener("click", () => {
  refreshQueueStatus().catch((error) => {
    els.queueStatus.textContent = `队列读取失败：${error.message}`;
  });
});
els.refreshJobsBtn.addEventListener("click", () => {
  refreshCloudJobs().catch((error) => {
    els.cloudJobStatus.textContent = `任务读取失败：${error.message}`;
  });
});
els.cloudJobList.addEventListener("click", (event) => {
  const action = event.target.closest("[data-cloud-action]");
  if (!action) return;
  const packItem = event.target.closest("[data-cloud-pack-id]");
  if (packItem) {
    restoreCloudPack(packItem.dataset.cloudPackId).catch((error) => showError(error.message));
    return;
  }
  const item = event.target.closest("[data-cloud-prompt-id]");
  if (!item) return;
  restoreCloudJob(item.dataset.cloudPromptId);
});
els.historyList.addEventListener("click", (event) => {
  const action = event.target.closest("[data-history-action]");
  const item = event.target.closest("[data-history-id]");
  if (!action || !item) return;
  if (action.dataset.historyAction === "delete") {
    deleteHistory(item.dataset.historyId);
  } else {
    restoreHistory(item.dataset.historyId);
  }
});
els.routeAbComparison?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-video-demo-id]");
  if (!button) return;
  const demo = state.videoDemos.find((item) => item.id === button.dataset.videoDemoId);
  if (demo) restoreVideoSpriteDemo(demo);
});
els.clearHistoryBtn.addEventListener("click", clearHistory);
els.preset.addEventListener("change", () => applyPreset(els.preset.value, true));
els.assetType.addEventListener("change", renderRouteComparison);
els.style.addEventListener("change", renderRouteComparison);
els.camera.addEventListener("change", renderRouteComparison);
els.actionStrength.addEventListener("change", renderRouteComparison);
els.brief.addEventListener("input", () => {
  els.brief.dataset.autofill = "false";
});

const initialInput = requestedGeneratorInput();
if (initialInput.preset) els.preset.value = initialInput.preset;
applyPreset(els.preset.value, Boolean(initialInput.preset));
applyInitialQueryInput(initialInput);
applyStaticI18n();
renderRouteComparison();
updateGifButton();
updateWalkDirectionControls();
updateRewardButton();
loadHistory();
loadCapabilities().then(() => {
  if (window.lucide) window.lucide.createIcons();
  if (shouldLoadVideoSpriteDemo()) {
    loadVideoSpriteDemo().catch((error) => showError(error.message));
  }
});
