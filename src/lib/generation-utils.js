export const DEFAULT_NEGATIVE =
  "low quality, blurry, noisy, watermark, text, logo, cropped, extra limbs, bad anatomy, deformed hands, duplicated face, messy silhouette";

const ALPHA_READY_BACKGROUND_PROMPT =
  "isolated on a flat solid background color clearly different from the subject, background reaches every canvas edge and corner, no floor, no cast shadow, no gradient, no texture, no scenery";
const ALPHA_READY_NEGATIVE =
  "checkerboard background, transparent background, alpha channel preview, busy background, gradient background, textured background, scenery, floor, cast shadow, ground shadow";
const MAX_BRIEF_CHARS = 1200;

const ALLOWED_ASSET_TYPES = new Set(["character", "creature", "prop", "weapon", "icon", "map", "ui", "vfx"]);
const ALLOWED_STYLES = new Set(["production", "pixel", "anime", "isometric", "realistic", "pixel-art"]);
const ALLOWED_PRESETS = new Set([
  "square",
  "portrait",
  "sprite",
  "icon",
  "character-actions",
  "character-walk-4dir",
  "monster-actions",
  "skill-vfx",
  "ui-icons",
  "map-tiles",
  "map-tile",
  "ui-kit",
  "ui-component",
]);
const ALLOWED_CAMERAS = new Set(["front", "top-down", "isometric", "turnaround", "orthographic"]);

const STYLE_PROMPTS = {
  production: "production-ready game asset, clean readable silhouette, polished concept art, transparent-background friendly",
  pixel: "true pixel art, visible square pixels, low-res retro game sprite, crisp hard edges, limited palette, no antialiasing, no smooth gradients, blocky integer pixel clusters, clean sprite silhouette",
  anime: "anime game character concept, clean cel shading, expressive face, detailed costume design",
  isometric: "isometric game asset, three-quarter view, readable top-down silhouette, asset catalog presentation",
  realistic: "stylized realistic game character, detailed materials, PBR-friendly forms, neutral studio lighting",
};

const ASSET_PROMPTS = {
  character: "game character exactly as described in the brief, complete outfit faithful to the stated genre and materials, clear readable design",
  creature: "game creature or monster as described in the brief, readable anatomy, distinctive silhouette",
  prop: "game prop item exactly as described in the brief, centered single object, clean material definition, no character, no hands",
  weapon: "render exactly the weapon described in the brief as a standalone object, default to a melee or magical armament (sword, blade, spear, staff, bow, talisman) faithful to the brief's genre and materials, NO firearm or gun unless the brief explicitly demands one, centered, readable shape language, no character, no hands",
  icon: "game item icon faithful to the brief, centered on transparent-friendly background, strong silhouette",
  map: "2D game map terrain asset, tileable layout, readable gameplay shapes",
  ui: "game user interface asset, clean separable components, readable material layers",
  vfx: "standalone 2D game skill visual effect itself as described in the brief, centered magical energy or spell effect, NO character, NO person, NO body, NO hands, readable silhouette, transparent-background friendly",
};

const ASSET_NEGATIVE_PROMPTS = {
  weapon: "gun, firearm, rifle, pistol, shotgun, machine gun, modern soldier, person, character, human figure, hands, holding hands",
  prop: "person, character, human figure, hands",
  vfx: "character, person, human figure, full body, face, hands, holding the effect",
};

const PRESET_PROMPTS = {
  square: "single production asset, centered, one object or character only",
  portrait: "single character portrait or full-body concept, vertical composition",
  sprite: "single sprite frame, centered, plain solid background for later background removal",
  icon: "single inventory icon, centered in a safe square, plain solid background",
  "character-actions": "four-frame horizontal sprite sheet: idle, walk, attack, hurt; same character in every frame; equal-width cells; consistent scale; no labels",
  "character-walk-4dir": "directional walk sprite sheet, rows are facing directions (down, left, right, up) and columns are walk-cycle frames; same character in every cell; equal-width cells; consistent scale; no labels",
  "monster-actions": "four-frame horizontal monster sprite sheet: idle, move, attack, death; same creature in every frame; equal-width cells; consistent scale; no labels",
  "skill-vfx": "four-frame horizontal skill VFX sprite sheet: charge, burst, impact, fade; same effect language; equal-width cells; consistent scale; no character; no labels",
  "ui-icons": "eight-item inventory icon sheet in a 4x2 grid; one object per cell; consistent lighting; no text",
  "map-tiles": "top-down orthographic tile sheet in a 4x2 grid; seamless square terrain tiles; no isometric blocks; no perspective camera",
  "map-tile": "single top-down orthographic seamless square terrain tile; no isometric block; no perspective camera",
  "ui-kit": "game UI component sheet; separable health bar, mana bar, slot, button, panel, corner pieces; no text labels",
  "ui-component": "single isolated game UI component only, centered, no text, no icon glyphs, no other UI parts, no sheet layout, no collage",
};

export function normalizeGenerationInput(input = {}) {
  return {
    mode: safeString(input.mode, "2d"),
    brief: safeString(input.brief || input.prompt, "一个适合游戏的原创角色").slice(0, MAX_BRIEF_CHARS),
    assetType: enumString(input.assetType, ALLOWED_ASSET_TYPES, "character"),
    style: enumString(input.style, ALLOWED_STYLES, "production"),
    preset: enumString(input.preset, ALLOWED_PRESETS, "square"),
    camera: enumString(input.camera, ALLOWED_CAMERAS, "front"),
    actionStrength: normalizeActionStrength(input.actionStrength),
    palette: safeString(input.palette, "balanced"),
    engine: safeString(input.engine, "unity"),
  };
}

export function localPromptPlan(input) {
  const style = STYLE_PROMPTS[input.style] || STYLE_PROMPTS.production;
  const asset = ASSET_PROMPTS[input.assetType] || ASSET_PROMPTS.character;
  const preset = PRESET_PROMPTS[input.preset] || PRESET_PROMPTS.square;
  const camera = input.assetType === "vfx"
    ? "orthographic centered VFX sprite frame, no character body, no perspective camera"
    : input.camera === "turnaround"
    ? "orthographic front view, symmetry-friendly, suitable for later 3D reconstruction"
    : input.camera === "top-down"
      ? "strict top-down orthographic camera, no horizon, no perspective depth"
    : input.camera === "isometric"
      ? "isometric three-quarter camera"
      : "front view, full body, centered composition";
  return enforceAlphaReadyPromptPlan({
    title: titleFromBrief(input.brief),
    prompt: [
      `(${input.brief}:1.3)`,
      "stay faithful to the described genre, object and materials",
      asset,
      style,
      preset,
      camera,
      "clean separable game production asset, high contrast silhouette, no text, no watermark",
    ].join(", "),
    negativePrompt: DEFAULT_NEGATIVE,
    styleTags: [input.style, input.assetType, input.preset, input.camera].filter(Boolean),
    productionNotes: [
      "已按游戏素材轮廓优化",
      input.preset?.includes("actions") || input.preset === "skill-vfx" ? "后续需要切帧与透明背景处理" : "适合后续抠图与资产切片",
    ],
    source: "local",
  }, input);
}

export function sanitizePromptPlan(parsed, fallback, input = {}) {
  if (!parsed || typeof parsed !== "object") return { ...fallback, source: "local-fallback" };
  return enforceAlphaReadyPromptPlan({
    title: safeString(parsed.title, fallback.title).slice(0, 40),
    prompt: safeString(parsed.prompt, fallback.prompt).slice(0, 1600),
    negativePrompt: safeString(parsed.negativePrompt, fallback.negativePrompt).slice(0, 1200),
    styleTags: Array.isArray(parsed.styleTags) ? parsed.styleTags.map((x) => safeString(x)).filter(Boolean).slice(0, 8) : fallback.styleTags,
    productionNotes: Array.isArray(parsed.productionNotes)
      ? parsed.productionNotes.map((x) => safeString(x)).filter(Boolean).slice(0, 4)
      : fallback.productionNotes,
    source: "mistral",
  }, input);
}

export function normalizeDimensions(width, height, preset) {
  const defaults = {
    square: [768, 768],
    portrait: [768, 1024],
    sprite: [512, 512],
    icon: [512, 512],
    "character-actions": [1024, 512],
    "character-walk-4dir": [512, 512],
    "monster-actions": [1024, 512],
    "skill-vfx": [1024, 512],
    "ui-icons": [1024, 512],
    "map-tiles": [1024, 512],
    "map-tile": [512, 512],
    "ui-kit": [1024, 512],
    "ui-component": [512, 512],
  };
  const pair = defaults[preset] || defaults.square;
  return {
    width: clampDimension(width || pair[0]),
    height: clampDimension(height || pair[1]),
  };
}

export function clampVideoDimension(value) {
  const n = Math.max(256, Math.min(768, Number(value) || 512));
  return Math.round(n / 64) * 64;
}

export function clampVideoLength(value) {
  const n = Math.max(9, Math.min(49, Number(value) || 33));
  return Math.round((n - 1) / 4) * 4 + 1;
}

export function clampVideoFps(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(6, Math.min(16, Math.round(n))) : 12;
}

export function videoSpritePrompt(input = {}) {
  return [
    safeString(input.brief || input.prompt, "same creature performing a short readable game animation"),
    "short game sprite animation, same subject identity, readable motion, centered full body, orthographic game sprite, flat chroma green background, no shadow, no floor, no gradient, no scenery, no camera movement, no text, no watermark",
  ].join(", ").slice(0, 1200);
}

export function videoSpriteNegativePrompt(input = {}) {
  return safeString(
    input.negativePrompt,
    "text, watermark, subtitles, multiple characters, scene cut, camera shake, zoom, crop, blurry, low quality, extra limbs, morphing identity, busy background, transparent background, floor, ground shadow, cast shadow, gradient background, scenery",
  ).slice(0, 900);
}

export function denoiseForPackItem(input, normalized, item) {
  if (input.referenceDenoise !== undefined && input.referenceDenoise !== null) {
    return normalizeDenoise(input.referenceDenoise);
  }
  const value = item.referenceDenoise?.[normalized.actionStrength] ?? item.referenceDenoise?.balanced;
  return normalizeDenoise(value);
}

export function poseDenoiseForPackItem(input, normalized, item) {
  if (input.referenceDenoise !== undefined && input.referenceDenoise !== null) {
    return normalizeDenoise(input.referenceDenoise);
  }
  const values = {
    idle: { stable: 0.32, balanced: 0.36, expressive: 0.42 },
    walk: { stable: 0.5, balanced: 0.56, expressive: 0.64 },
    attack: { stable: 0.56, balanced: 0.64, expressive: 0.72 },
    hurt: { stable: 0.52, balanced: 0.6, expressive: 0.68 },
  };
  const value = values[item.id]?.[normalized.actionStrength] ?? values[item.id]?.balanced;
  return normalizeDenoise(value ?? denoiseForPackItem(input, normalized, item));
}

export function poseStrengthForPackItem(item) {
  const values = {
    idle: 0.55,
    walk: 0.82,
    attack: 0.95,
    hurt: 0.86,
  };
  return values[item.id] || 0.78;
}

export function titleFromBrief(brief) {
  return safeString(brief, "游戏素材").replace(/[，。,.!！?？].*$/, "").slice(0, 18) || "游戏素材";
}

export function randomSeed() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0];
}

function shouldUseAlphaReadyBackground(input = {}) {
  const preset = safeString(input.preset);
  const assetType = safeString(input.assetType);
  return assetType !== "map" && !["map-tiles", "map-tile"].includes(preset);
}

function appendPromptSegment(value, segment, limit) {
  const base = safeString(value);
  const extra = safeString(segment);
  if (!extra) return base.slice(0, limit);
  if (base.toLowerCase().includes(extra.toLowerCase())) return base.slice(0, limit);
  return [base, extra].filter(Boolean).join(", ").slice(0, limit);
}

function enforceAlphaReadyPromptPlan(plan, input = {}) {
  const assetNegative = ASSET_NEGATIVE_PROMPTS[safeString(input.assetType)];
  const planWithAssetNegative = assetNegative
    ? { ...plan, negativePrompt: appendPromptSegment(plan.negativePrompt || DEFAULT_NEGATIVE, assetNegative, 1200) }
    : plan;
  plan = planWithAssetNegative;
  if (!shouldUseAlphaReadyBackground(input)) return plan;
  const productionNotes = Array.isArray(plan.productionNotes) ? [...plan.productionNotes] : [];
  const alphaNote = "已加入纯色背景约束，配合服务端 edge-connected alpha 导出";
  const nextProductionNotes = productionNotes.includes(alphaNote)
    ? productionNotes.slice(0, 4)
    : [...productionNotes.slice(0, 3), alphaNote];
  const styleTags = Array.isArray(plan.styleTags) ? [...plan.styleTags] : [];
  const nextStyleTags = styleTags.includes("alpha-ready")
    ? styleTags.slice(0, 8)
    : [...styleTags.slice(0, 7), "alpha-ready"];
  return {
    ...plan,
    prompt: appendPromptSegment(plan.prompt, ALPHA_READY_BACKGROUND_PROMPT, 1600),
    negativePrompt: appendPromptSegment(plan.negativePrompt || DEFAULT_NEGATIVE, ALPHA_READY_NEGATIVE, 1200),
    styleTags: nextStyleTags,
    productionNotes: nextProductionNotes,
  };
}

function normalizeActionStrength(value) {
  return ["stable", "balanced", "expressive"].includes(value) ? value : "balanced";
}

function normalizeDenoise(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.62;
  return Math.max(0.25, Math.min(0.9, n));
}

function clampDimension(value) {
  const n = Math.max(256, Math.min(1024, Number(value) || 768));
  return Math.round(n / 64) * 64;
}

function enumString(value, allowed, fallback) {
  const text = safeString(value);
  return allowed.has(text) ? text : fallback;
}

function safeString(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}
