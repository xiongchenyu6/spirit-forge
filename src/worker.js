const ROUTE_ALIAS = {
  "/": "/generator/",
  "/generator/": "/generator/",
  "/landing/": "/landing/",
  "/studio/": "/studio/",
  "/library/": "/library/",
  "/templates/": "/templates/",
  "/pricing/": "/pricing/",
  "/onboarding/": "/onboarding/",
  "/en/": "/generator/",
  "/en/generator/": "/generator/",
  "/en/landing/": "/landing/",
  "/en/studio/": "/studio/",
  "/en/library/": "/library/",
  "/en/templates/": "/templates/",
  "/en/pricing/": "/pricing/",
  "/en/onboarding/": "/onboarding/",
};

const CLEAN_ALIAS_REDIRECT = [
  "/generator",
  "/landing",
  "/studio",
  "/library",
  "/templates",
  "/pricing",
  "/onboarding",
  "/en",
  "/en/generator",
  "/en/landing",
  "/en/studio",
  "/en/library",
  "/en/templates",
  "/en/pricing",
  "/en/onboarding",
];

const PAGE_PREFIXES = [
  "/generator/",
  "/landing/",
  "/studio/",
  "/library/",
  "/templates/",
  "/pricing/",
  "/onboarding/",
];

const DEFAULT_NEGATIVE =
  "low quality, blurry, noisy, watermark, text, logo, cropped, extra limbs, bad anatomy, deformed hands, duplicated face, messy silhouette";
const ALPHA_READY_BACKGROUND_PROMPT =
  "isolated on a flat solid background color clearly different from the subject, background reaches every canvas edge and corner, no floor, no cast shadow, no gradient, no texture, no scenery";
const ALPHA_READY_NEGATIVE =
  "checkerboard background, transparent background, alpha channel preview, busy background, gradient background, textured background, scenery, floor, cast shadow, ground shadow";
const SPINE_LAYER_PROMPTS = [
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

const MAX_JSON_BODY_BYTES = 6_000_000;
const MAX_DATA_URL_CHARS = 5_500_000;
const MAX_BRIEF_CHARS = 1200;
const DEFAULT_USAGE_HOURLY_CREDITS = 240;
const DEFAULT_USAGE_DAILY_CREDITS = 1200;
const USAGE_COSTS = {
  prompt: 1,
  generate2d: 20,
  generate2dPackFrame: 12,
  generateLayerSeparation: 8,
  generate3d: 120,
  prepareVideoSprite: 0,
  generateVideoSprite: 80,
};

const VIDEO_SPRITE_DEMOS = [
  {
    id: "pure-chroma-slime-v1",
    promptId: "358d9e40-5149-4e63-a70a-cf8358e39073",
    filename: "lingji_video_sprite_00002_.webm",
    fileKey: "library/files/video-sprite/358d9e40-5149-4e63-a70a-cf8358e39073/lingji_video_sprite_00002_.webm",
    title: "Pure chroma Video-to-Sprite",
    description: "Wan2.2 image-to-video sample from a 2D monster source frame, post-processed into 4 normalized transparent sprite frames.",
    sourceFrame: "lingji_2d_asset_00045_.png",
    frames: 4,
    dimensions: { width: 512, height: 512, length: 33, fps: 12 },
    quality: {
      status: "pass",
      score: 100,
      averageCoverage: 0.255,
      averageBounds: 0.545,
      maxCenterOffset: 0.13,
      minNormalizeScale: 1.079,
      maxNormalizeScale: 1.091,
      motion: {
        method: "visible-pixel-delta-v1",
        averageFrameDelta: 0.276,
        loopDelta: 0.164,
        motionScore: 100,
        loopScore: 54,
      },
      warnings: 0,
    },
    zipFiles: 21,
  },
  {
    id: "wan-smoke-slime-v1",
    promptId: "6a1b0da9-fb9d-400e-80da-41de463fbd4b",
    filename: "lingji_video_sprite_00001_.webm",
    fileKey: "library/files/video-sprite/6a1b0da9-fb9d-400e-80da-41de463fbd4b/lingji_video_sprite_00001_.webm",
    title: "Wan motion smoke",
    description: "First Wan2.2 image-to-video smoke sample from the same monster source frame, useful for comparing prompt/background cleanup variance.",
    sourceFrame: "lingji_2d_asset_00045_.png",
    frames: 4,
    dimensions: { width: 512, height: 512, length: 33, fps: 12 },
    quality: {
      status: "pass",
      score: 100,
      averageCoverage: 0.25,
      averageBounds: 0.516,
      maxCenterOffset: 0.15,
      minNormalizeScale: 1.024,
      maxNormalizeScale: 1.088,
      motion: {
        method: "visible-pixel-delta-v1",
        averageFrameDelta: 0.27,
        loopDelta: 0.169,
        motionScore: 100,
        loopScore: 52,
      },
      warnings: 0,
    },
    zipFiles: 21,
  },
  {
    id: "expressive-slime-hop-v1",
    promptId: "19b5ab8d-f1f8-4f04-84d2-2108c205d6ea",
    filename: "lingji_video_sprite_00003_.webm",
    fileKey: "library/files/video-sprite/19b5ab8d-f1f8-4f04-84d2-2108c205d6ea/lingji_video_sprite_00003_.webm",
    title: "Expressive slime hop",
    description: "A stronger-motion Wan2.2 sample from the same monster source frame for calibrating motion amplitude, center drift, and loop quality.",
    sourceFrame: "lingji_2d_asset_00045_.png",
    frames: 4,
    dimensions: { width: 512, height: 512, length: 33, fps: 12 },
    quality: {
      status: "pass",
      score: 100,
      averageCoverage: 0.243,
      averageBounds: 0.512,
      maxCenterOffset: 0.152,
      minNormalizeScale: 1.024,
      maxNormalizeScale: 1.091,
      motion: {
        method: "visible-pixel-delta-v1",
        averageFrameDelta: 0.267,
        loopDelta: 0.277,
        motionScore: 100,
        loopScore: 23,
      },
      warnings: 0,
    },
    zipFiles: 21,
  },
];

const VIDEO_SPRITE_DEMO = VIDEO_SPRITE_DEMOS[0];

const VIDEO_TO_SPRITE_NODE_CANDIDATES = [
  "UNETLoader",
  "LoraLoaderModelOnly",
  "ModelSamplingSD3",
  "CLIPLoader",
  "CLIPTextEncode",
  "VAELoader",
  "WanImageToVideo",
  "WanAnimateToVideo",
  "LTXVImgToVideo",
  "LTXVImgToVideoInplace",
  "SVD_img2vid_Conditioning",
  "HunyuanImageToVideo",
  "HunyuanVideo15ImageToVideo",
  "CreateVideo",
  "SaveVideo",
  "SaveWEBM",
  "LoadVideo",
  "FrameInterpolate",
  "KSamplerAdvanced",
  "VAEDecode",
];

const LAYER_SEPARATION_NODE_CANDIDATES = [
  "SAM3_Detect",
  "SAM3_TrackToMask",
  "CropByBBoxes",
  "DrawBBoxes",
  "ImageCompositeMasked",
  "ImageToMask",
  "MaskToImage",
  "PrimitiveBoundingBox",
  "GrowMask",
  "FeatherMask",
  "ThresholdMask",
  "BriaRemoveImageBackground",
  "RecraftRemoveBackgroundNode",
];

const ALLOWED_ASSET_TYPES = new Set(["character", "creature", "prop", "weapon", "icon", "map", "ui", "vfx"]);
const ALLOWED_STYLES = new Set(["production", "pixel", "anime", "isometric", "realistic", "pixel-art"]);
const ALLOWED_PRESETS = new Set([
  "square",
  "portrait",
  "sprite",
  "icon",
  "character-actions",
  "monster-actions",
  "skill-vfx",
  "ui-icons",
  "map-tiles",
  "map-tile",
  "ui-kit",
  "ui-component",
]);
const ALLOWED_CAMERAS = new Set(["front", "top-down", "isometric", "turnaround", "orthographic"]);
const ALLOWED_COMFY_FILE_TYPES = new Set(["input", "output", "temp"]);

const STYLE_PROMPTS = {
  production: "production-ready game asset, clean readable silhouette, polished concept art, transparent-background friendly",
  pixel: "pixel art game sprite, crisp hard edges, limited palette, no antialiasing, clean sprite silhouette, integer pixel clusters",
  anime: "anime game character concept, clean cel shading, expressive face, detailed costume design",
  isometric: "isometric game asset, three-quarter view, readable top-down silhouette, asset catalog presentation",
  realistic: "stylized realistic game character, detailed materials, PBR-friendly forms, neutral studio lighting",
};

const ASSET_PROMPTS = {
  character: "full body game character, complete outfit, clear front-facing design",
  creature: "game creature or monster, readable anatomy, distinctive silhouette",
  prop: "game prop item, centered object, clean material definition",
  weapon: "game weapon asset, centered, readable shape language, no hands",
  icon: "game item icon, centered on transparent-friendly background, strong silhouette",
  map: "2D game map terrain asset, tileable layout, readable gameplay shapes",
  ui: "game user interface asset, clean separable components, readable material layers",
  vfx: "2D game skill visual effect, centered magical energy, readable silhouette, transparent-background friendly",
};

const PRESET_PROMPTS = {
  square: "single production asset, centered, one object or character only",
  portrait: "single character portrait or full-body concept, vertical composition",
  sprite: "single sprite frame, centered, plain solid background for later background removal",
  icon: "single inventory icon, centered in a safe square, plain solid background",
  "character-actions": "four-frame horizontal sprite sheet: idle, walk, attack, hurt; same character in every frame; equal-width cells; consistent scale; no labels",
  "monster-actions": "four-frame horizontal monster sprite sheet: idle, move, attack, death; same creature in every frame; equal-width cells; consistent scale; no labels",
  "skill-vfx": "four-frame horizontal skill VFX sprite sheet: charge, burst, impact, fade; same effect language; equal-width cells; consistent scale; no character; no labels",
  "ui-icons": "eight-item inventory icon sheet in a 4x2 grid; one object per cell; consistent lighting; no text",
  "map-tiles": "top-down orthographic tile sheet in a 4x2 grid; seamless square terrain tiles; no isometric blocks; no perspective camera",
  "map-tile": "single top-down orthographic seamless square terrain tile; no isometric block; no perspective camera",
  "ui-kit": "game UI component sheet; separable health bar, mana bar, slot, button, panel, corner pieces; no text labels",
  "ui-component": "single isolated game UI component only, centered, no text, no icon glyphs, no other UI parts, no sheet layout, no collage",
};

const PACK_PRESETS = {
  "character-actions": {
    kind: "sprite-actions",
    assetType: "character",
    style: "pixel",
    camera: "front",
    cell: [512, 512],
    columns: 4,
    rows: 1,
    shared: "same character identity, same costume and colors, one full-body sprite frame only, centered, plain solid background, no frame border",
    items: [
      {
        id: "idle",
        label: "Idle",
        prompt: "idle standing pose, relaxed ready stance",
        referenceDenoise: { stable: 0.38, balanced: 0.46, expressive: 0.54 },
      },
      {
        id: "walk",
        label: "Walk",
        prompt: "walk cycle key pose, one foot forward, arms offset, visible stepping motion, not idle",
        referenceDenoise: { stable: 0.58, balanced: 0.7, expressive: 0.82 },
      },
      {
        id: "attack",
        label: "Attack",
        prompt: "wide sword slash action pose, weapon extended, diagonal attack motion, dramatic torso turn, not idle",
        referenceDenoise: { stable: 0.66, balanced: 0.78, expressive: 0.88 },
      },
      {
        id: "hurt",
        label: "Hurt",
        prompt: "hurt reaction key pose, body recoiling backward, off-balance stance, defensive expression, not idle",
        referenceDenoise: { stable: 0.62, balanced: 0.74, expressive: 0.84 },
      },
    ],
  },
  "monster-actions": {
    kind: "sprite-actions",
    assetType: "creature",
    style: "pixel",
    camera: "front",
    cell: [512, 512],
    columns: 4,
    rows: 1,
    shared: "same creature identity, same colors and body shape, one centered monster sprite frame only, plain solid background, no frame border",
    items: [
      {
        id: "idle",
        label: "Idle",
        prompt: "idle monster pose, neutral expression",
        referenceDenoise: { stable: 0.38, balanced: 0.46, expressive: 0.54 },
      },
      {
        id: "move",
        label: "Move",
        prompt: "movement key pose, body squashed forward or stepping forward, clear motion, not idle",
        referenceDenoise: { stable: 0.58, balanced: 0.7, expressive: 0.82 },
      },
      {
        id: "attack",
        label: "Attack",
        prompt: "attack key pose, open mouth or striking appendage, aggressive forward motion, not idle",
        referenceDenoise: { stable: 0.66, balanced: 0.78, expressive: 0.88 },
      },
      {
        id: "death",
        label: "Death",
        prompt: "defeated collapse key pose, flattened or fallen body, readable silhouette, not idle",
        referenceDenoise: { stable: 0.62, balanced: 0.74, expressive: 0.84 },
      },
    ],
  },
  "skill-vfx": {
    kind: "sprite-actions",
    assetType: "vfx",
    style: "pixel",
    camera: "front",
    cell: [512, 512],
    columns: 4,
    rows: 1,
    shared: "same magical skill effect identity, centered VFX sprite frame only, plain solid chroma background, no character, no UI frame, no labels, consistent scale, readable looping sequence",
    items: [
      {
        id: "charge",
        label: "Charge",
        prompt: "charging anticipation frame, compact glowing core with small sparks gathering inward",
        referenceDenoise: { stable: 0.52, balanced: 0.62, expressive: 0.72 },
      },
      {
        id: "burst",
        label: "Burst",
        prompt: "energy burst frame, expanding ring and lightning arcs, strongest readable silhouette",
        referenceDenoise: { stable: 0.58, balanced: 0.7, expressive: 0.82 },
      },
      {
        id: "impact",
        label: "Impact",
        prompt: "impact peak frame, bright flash core, jagged sparks and flame tongues radiating outward",
        referenceDenoise: { stable: 0.62, balanced: 0.74, expressive: 0.86 },
      },
      {
        id: "fade",
        label: "Fade",
        prompt: "dissipating fade frame, fading embers, smaller arcs, readable loop back to charge",
        referenceDenoise: { stable: 0.56, balanced: 0.66, expressive: 0.76 },
      },
    ],
  },
  "ui-icons": {
    kind: "icon-pack",
    assetType: "icon",
    style: "pixel",
    camera: "front",
    cell: [512, 512],
    columns: 4,
    rows: 2,
    shared: "single inventory icon only, centered, no label text, no extra objects, plain solid background",
    items: [
      { id: "jade_sword", label: "Jade Sword", prompt: "jade sword inventory icon" },
      { id: "red_potion", label: "Red Potion", prompt: "red health potion bottle inventory icon" },
      { id: "shield", label: "Shield", prompt: "round steel shield inventory icon" },
      { id: "key", label: "Key", prompt: "gold key inventory icon" },
      { id: "coin", label: "Coin", prompt: "single gold coin inventory icon" },
      { id: "scroll", label: "Scroll", prompt: "rolled parchment scroll inventory icon" },
      { id: "gem", label: "Gem", prompt: "blue crystal gem inventory icon" },
      { id: "boot", label: "Boot", prompt: "leather boot inventory icon" },
    ],
  },
  "ui-kit": {
    kind: "ui-pack",
    assetType: "ui",
    style: "production",
    camera: "front",
    cell: [512, 512],
    columns: 4,
    rows: 2,
    shared: "single fantasy game UI component only, centered, no label text, no icon glyphs, plain solid chroma background, clean separable edges",
    items: [
      { id: "health_bar", label: "Health Bar", prompt: "horizontal health bar UI component with ornate frame and red fill area" },
      { id: "mana_bar", label: "Mana Bar", prompt: "horizontal mana bar UI component with ornate frame and blue fill area" },
      { id: "inventory_slot", label: "Inventory Slot", prompt: "square inventory slot frame UI component, empty center" },
      { id: "action_button", label: "Action Button", prompt: "round action button UI component, empty center, pressed-state friendly bevel" },
      { id: "dialog_panel", label: "Dialog Panel", prompt: "rectangular dialog panel UI component with decorative border and empty interior" },
      { id: "quest_panel", label: "Quest Panel", prompt: "compact quest tracker panel UI component with empty content area" },
      { id: "panel_corner", label: "Panel Corner", prompt: "ornate panel corner decoration UI component for nine-slice frames" },
      { id: "divider", label: "Divider", prompt: "thin decorative horizontal divider UI component" },
    ],
  },
  "map-tiles": {
    kind: "tile-pack",
    assetType: "map",
    style: "pixel",
    camera: "top-down",
    cell: [512, 512],
    columns: 4,
    rows: 2,
    shared: "single top-down orthographic square terrain tile only, seamless edges, no isometric camera, no horizon, no border, no labels",
    items: [
      { id: "grass", label: "Grass", prompt: "grass terrain tile" },
      { id: "dirt_road", label: "Dirt Road", prompt: "dirt road terrain tile" },
      { id: "stone_road", label: "Stone Road", prompt: "stone road terrain tile" },
      { id: "water_edge", label: "Water Edge", prompt: "grass to water edge terrain tile" },
      { id: "cliff", label: "Cliff", prompt: "top-down cliff edge terrain tile" },
      { id: "sand", label: "Sand", prompt: "sand terrain tile" },
      { id: "forest_floor", label: "Forest Floor", prompt: "forest floor terrain tile with small leaves" },
      { id: "lava_rock", label: "Lava Rock", prompt: "lava rock terrain tile" },
    ],
  },
};

const CHARACTER_OPENPOSE_TEMPLATES = {
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

const OPENPOSE_LIMBS = [
  ["nose", "neck", [255, 255, 255]],
  ["nose", "lEye", [255, 51, 51]],
  ["lEye", "lEar", [255, 136, 51]],
  ["nose", "rEye", [255, 255, 51]],
  ["rEye", "rEar", [136, 255, 51]],
  ["neck", "lShoulder", [51, 255, 51]],
  ["lShoulder", "lElbow", [51, 255, 136]],
  ["lElbow", "lHand", [51, 255, 255]],
  ["neck", "rShoulder", [51, 136, 255]],
  ["rShoulder", "rElbow", [51, 51, 255]],
  ["rElbow", "rHand", [136, 51, 255]],
  ["neck", "lHip", [255, 51, 255]],
  ["lHip", "lKnee", [255, 51, 136]],
  ["lKnee", "lFoot", [255, 51, 51]],
  ["neck", "rHip", [255, 170, 51]],
  ["rHip", "rKnee", [255, 255, 51]],
  ["rKnee", "rFoot", [136, 255, 51]],
];

export class UsageLimiter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    if (request.method !== "POST") {
      return usageJson({ error: "method_not_allowed" }, 405);
    }

    const input = await request.json().catch(() => ({}));
    const now = Date.now();
    const action = safeString(input.action, "status");
    const refund = input.refund === true;
    const cost = Math.max(0, Math.min(500, Math.abs(Number(input.cost) || 0)));
    const hourlyLimit = positiveNumber(input.hourlyLimit, DEFAULT_USAGE_HOURLY_CREDITS);
    const dailyLimit = positiveNumber(input.dailyLimit, DEFAULT_USAGE_DAILY_CREDITS);
    const hourStart = Math.floor(now / 3_600_000) * 3_600_000;
    const dayStart = Math.floor(now / 86_400_000) * 86_400_000;
    const stored = await this.state.storage.get(["hour", "day"]);
    const hour = stored.get("hour")?.start === hourStart
      ? stored.get("hour")
      : { start: hourStart, used: 0 };
    const day = stored.get("day")?.start === dayStart
      ? stored.get("day")
      : { start: dayStart, used: 0 };

    if (refund) {
      if (cost > 0) {
        hour.used = Math.max(0, hour.used - cost);
        day.used = Math.max(0, day.used - cost);
        await this.state.storage.put({ hour, day });
      }
      return usageJson(usagePayload({
        allowed: true,
        action,
        cost,
        hour,
        day,
        hourlyLimit,
        dailyLimit,
        retryAt: null,
      }));
    }

    const hourRemaining = Math.max(0, hourlyLimit - hour.used);
    const dayRemaining = Math.max(0, dailyLimit - day.used);
    const allowed = cost === 0 || (hourRemaining >= cost && dayRemaining >= cost);
    const retryAt = hourRemaining < cost
      ? hour.start + 3_600_000
      : dayRemaining < cost
        ? day.start + 86_400_000
        : null;

    if (!allowed) {
      return usageJson(usagePayload({
        allowed: false,
        action,
        cost,
        hour,
        day,
        hourlyLimit,
        dailyLimit,
        retryAt,
      }), 429);
    }

    if (cost > 0) {
      hour.used += cost;
      day.used += cost;
      await this.state.storage.put({ hour, day });
    }

    return usageJson(usagePayload({
      allowed: true,
      action,
      cost,
      hour,
      day,
      hourlyLimit,
      dailyLimit,
      retryAt,
    }));
  }
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        return await handleApi(request, env, url);
      }
      return await handleAssets(request, env, url);
    } catch (error) {
      const status = Number(error?.status) || 500;
      return jsonResponse(
        {
          error: error?.code || (status >= 500 ? "internal_error" : "bad_request"),
          message: error instanceof Error ? error.message : String(error),
        },
        status,
      );
    }
  },
};

async function handleApi(request, env, url) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (url.pathname === "/api/capabilities" && request.method === "GET") {
    return jsonResponse(await getCapabilities(env));
  }

  if (url.pathname === "/api/comfy/view" && (request.method === "GET" || request.method === "HEAD")) {
    return await proxyComfyView(env, url, request.method);
  }

  if (url.pathname === "/api/library/view" && (request.method === "GET" || request.method === "HEAD")) {
    return await proxyLibraryView(request, env, url, request.method);
  }

  if (url.pathname === "/api/demo/video-sprite" && request.method === "GET") {
    return jsonResponse(await getVideoSpriteDemo(env));
  }

  const authFailure = authorizeApiRequest(request, env);
  if (authFailure) return authFailure;

  if (url.pathname === "/api/usage" && request.method === "GET") {
    return jsonResponse(await usageStatus(request, env));
  }

  if (url.pathname === "/api/queue" && request.method === "GET") {
    return jsonResponse(await getQueueStatus(env, url));
  }

  if (url.pathname === "/api/jobs" && request.method === "GET") {
    return jsonResponse(await listJobs(env, url));
  }

  if (url.pathname === "/api/packs" && request.method === "GET") {
    return jsonResponse(await listPacks(env, url));
  }

  if (url.pathname === "/api/library" && request.method === "GET") {
    return jsonResponse(await listLibrary(env, url));
  }

  if (url.pathname === "/api/prompt" && request.method === "POST") {
    const input = await readJson(request);
    const limited = await enforceUsageLimit(request, env, "prompt", USAGE_COSTS.prompt);
    if (limited) return limited;
    return jsonResponse(await planPrompt(input, env));
  }

  if (url.pathname === "/api/generate/2d" && request.method === "POST") {
    const input = await readJson(request);
    return await meteredJsonResponse(request, env, "generate2d", USAGE_COSTS.generate2d, async () => (
      await submit2DJob(input, env)
    ));
  }

  if (url.pathname === "/api/generate/2d-pack" && request.method === "POST") {
    const input = await readJson(request);
    const cost = usageCostForPackInput(input);
    return await meteredJsonResponse(request, env, "generate2d-pack", cost, async () => (
      await submit2DPack(input, env)
    ));
  }

  if (url.pathname === "/api/generate/video-sprite" && request.method === "POST") {
    const input = await readJson(request);
    if (input.submit === true) {
      const prepared = await prepareVideoSpriteExperiment(input, env);
      if (!prepared.ok) return jsonResponse(prepared);
      return await meteredJsonResponse(request, env, "generate-video-sprite", USAGE_COSTS.generateVideoSprite, async () => (
        await submitVideoSpriteExperiment(input, env, prepared)
      ));
    }
    return jsonResponse(await prepareVideoSpriteExperiment(input, env));
  }

  const packLayerMatch = url.pathname.match(/^\/api\/packs\/([^/]+)\/layers\/generate$/);
  if (packLayerMatch && request.method === "POST") {
    const input = await readJson(request);
    const target = await loadPackLayerSeparationTarget(decodeURIComponent(packLayerMatch[1]), input, env);
    return await meteredJsonResponse(request, env, "generate-layer-separation", USAGE_COSTS.generateLayerSeparation, async () => (
      await submitPackLayerSeparation(target, input, env)
    ));
  }

  const packSam3PreviewMatch = url.pathname.match(/^\/api\/packs\/([^/]+)\/spine-sam3\/preview\.json$/);
  if (packSam3PreviewMatch && request.method === "GET") {
    return jsonResponse(await getPackSpineSam3Preview(decodeURIComponent(packSam3PreviewMatch[1]), env));
  }

  const packSam3PartMatch = url.pathname.match(/^\/api\/packs\/([^/]+)\/spine-sam3\/(parts|cleaned-parts)\/([^/]+)\.png$/);
  if (packSam3PartMatch && request.method === "GET") {
    return await servePackSpineSam3Part(
      decodeURIComponent(packSam3PartMatch[1]),
      packSam3PartMatch[2],
      decodeURIComponent(packSam3PartMatch[3]),
      env,
    );
  }

  const packFrameRerunMatch = url.pathname.match(/^\/api\/packs\/([^/]+)\/frames\/([^/]+)\/rerun$/);
  if (packFrameRerunMatch && request.method === "POST") {
    const input = await readJson(request);
    const target = await loadPackFrameRerunTarget(
      decodeURIComponent(packFrameRerunMatch[1]),
      decodeURIComponent(packFrameRerunMatch[2]),
      input,
      env,
    );
    return await meteredJsonResponse(request, env, "generate2d-pack-frame-rerun", USAGE_COSTS.generate2dPackFrame, async () => (
      await rerunPackFrame(target, input, env)
    ));
  }

  if (url.pathname === "/api/generate/3d" && request.method === "POST") {
    const input = await readJson(request);
    return await meteredJsonResponse(request, env, "generate3d", USAGE_COSTS.generate3d, async () => (
      await submit3DJob(input, env)
    ));
  }

  const jobMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)$/);
  if (jobMatch && request.method === "GET") {
    return jsonResponse(await getJob(jobMatch[1], env, url));
  }

  const packZipMatch = url.pathname.match(/^\/api\/packs\/([^/]+)\/download\.zip$/);
  if (packZipMatch && request.method === "GET") {
    return await downloadPackZip(packZipMatch[1], env);
  }

  const packMatch = url.pathname.match(/^\/api\/packs\/([^/]+)$/);
  if (packMatch && request.method === "GET") {
    return jsonResponse(await getPack(packMatch[1], env));
  }

  return jsonResponse({ error: "not_found" }, 404);
}

async function handleAssets(request, env, url) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const original = decodeURIComponent(url.pathname || "/");
  if (CLEAN_ALIAS_REDIRECT.includes(original)) {
    return Response.redirect(`${url.origin}${original}/`, 301);
  }

  const normalized = normalizePath(original);
  const pathname = ROUTE_ALIAS[normalized] || mapSectionPath(normalized) || normalized;
  const candidates = [pathname];

  if (pathname.endsWith("/") && pathname !== "/") {
    candidates.push(`${pathname}index.html`);
  } else if (!isFilePath(pathname) && pathname !== "/") {
    candidates.push(`${pathname}/index.html`);
  }

  if (pathname === "/" || original === "") {
    candidates.push("/ui_kits/generator/index.html");
  }

  const matched = await tryFetchAsset(request, env, candidates);
  if (matched) {
    const headers = new Headers(matched.headers);
    const isHtml = pathname.endsWith(".html") || headers.get("content-type")?.includes("text/html");
    if (!isHtml) {
      headers.set("cache-control", "public, max-age=31536000, immutable");
    } else {
      headers.set("cache-control", "no-store");
    }
    return new Response(matched.body, {
      status: matched.status,
      statusText: matched.statusText,
      headers,
    });
  }

  const fallback = await env.ASSETS.fetch(buildAssetRequest(request, "/ui_kits/generator/index.html"));
  if (fallback.status !== 404) return fallback;
  return new Response("Not Found", { status: 404 });
}

async function getCapabilities(env) {
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
      hourlyCredits: positiveNumber(env.USAGE_HOURLY_CREDITS, DEFAULT_USAGE_HOURLY_CREDITS),
      dailyCredits: positiveNumber(env.USAGE_DAILY_CREDITS, DEFAULT_USAGE_DAILY_CREDITS),
      costs: {
        prompt: USAGE_COSTS.prompt,
        generate2d: USAGE_COSTS.generate2d,
        generate2dPackFrame: USAGE_COSTS.generate2dPackFrame,
        generateLayerSeparation: USAGE_COSTS.generateLayerSeparation,
        generate3d: USAGE_COSTS.generate3d,
        prepareVideoSprite: USAGE_COSTS.prepareVideoSprite,
        generateVideoSprite: USAGE_COSTS.generateVideoSprite,
      },
    },
  };
}

function selectVideoToSprite(objectInfo = {}, modelLists = {}) {
  const hasNode = (name) => Boolean(objectInfo && objectInfo[name]);
  const detected = VIDEO_TO_SPRITE_NODE_CANDIDATES.filter(hasNode);
  const openSourceNodes = detected.filter((name) => !/Api|Node$/i.test(name));
  const hasVideoOutput = detected.some((name) => ["CreateVideo", "SaveVideo", "SaveWEBM", "LoadVideo"].includes(name));
  const hasImageToVideo = detected.some((name) => /ImageToVideo|ImgToVideo|img2vid|AnimateToVideo/i.test(name));
  const diffusion = Array.isArray(modelLists.diffusion) ? modelLists.diffusion : [];
  const vae = Array.isArray(modelLists.vae) ? modelLists.vae : [];
  const textEncoders = Array.isArray(modelLists.textEncoders) ? modelLists.textEncoders : [];
  const loras = Array.isArray(modelLists.loras) ? modelLists.loras : [];
  const models = {
    wanI2v: diffusion.filter((name) => /wan.*i2v|i2v.*wan/i.test(name)),
    wanT2v: diffusion.filter((name) => /wan.*t2v|t2v.*wan/i.test(name)),
    vae: vae.filter((name) => /wan/i.test(name)),
    textEncoders: textEncoders.filter((name) => /umt5|qwen/i.test(name)),
    loras: loras.filter((name) => /Wan2\.2-Lightning_I2V/i.test(name)),
  };
  const missing = [];
  if (!hasImageToVideo) missing.push("missing image-to-video workflow node");
  if (!hasVideoOutput) missing.push("missing video load/save node");
  if (models.wanI2v.length === 0) missing.push("missing Wan image-to-video diffusion model");
  if (models.vae.length === 0) missing.push("missing Wan VAE");
  if (models.textEncoders.length === 0) missing.push("missing Wan text encoder");
  if (!models.loras.some((name) => /HIGH/i.test(name))) missing.push("missing Wan2.2 Lightning I2V high-noise LoRA");
  if (!models.loras.some((name) => /LOW/i.test(name))) missing.push("missing Wan2.2 Lightning I2V low-noise LoRA");
  return {
    available: hasImageToVideo && hasVideoOutput && missing.length === 0,
    experimental: true,
    workflow: "Video-to-Sprite A/B experiment",
    strategy: "generate short solid-background motion video, sample keyframes, remove background, align subject, export sprite sheet",
    detectedNodes: detected,
    openSourceNodes,
    models,
    missing,
  };
}

function selectLayerSeparation(objectInfo = {}, modelLists = {}) {
  const hasNode = (name) => Boolean(objectInfo && objectInfo[name]);
  const detectedNodes = LAYER_SEPARATION_NODE_CANDIDATES.filter(hasNode);
  const localSegmentationNodes = detectedNodes.filter((name) => !/Bria|Recraft/i.test(name));
  const apiNodes = detectedNodes.filter((name) => /Bria|Recraft/i.test(name));
  const checkpoints = Array.isArray(modelLists.checkpoints) ? modelLists.checkpoints : [];
  const sam3Checkpoint = checkpoints.find((name) => /sam[-_. ]?3/i.test(name)) || null;
  const requiredLocal = [
    "CheckpointLoaderSimple",
    "CLIPTextEncode",
    "SAM3_Detect",
    "MaskToImage",
    "PrimitiveBoundingBox",
    "SaveImage",
  ];
  const helpfulLocal = [
    "CropByBBoxes",
    "DrawBBoxes",
    "ImageCompositeMasked",
    "GrowMask",
    "FeatherMask",
    "ThresholdMask",
    "ImageToMask",
  ];
  const missing = [];
  for (const node of requiredLocal) {
    if (!hasNode(node)) missing.push(`missing node: ${node}`);
  }
  if (!sam3Checkpoint) missing.push("missing SAM3 checkpoint");
  const available = missing.length === 0;
  return {
    available,
    experimental: true,
    workflow: available
      ? "SAM3 checkpoint + text-prompt masks for first-pass Spine layer separation"
      : "heuristic rig-template only",
    strategy: available
      ? "use local SAM3 text masks to create subject and body-part layer previews for the Spine rig-template"
      : "export heuristic first-frame crops and quality.json until local segmentation nodes and model are available",
    mode: available ? "local-open-segmentation" : "heuristic-template",
    models: {
      sam3Checkpoint,
      checkpointSource: sam3Checkpoint ? "checkpoints" : null,
    },
    detectedNodes,
    localSegmentationNodes,
    apiNodes,
    requiredLocal: requiredLocal.reduce((acc, node) => {
      acc[node] = hasNode(node);
      return acc;
    }, {}),
    helpfulLocal: helpfulLocal.reduce((acc, node) => {
      acc[node] = hasNode(node);
      return acc;
    }, {}),
    missing,
    notes: [
      apiNodes.length
        ? "Bria/Recraft API nodes are detected but are not treated as the default open-source path."
        : "No Bria/Recraft API nodes detected.",
      available
        ? "Local segmentation is available for a future precise layer-generation workflow."
        : "The current ZIP still exports the heuristic rig-template scaffold.",
    ],
  };
}

async function planPrompt(input, env) {
  const normalized = normalizeGenerationInput(input);
  const fallback = localPromptPlan(normalized);

  if (!env.MISTRAL_API_KEY) {
    return { ...fallback, source: "local-fallback", warning: "MISTRAL_API_KEY is not configured" };
  }

  const body = {
    model: env.MISTRAL_MODEL || "mistral-small-latest",
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content:
          "You are a game asset prompt engineer. Return strict JSON only. No markdown. Optimize for practical 2D game production through ComfyUI. Respect the requested preset exactly: action sprite sheets need equal-width frames and a consistent character; UI icon sheets need clean grids; map tiles need strict top-down orthographic seamless tiles, not isometric blocks. For non-map assets, require an isolated flat solid background color clearly different from the subject so deterministic edge-connected background removal can create transparent sprites. Avoid text, labels, watermarks, floor shadows, gradients, textured backgrounds, and busy scenes.",
      },
      {
        role: "user",
        content: JSON.stringify({
          task:
            "Create a concise English prompt plan for game asset generation. Keep the prompt visual, concrete, and production-oriented.",
          schema: {
            title: "short asset name in Chinese",
            prompt: "English positive prompt",
            negativePrompt: "English negative prompt",
            styleTags: ["short tags"],
            productionNotes: ["short Chinese notes"],
          },
          input: normalized,
        }),
      },
    ],
  };

  try {
    const response = await fetch(`${mistralBase(env)}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Mistral ${response.status}: ${text.slice(0, 500)}`);
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const parsed = parseJsonObject(content);
    return sanitizePromptPlan(parsed, fallback, normalized);
  } catch (error) {
    return {
      ...fallback,
      source: "local-fallback",
      warning: error instanceof Error ? error.message : String(error),
    };
  }
}

async function submit2DJob(input, env) {
  const normalized = normalizeGenerationInput(input);
  const plan = input.prompt ? localPromptPlan({ ...normalized, brief: input.prompt }) : await planPrompt(normalized, env);
  const seed = Number.isFinite(Number(input.seed)) ? Number(input.seed) : randomSeed();
  const dimensions = normalizeDimensions(input.width, input.height, normalized.preset);
  const workflow = buildFlux1Workflow({
    prompt: plan.prompt,
    negativePrompt: plan.negativePrompt || DEFAULT_NEGATIVE,
    width: dimensions.width,
    height: dimensions.height,
    seed,
  });
  const submitted = await submitComfyWorkflow(env, workflow);
  const job = {
    ok: true,
    kind: "2d",
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    seed,
    dimensions,
    plan,
    pollUrl: `/api/jobs/${submitted.prompt_id}?kind=2d`,
  };
  await rememberJobRecord(env, {
    id: `2d:${submitted.prompt_id}`,
    kind: "2d",
    status: "queued",
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    seed,
    dimensions,
    input: normalized,
    plan,
    cost: USAGE_COSTS.generate2d,
    pollUrl: job.pollUrl,
  });
  return job;
}

async function rememberJobRecord(env, record) {
  if (!env.ASSET_BUCKET) return null;
  try {
    return await putJobRecord(env, record);
  } catch (error) {
    console.warn("R2 job log failed", error);
    return null;
  }
}

async function patchJobRecordQuietly(env, promptId, patch) {
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

async function rememberPackRecord(env, record) {
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

async function readJobRecord(env, promptId) {
  if (!env.ASSET_BUCKET || !promptId) return null;
  const object = await env.ASSET_BUCKET.get(jobRecordKey(promptId));
  if (!object) return null;
  return JSON.parse(await object.text());
}

async function listJobs(env, url) {
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

async function putPackRecord(env, record) {
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

async function readPackRecord(env, packId) {
  if (!env.ASSET_BUCKET || !packId) return null;
  const object = await env.ASSET_BUCKET.get(packRecordKey(packId));
  if (!object) return null;
  return JSON.parse(await object.text());
}

async function refreshPackRecord(env, packId) {
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

async function listPacks(env, url) {
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

async function getPack(packId, env) {
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

async function servePackSpineSam3Part(packId, variant, partName, env) {
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

async function getPackSpineSam3Preview(packId, env) {
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

async function readPackCompletedFrameFiles(env, pack) {
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

async function downloadPackZip(packId, env) {
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

  const shouldUseTransparentFrames = shouldPackUseTransparentFrames(signed);
  const transparentFrameFiles = shouldUseTransparentFrames
    ? await composePackTransparentFrames(completedFrameFiles).catch((error) => {
        console.warn("Pack transparent frames compose failed", error);
        return [];
      })
    : [];
  const hasTransparentFrameSet = shouldUseTransparentFrames && transparentFrameFiles.length === completedFrameFiles.length;
  const sheetSourceFiles = hasTransparentFrameSet ? transparentFrameFiles : completedFrameFiles;
  const sheet = await composePackSheetPng(signed, sheetSourceFiles).catch((error) => {
    console.warn("Pack sheet compose failed", error);
    return null;
  });
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
    zipTransparentFrames: hasTransparentFrameSet
      ? Object.fromEntries(transparentFrameFiles.map((file) => [file.frame.id, file.path]))
      : {},
  };
  const spineRigTemplate = shouldIncludeSpineExport(zipPack)
    ? await buildSpineRigTemplate(zipPack, sheetSourceFiles).catch((error) => {
        console.warn("Spine rig-template export failed", error);
        return null;
      })
    : null;
  const spineSam3Layers = shouldIncludeSpineExport(zipPack)
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
  if (shouldIncludeSpineExport(zipPack)) {
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
  return new Response(body, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, max-age=300",
      "access-control-allow-origin": "*",
      "x-lingji-pack-zip-cache": cacheHit ? "hit" : "miss",
    },
  });
}

function packZipDownloadFilename(pack, packId) {
  return `${safeLibrarySegment(pack.preset || "asset-pack")}-${safeLibrarySegment(packId).slice(0, 8)}.zip`;
}

async function packZipCacheKey(pack, completedFrameFiles) {
  const layer = pack.spineSam3Layers || null;
  const fingerprint = await shortDigest(JSON.stringify({
    version: "pack-zip-v4-sam3-monster-clamp",
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
  return base64UrlEncode(new Uint8Array(digest)).slice(0, 32);
}

function shouldPackUseTransparentFrames(pack) {
  return pack?.packKind !== "tile-pack";
}

function isUiAtlasPack(pack) {
  return pack?.packKind === "icon-pack" || pack?.packKind === "ui-pack";
}

function shouldIncludeSpineExport(pack) {
  return pack?.packKind === "sprite-actions" && Boolean(pack.zipSheet);
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
    frames,
    animations: packAnimations(pack, frames),
    tiledTileset: pack.packKind === "tile-pack" && pack.zipSheet ? "manifest/tiled-tileset.json" : null,
    uiAtlas: isUiAtlasPack(pack) && pack.zipSheet ? "manifest/ui-atlas.json" : null,
    phaserAtlas: isUiAtlasPack(pack) && pack.zipSheet ? "manifest/phaser-atlas.json" : null,
    spine: shouldIncludeSpineExport(pack)
      ? {
          mode: "attachment-swap",
          skeleton: "spine/skeleton.json",
          atlas: "spine/skeleton.atlas",
          image: "sheet.png",
          frameRate: packAnimations(pack, frames)[0]?.frameRate || 8,
        }
      : null,
    spineRigTemplate: shouldIncludeSpineExport(pack)
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
        : shouldIncludeSpineExport(pack)
        ? "spine/skeleton.json and spine/skeleton.atlas provide a Spine-compatible attachment-swap animation over sheet.png; spine/rig-template adds a first-frame editable bone template, and spine/sam3-layers appears when a completed SAM3 layer-separation job exists for this pack."
        : pack.zipSheet?.alpha
          ? "sheet.png is composed from deterministic transparent frames using the pack row/column metadata; untouched source files remain under frames/original/."
          : pack.zipSheet
            ? "sheet.png is composed from archived source frames using the pack row/column metadata."
            : "No composed sheet was generated for this ZIP.",
    ],
  };
}

function packPhaserManifest(pack) {
  const frames = packZipFrames(pack);
  return {
    packId: pack.packId,
    texturePrefix: safeLibrarySegment(pack.preset || "asset-pack"),
    frames: frames.map((frame) => ({
      key: frame.key,
      url: frame.path,
      width: frame.width,
      height: frame.height,
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
  const animation = packAnimations(pack, frames)[0] || null;
  return {
    schema: "lingji-forge.unity-sprites.v1",
    packId: pack.packId,
    preset: pack.preset,
    textureType: "Sprite",
    spriteMode: "MultipleFiles",
    pixelsPerUnit: 100,
    pivot: { x: 0.5, y: 0.5 },
    filterMode: pack.input?.style === "pixel" ? "Point" : "Bilinear",
    sprites: frames.filter((frame) => frame.path).map((frame) => ({
      name: frame.key,
      path: frame.path,
      width: frame.width,
      height: frame.height,
      seed: frame.seed,
      promptId: frame.promptId,
    })),
    animationClip: animation
      ? {
          name: animation.key,
          sampleRate: animation.frameRate,
          loopTime: animation.repeat === -1,
          frames: animation.frames.map((frame) => frame.key),
        }
      : null,
  };
}

function packGodotManifest(pack) {
  const frames = packZipFrames(pack);
  const animation = packAnimations(pack, frames)[0] || null;
  return {
    schema: "lingji-forge.godot-sprites.v1",
    packId: pack.packId,
    preset: pack.preset,
    import: {
      textureFilter: pack.input?.style === "pixel" ? "nearest" : "linear",
      loop: animation ? animation.repeat === -1 : false,
      fps: animation?.frameRate || 8,
    },
    sprites: frames.filter((frame) => frame.path).map((frame) => ({
      name: frame.key,
      path: frame.path,
      size: {
        x: frame.width,
        y: frame.height,
      },
      seed: frame.seed,
      promptId: frame.promptId,
    })),
    animatedSprite2D: animation
      ? {
          animation: animation.key,
          frames: animation.frames.map((frame) => ({
            texture: frame.path,
            duration: 1 / animation.frameRate,
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

function packSpineSkeletonJson(pack) {
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

function packSpineAtlas(pack) {
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

function packSpineReadme(pack) {
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

async function buildSpineRigTemplate(pack, frameFiles) {
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

async function buildSpineSam3LayersTemplate(env, pack, frameFiles) {
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

async function latestPackLayerSeparationJob(env, packId) {
  if (!packId) return null;
  const byPack = await latestLayerSeparationJobsByPack(env);
  return byPack.get(packId) || null;
}

function packSpineSam3LayerSummary(job) {
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

async function sourceImageForLayerJob(env, job, frameFiles) {
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

async function readLayerSeparationMasks(env, job) {
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

function averageNumbers(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((total, value) => total + value, 0) / clean.length : 0;
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

function alphaBounds(data, width, height, threshold = 24) {
  return alphaBoundsInRect(data, width, height, 0, 0, width, height, threshold);
}

function alphaBoundsInRect(data, width, height, x, y, rectWidth, rectHeight, threshold = 24) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  const xEnd = Math.min(width, x + rectWidth);
  const yEnd = Math.min(height, y + rectHeight);
  for (let py = Math.max(0, y); py < yEnd; py += 1) {
    for (let px = Math.max(0, x); px < xEnd; px += 1) {
      if (data[((py * width) + px) * 4 + 3] <= threshold) continue;
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxY, py);
    }
  }
  if (maxX < minX || maxY < minY) return null;
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function roundSpineNumber(value) {
  return Math.round(value * 100) / 100;
}

function packGridMetrics(pack, frames) {
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

function packFrameRect(frame, index, grid) {
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

function packUnityImporterScript(pack) {
  const clipName = safeLibrarySegment(pack.preset || "sprite-actions");
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
    "        var sprites = files.Select(path => AssetDatabase.LoadAssetAtPath<Sprite>(path)).Where(sprite => sprite).ToArray();",
    "        var clip = new AnimationClip { frameRate = 8 };",
    "        var binding = new EditorCurveBinding",
    "        {",
    "            type = typeof(SpriteRenderer),",
    "            path = \"\",",
    "            propertyName = \"m_Sprite\"",
    "        };",
    "        var keyframes = sprites.Select((sprite, index) => new ObjectReferenceKeyframe",
    "        {",
    "            time = index / clip.frameRate,",
    "            value = sprite",
    "        }).ToArray();",
    "        AnimationUtility.SetObjectReferenceCurve(clip, binding, keyframes);",
    "        var settings = AnimationUtility.GetAnimationClipSettings(clip);",
    "        settings.loopTime = true;",
    "        AnimationUtility.SetAnimationClipSettings(clip, settings);",
    `        var clipPath = Path.Combine(folder, "${clipName}.anim").Replace("\\\\", "/");`,
    "        AssetDatabase.CreateAsset(clip, clipPath);",
    "        AssetDatabase.SaveAssets();",
    "        Debug.Log($\"Imported {sprites.Length} Lingji sprites and created {clipPath}.\");",
    "    }",
    "}",
    "#endif",
    "",
  ].join("\n");
}

function packGodotImporterScript(pack) {
  const animationName = safeLibrarySegment(pack.preset || "sprite-actions");
  return [
    "# Lingji Forge Godot import helper.",
    "# Usage: copy this script into the extracted pack folder, open it in Godot, set PACK_ROOT if needed, then run it as an editor tool script.",
    "@tool",
    "extends EditorScript",
    "",
    "const PACK_ROOT := \"res://\"",
    `const ANIMATION_NAME := "${animationName}"`,
    "const FRAME_RATE := 8.0",
    "",
    "func _run() -> void:",
    "    var frame_dir := PACK_ROOT.path_join(\"frames/transparent\")",
    "    var dir := DirAccess.open(frame_dir)",
    "    if dir == null:",
    "        frame_dir = PACK_ROOT.path_join(\"frames/original\")",
    "        dir = DirAccess.open(frame_dir)",
    "    if dir == null:",
    "        push_error(\"No frames/transparent or frames/original folder found under %s\" % PACK_ROOT)",
    "        return",
    "    var files: Array[String] = []",
    "    dir.list_dir_begin()",
    "    var file_name := dir.get_next()",
    "    while file_name != \"\":",
    "        if !dir.current_is_dir() and file_name.get_extension().to_lower() == \"png\":",
    "            files.append(file_name)",
    "        file_name = dir.get_next()",
    "    dir.list_dir_end()",
    "    files.sort()",
    "    if files.is_empty():",
    "        push_error(\"No PNG frames found under %s\" % frame_dir)",
    "        return",
    "    var sprite_frames := SpriteFrames.new()",
    "    sprite_frames.add_animation(ANIMATION_NAME)",
    "    sprite_frames.set_animation_speed(ANIMATION_NAME, FRAME_RATE)",
    "    sprite_frames.set_animation_loop(ANIMATION_NAME, true)",
    "    for file in files:",
    "        var texture_path := frame_dir.path_join(file)",
    "        var texture := load(texture_path)",
    "        if texture:",
    "            sprite_frames.add_frame(ANIMATION_NAME, texture)",
    "    var output_path := PACK_ROOT.path_join(\"%s.tres\" % ANIMATION_NAME)",
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
  const hasSpineExport = shouldIncludeSpineExport(pack);
  const hasSam3Layers = Boolean(pack.zipSpineSam3Layers);
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
    "- scripts/unity/LingjiSpriteImporter.cs: Unity Editor helper for selected extracted pack folders.",
    "- scripts/godot/import_lingji_pack.gd: Godot EditorScript helper for SpriteFrames resources.",
    "- scripts/phaser/loadLingjiPack.js: browser helper for Phaser frame loading and animation creation.",
    "- examples/browser-preview/index.html: dependency-free browser preview for frame order and playback.",
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
    "- Sprite action packs are ordered by the original pack frame index.",
    "- Map and icon packs use the same frame list; treat each PNG as one importable asset.",
    ...(hasUiAtlas ? ["- UI and icon packs can be imported from sheet.png using manifest/ui-atlas.json, or in Phaser using this.load.atlas with manifest/phaser-atlas.json."] : []),
    ...(hasSpineExport ? ["- Spine export is an attachment-swap runtime bridge; spine/rig-template adds an editable scaffold and quality.json, but its part layers are heuristic and need precise replacement for production rigs."] : []),
    ...(hasSam3Layers ? ["- spine/sam3-layers contains AI-generated mask cutouts from the latest completed layer-separation job for this pack; inspect quality.json before using it as final rig art."] : []),
    sheetImportNote,
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function packZipFrames(pack) {
  return (pack.frames || []).map((frame, index) => {
    const result = frame.result || {};
    const dimensions = frame.dimensions || {};
    return {
      id: frame.id,
      key: safeLibrarySegment(frame.id || frame.label || `frame-${index + 1}`),
      label: frame.label || frame.id || `Frame ${index + 1}`,
      index: Number.isFinite(Number(frame.index)) ? Number(frame.index) : index,
      row: frame.row ?? null,
      column: frame.column ?? null,
      sourcePath: result.fileKey ? `frames/original/${packFrameZipName(frame, index)}` : null,
      transparentPath: pack.zipTransparentFrames?.[frame.id] || null,
      path: pack.zipTransparentFrames?.[frame.id] || (result.fileKey ? `frames/original/${packFrameZipName(frame, index)}` : null),
      filename: result.filename || null,
      promptId: frame.promptId,
      seed: frame.seed,
      status: frame.status,
      width: dimensions.width || null,
      height: dimensions.height || null,
      contentType: result.contentType || null,
    };
  });
}

function packAnimations(pack, frames) {
  if (pack.packKind !== "sprite-actions") return [];
  return [
    {
      key: safeLibrarySegment(pack.preset || "sprite-actions"),
      frameRate: 8,
      repeat: -1,
      frames: frames.filter((frame) => frame.path),
    },
  ];
}

function packFrameZipName(frame, index) {
  const order = Number.isFinite(Number(frame.index)) ? Number(frame.index) + 1 : index + 1;
  const label = frame.id || frame.label || frame.result?.filename || `frame-${order}`;
  const source = frame.result?.filename || `${safeLibrarySegment(label)}.png`;
  const extension = source.includes(".") ? source.slice(source.lastIndexOf(".")).toLowerCase() : ".png";
  return `${String(order).padStart(2, "0")}-${safeLibrarySegment(label)}${extension}`;
}

function packFrameAlphaZipName(frame, index) {
  return packFrameZipName(frame, index).replace(/(\.[^.]+)?$/, "_alpha.png");
}

function frameStatusCounts(frames) {
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

function packStatusFromCounts(counts) {
  if (counts.total > 0 && counts.complete === counts.total) return "complete";
  if (counts.failed > 0 && counts.complete + counts.failed >= counts.total) return "error";
  if (counts.complete > 0 || counts.failed > 0) return "partial";
  return "queued";
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

function packItemBrief(normalized, preset, item) {
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

async function rememberPackFrameJobRecord(env, { job, normalized, preset, packId, packReference, rerunOfPromptId = null }) {
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

async function loadPackFrameRerunTarget(packId, frameId, input, env) {
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

async function loadPackLayerSeparationTarget(packId, input, env) {
  if (!env.ASSET_BUCKET) throw httpError(503, "Storage is not configured.", "storage_not_configured");
  const pack = await readPackRecord(env, packId);
  if (!pack) throw httpError(404, "Pack not found.", "not_found");
  const refreshed = await refreshPackRecord(env, packId).catch((error) => {
    console.warn("R2 pack refresh failed", error);
    return pack;
  });
  const current = refreshed || pack;
  if (current.packKind !== "sprite-actions") {
    throw httpError(400, "Spine layer separation is only available for sprite action packs.", "pack_unavailable");
  }
  const frameId = safeString(input.frameId);
  const frame = frameId
    ? (current.frames || []).find((item) => item.id === frameId || item.promptId === frameId)
    : (current.frames || []).find((item) => item.result?.fileKey);
  if (!frame) throw httpError(404, "Pack frame not found.", "frame_not_found");
  const fileKey = frame.result?.fileKey;
  if (!fileKey) {
    throw httpError(409, "The selected frame is not archived yet.", "frame_not_ready");
  }
  const invalid = invalidLibraryFileKey(fileKey);
  if (invalid) throw httpError(400, invalid, "invalid_file");
  const object = await env.ASSET_BUCKET.get(fileKey);
  if (!object) throw httpError(404, "Archived frame image not found.", "frame_file_not_found");
  const bytes = await object.arrayBuffer();
  const blob = new Blob([bytes], { type: contentTypeForResult(frame.result) || "image/png" });
  const dimensions = await imageBlobDimensions(blob) || frame.dimensions || current.metadata || {};
  return {
    pack: current,
    frame,
    blob,
    dimensions: {
      width: Number(dimensions.width || current.metadata?.cellWidth || 512),
      height: Number(dimensions.height || current.metadata?.cellHeight || 512),
    },
  };
}

async function submitPackLayerSeparation(target, input, env) {
  const capabilities = await getCapabilities(env);
  if (!capabilities.layerSeparation.available) {
    return {
      ok: false,
      error: "layer_separation_unavailable",
      message: "SAM3 layer separation needs local SAM3 nodes and a SAM3 checkpoint on ComfyUI.",
      missing: capabilities.layerSeparation.missing,
      models: capabilities.layerSeparation.models,
      detectedNodes: capabilities.layerSeparation.detectedNodes,
    };
  }

  const filename = await uploadImageToComfy(env, target.blob, `lingji_spine_layer_${target.pack.packId}_${target.frame.id}.png`);
  const prompts = normalizeSpineLayerPrompts(input.prompts);
  const workflow = buildSam3LayerSeparationWorkflow({
    filename,
    dimensions: target.dimensions,
    modelName: capabilities.layerSeparation.models.sam3Checkpoint,
    threshold: normalizeLayerThreshold(input.threshold),
    refineIterations: normalizeLayerRefineIterations(input.refineIterations),
    prompts,
  });
  const submitted = await submitComfyWorkflow(env, workflow);
  const job = {
    ok: true,
    kind: "layer-separation",
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    packId: target.pack.packId,
    frameId: target.frame.id,
    frameLabel: target.frame.label,
    sourceImage: filename,
    layers: prompts.map(({ id, label, prompt, mode }) => ({ id, label, prompt, mode })),
    pollUrl: `/api/jobs/${submitted.prompt_id}?kind=layer-separation`,
  };
  await rememberJobRecord(env, {
    id: `layer-separation:${submitted.prompt_id}`,
    kind: "layer-separation",
    status: "queued",
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    packId: target.pack.packId,
    packPreset: target.pack.preset,
    packKind: target.pack.packKind,
    frameId: target.frame.id,
    frameLabel: target.frame.label,
    sourceImage: filename,
    sourceFileKey: target.frame.result?.fileKey || null,
    layers: job.layers,
    cost: USAGE_COSTS.generateLayerSeparation,
    workflow: "SAM3 text-prompt Spine layer separation",
    pollUrl: job.pollUrl,
  });
  return job;
}

async function rerunPackFrame(target, input, env) {
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

async function submit2DPack(input, env) {
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
  const poseControl = shouldUsePoseControl ? (await getCapabilities(env)).poseControl : null;
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
  await rememberPackRecord(env, {
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
  };
}

async function submit3DJob(input, env) {
  const capabilities = await getCapabilities(env);
  if (!capabilities.threeD.available) {
    return {
      ok: false,
      error: "3d_unavailable",
      message: "Hunyuan3D nodes are present, but the required open-source image-only checkpoint is not installed on ComfyUI yet.",
      missing: capabilities.threeD.missing,
    };
  }

  const seed = Number.isFinite(Number(input.seed)) ? Number(input.seed) : randomSeed();
  const filename = await ensureComfyInputImage(input, env);
  const workflow = buildHunyuan3DWorkflow({
    filename,
    seed,
    models: capabilities.threeD.models,
  });
  const submitted = await submitComfyWorkflow(env, workflow, 900_000);
  const job = {
    ok: true,
    kind: "3d",
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    seed,
    pollUrl: `/api/jobs/${submitted.prompt_id}?kind=3d`,
  };
  await rememberJobRecord(env, {
    id: `3d:${submitted.prompt_id}`,
    kind: "3d",
    status: "queued",
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    seed,
    input: normalizeGenerationInput(input),
    sourceImage: filename,
    cost: USAGE_COSTS.generate3d,
    workflow: "Hunyuan3D-v2 image-to-GLB",
    pollUrl: job.pollUrl,
  });
  return job;
}

async function prepareVideoSpriteExperiment(input, env) {
  const capabilities = await getCapabilities(env);
  if (!capabilities.videoToSprite.available) {
    return {
      ok: false,
      error: "video_to_sprite_unavailable",
      message: "Video-to-Sprite needs Wan image-to-video nodes, video save/load nodes, Wan I2V models, Wan VAE, and a compatible text encoder.",
      missing: capabilities.videoToSprite.missing,
      detectedNodes: capabilities.videoToSprite.detectedNodes,
      models: capabilities.videoToSprite.models,
    };
  }

  let sourceImage = null;
  try {
    sourceImage = await ensureComfyInputImage(input, env, "lingji_video_sprite_source.png");
  } catch (error) {
    return {
      ok: false,
      error: "source_image_required",
      message: "Video-to-Sprite needs a 2D source frame first. Generate or restore a character/monster image, then run video sprite generation.",
      detail: error instanceof Error ? error.message : String(error),
      detectedNodes: capabilities.videoToSprite.openSourceNodes,
      models: capabilities.videoToSprite.models,
    };
  }

  return {
    ok: true,
    kind: "video-sprite",
    status: "prepared",
    submitted: false,
    chargeable: false,
    cost: USAGE_COSTS.prepareVideoSprite,
    sourceImage,
    workflow: {
      candidate: "Wan2.2 image-to-video, solid-background motion clip, sampled into sprite frames",
      reason: "Wan I2V model files, Lightning LoRAs, Wan VAE, text encoder, and video save nodes are present. The graph has passed WEBM smoke testing; the browser extracts keyframes and exports sprite deliverables.",
      detectedNodes: capabilities.videoToSprite.openSourceNodes,
      models: capabilities.videoToSprite.models,
    },
    plan: {
      prompt: safeString(input.brief || input.prompt, "same creature, short readable game animation, solid green background"),
      preset: safeString(input.preset, "monster-actions"),
      frameTargets: ["idle", "move", "attack", "death"],
      sampling: {
        durationSeconds: 2,
        fps: 12,
        keyframes: 4,
      },
      postprocess: [
        "sample evenly spaced keyframes from generated video",
        "remove solid background with edge-connected chroma pass",
        "normalize subject bounds and center point",
        "reject frames with excessive scale drift",
        "compose transparent PNG frames and sprite sheet",
      ],
      qa: [
        "identity consistency",
        "motion amplitude",
        "background removal quality",
        "center drift",
        "sprite scale consistency",
        "loop readability",
      ],
    },
  };
}

async function submitVideoSpriteExperiment(input, env, prepared = null) {
  prepared ||= await prepareVideoSpriteExperiment(input, env);
  if (!prepared.ok) return prepared;

  const seed = Number.isFinite(Number(input.seed)) ? Number(input.seed) : randomSeed();
  const width = clampVideoDimension(input.width || 512);
  const height = clampVideoDimension(input.height || 512);
  const length = clampVideoLength(input.length || 33);
  const fps = clampVideoFps(input.fps || 12);
  const prompt = videoSpritePrompt(input);
  const workflow = buildWan22I2VWorkflow({
    sourceImage: prepared.sourceImage,
    prompt,
    negativePrompt: videoSpriteNegativePrompt(input),
    seed,
    width,
    height,
    length,
    fps,
    models: prepared.workflow.models,
  });
  const submitted = await submitComfyWorkflow(env, workflow);
  const job = {
    ok: true,
    kind: "video-sprite",
    status: "queued",
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    seed,
    dimensions: { width, height, length, fps },
    pollUrl: `/api/jobs/${submitted.prompt_id}?kind=video-sprite`,
    plan: prepared.plan,
  };
  await rememberJobRecord(env, {
    id: `video-sprite:${submitted.prompt_id}`,
    kind: "video-sprite",
    status: "queued",
    promptId: submitted.prompt_id,
    clientId: submitted.client_id,
    seed,
    dimensions: job.dimensions,
    input: normalizeGenerationInput(input),
    sourceImage: prepared.sourceImage,
    cost: USAGE_COSTS.generateVideoSprite,
    workflow: "Wan2.2 I2V Lightning WEBM smoke",
    plan: prepared.plan,
    pollUrl: job.pollUrl,
  });
  return job;
}

function buildWan22I2VWorkflow({ sourceImage, prompt, negativePrompt, seed, width, height, length, fps, models }) {
  const highModel = pickFirst(models?.wanI2v, /high/i);
  const lowModel = pickFirst(models?.wanI2v, /low/i);
  const highLora = pickFirst(models?.loras, /high/i);
  const lowLora = pickFirst(models?.loras, /low/i);
  const vae = pickFirst(models?.vae, /wan/i);
  const textEncoder = pickFirst(models?.textEncoders, /umt5/i) || pickFirst(models?.textEncoders, /qwen/i);
  return {
    "1": {
      class_type: "UNETLoader",
      inputs: { unet_name: highModel, weight_dtype: "default" },
    },
    "2": {
      class_type: "LoraLoaderModelOnly",
      inputs: { model: ["1", 0], lora_name: highLora, strength_model: 1.0 },
    },
    "3": {
      class_type: "ModelSamplingSD3",
      inputs: { model: ["2", 0], shift: 5.0 },
    },
    "4": {
      class_type: "UNETLoader",
      inputs: { unet_name: lowModel, weight_dtype: "default" },
    },
    "5": {
      class_type: "LoraLoaderModelOnly",
      inputs: { model: ["4", 0], lora_name: lowLora, strength_model: 1.0 },
    },
    "6": {
      class_type: "ModelSamplingSD3",
      inputs: { model: ["5", 0], shift: 5.0 },
    },
    "7": {
      class_type: "CLIPLoader",
      inputs: { clip_name: textEncoder, type: "wan" },
    },
    "8": {
      class_type: "CLIPTextEncode",
      inputs: { clip: ["7", 0], text: prompt },
    },
    "9": {
      class_type: "CLIPTextEncode",
      inputs: { clip: ["7", 0], text: negativePrompt },
    },
    "10": {
      class_type: "VAELoader",
      inputs: { vae_name: vae },
    },
    "11": {
      class_type: "LoadImage",
      inputs: { image: sourceImage },
    },
    "12": {
      class_type: "WanImageToVideo",
      inputs: {
        positive: ["8", 0],
        negative: ["9", 0],
        vae: ["10", 0],
        width,
        height,
        length,
        batch_size: 1,
        start_image: ["11", 0],
      },
    },
    "13": {
      class_type: "KSamplerAdvanced",
      inputs: {
        model: ["3", 0],
        add_noise: "enable",
        noise_seed: seed,
        steps: 4,
        cfg: 1,
        sampler_name: "euler",
        scheduler: "simple",
        positive: ["12", 0],
        negative: ["12", 1],
        latent_image: ["12", 2],
        start_at_step: 0,
        end_at_step: 2,
        return_with_leftover_noise: "enable",
      },
    },
    "14": {
      class_type: "KSamplerAdvanced",
      inputs: {
        model: ["6", 0],
        add_noise: "disable",
        noise_seed: seed,
        steps: 4,
        cfg: 1,
        sampler_name: "euler",
        scheduler: "simple",
        positive: ["12", 0],
        negative: ["12", 1],
        latent_image: ["13", 0],
        start_at_step: 2,
        end_at_step: 10000,
        return_with_leftover_noise: "disable",
      },
    },
    "15": {
      class_type: "VAEDecode",
      inputs: { samples: ["14", 0], vae: ["10", 0] },
    },
    "16": {
      class_type: "SaveWEBM",
      inputs: { images: ["15", 0], filename_prefix: "lingji_video_sprite", codec: "vp9", fps, crf: 32 },
    },
  };
}

async function getJob(promptId, env, url) {
  const kind = url.searchParams.get("kind") || "2d";
  const history = await comfyFetchJson(env, `/history/${encodeURIComponent(promptId)}`);
  const entry = history?.[promptId];
  if (!entry) {
    const queue = await getQueueStatus(env, new URL(`https://queue.local/?promptId=${encodeURIComponent(promptId)}`)).catch((error) => {
      console.warn("Comfy queue lookup failed", error);
      return null;
    });
    const queueState = queue?.current?.state || "unknown";
    if (queueState === "running" || queueState === "pending") {
      return { ok: true, status: "running", promptId, queue: queue.current };
    }
    if (await readJobRecord(env, promptId)) {
      await patchJobRecordQuietly(env, promptId, {
        kind,
        status: "not_in_queue",
        rawStatus: queue?.current || null,
      });
    }
    return {
      ok: true,
      status: "not_in_queue",
      promptId,
      message: "Comfy history has no result and the prompt is not present in the current queue.",
      queue: queue?.current || null,
    };
  }

  const status = entry.status?.status_str || "complete";
  const outputs = entry.outputs || {};
  const result = kind === "3d"
    ? firstModelOutput(outputs)
    : kind === "video-sprite"
      ? firstVideoOutput(outputs)
      : kind === "layer-separation"
        ? layerSeparationOutput(outputs)
        : firstImageOutput(outputs);
  if (!result) {
    const finalStatus = status === "success" ? "complete_no_result" : status;
    await patchJobRecordQuietly(env, promptId, {
      kind,
      status: finalStatus,
      rawStatus: entry.status || null,
      completedAt: new Date().toISOString(),
    });
    return {
      ok: true,
      status: finalStatus,
      promptId,
      rawStatus: entry.status || null,
    };
  }

  const archived = result.kind === "layer-separation"
    ? await archiveResultSet(env, { promptId, kind, results: result.files, entry }).catch((error) => {
        console.warn("R2 archive failed", error);
        return null;
      })
    : await archiveResult(env, { promptId, kind, result, entry }).catch((error) => {
        console.warn("R2 archive failed", error);
        return null;
      });
  const resultPayload = result.kind === "layer-separation"
    ? {
        ...result,
        url: archived?.url || buildComfyViewUrl(result.files[0]),
        files: await signedLayerResultFiles(env, result.files, archived),
        library: archived,
      }
    : {
        ...result,
        url: archived?.url || buildComfyViewUrl(result),
        comfyUrl: buildComfyViewUrl(result),
        library: archived,
      };
  await patchJobRecordQuietly(env, promptId, {
    kind,
    status: "complete",
    rawStatus: entry.status || null,
    completedAt: new Date().toISOString(),
    result: result.kind === "layer-separation"
      ? summarizeLayerSeparationResult(resultPayload, archived)
      : summarizeJobResult(result, archived),
  });

  return {
    ok: true,
    status: "complete",
    promptId,
    result: resultPayload,
  };
}

function summarizeJobResult(result, archived) {
  return {
    filename: result.filename,
    subfolder: result.subfolder || "",
    type: result.type || "output",
    comfyUrl: buildComfyViewUrl(result),
    contentType: archived?.contentType || contentTypeForResult(result),
    bytes: archived?.bytes || null,
    fileKey: archived?.fileKey || null,
    libraryId: archived?.id || null,
  };
}

async function signedLayerResultFiles(env, files, archived) {
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

function summarizeLayerSeparationResult(result, archived) {
  const files = (result.files || []).map((file) => ({
    layerId: file.layerId,
    label: file.label,
    filename: file.filename,
    subfolder: file.subfolder || "",
    type: file.type || "output",
    comfyUrl: buildComfyViewUrl(file),
    contentType: file.contentType || contentTypeForResult(file),
    bytes: file.bytes || null,
    fileKey: file.fileKey || null,
    libraryId: file.libraryId || archived?.id || null,
  }));
  return {
    kind: "layer-separation",
    filename: files[0]?.filename || null,
    fileKey: files[0]?.fileKey || null,
    contentType: files[0]?.contentType || "image/png",
    bytes: files[0]?.bytes || null,
    libraryId: archived?.id || null,
    files,
  };
}

async function archiveResultSet(env, { promptId, kind, results, entry }) {
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

async function archiveResult(env, { promptId, kind, result, entry }) {
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

async function listLibrary(env, url) {
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

async function getVideoSpriteDemo(env) {
  if (!env.ASSET_BUCKET) {
    return {
      ok: true,
      available: false,
      configured: false,
      demo: VIDEO_SPRITE_DEMO,
      demos: VIDEO_SPRITE_DEMOS,
    };
  }

  const demos = [];
  for (const demo of VIDEO_SPRITE_DEMOS) {
    const object = await env.ASSET_BUCKET.head(demo.fileKey);
    if (!object) continue;
    demos.push({
      ...demo,
      url: await buildSignedLibraryViewUrl(env, demo.fileKey, 86_400),
      contentType: object.httpMetadata?.contentType || "video/webm",
      size: object.size || null,
      uploaded: object.uploaded || null,
      generatorPath: `/generator/?demo=video-sprite&sample=${encodeURIComponent(demo.id)}`,
    });
  }

  if (demos.length === 0) {
    return {
      ok: true,
      available: false,
      configured: true,
      demo: VIDEO_SPRITE_DEMO,
      demos: [],
    };
  }

  const defaultDemo = demos.find((demo) => demo.id === VIDEO_SPRITE_DEMO.id) || demos[0];
  return {
    ok: true,
    available: true,
    configured: true,
    demo: defaultDemo,
    demos,
  };
}

async function proxyLibraryView(request, env, url, method = "GET") {
  if (!env.ASSET_BUCKET) return jsonResponse({ error: "storage_not_configured" }, 503);
  const key = safeString(url.searchParams.get("key"));
  const invalid = invalidLibraryFileKey(key);
  if (invalid) return jsonResponse({ error: "invalid_file", message: invalid }, 400);
  const accessFailure = await authorizeLibraryView(request, env, url, key);
  if (accessFailure) return accessFailure;

  const object = await env.ASSET_BUCKET.get(key);
  if (!object) return jsonResponse({ error: "not_found" }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", headers.get("cache-control") || "public, max-age=3600");
  headers.set("access-control-allow-origin", "*");
  return new Response(method === "HEAD" ? null : object.body, { headers });
}

async function authorizeLibraryView(request, env, url, key) {
  if (!authorizeApiRequest(request, env)) return null;
  const secret = libraryViewSecret(env);
  if (!secret) return null;

  const exp = Number(url.searchParams.get("exp") || 0);
  const sig = safeString(url.searchParams.get("sig"));
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(exp) || exp < now || !sig) {
    return jsonResponse({ error: "signed_url_required", message: "This library file URL has expired or is unsigned." }, 401);
  }

  const expected = await signLibraryViewKey(secret, key, exp);
  if (!constantTimeEqual(sig, expected)) {
    return jsonResponse({ error: "invalid_signature", message: "Invalid library file signature." }, 401);
  }
  return null;
}

async function fetchComfyResponse(env, meta) {
  const view = new URL(`${comfyBase(env)}/view`);
  view.searchParams.set("filename", meta.filename);
  view.searchParams.set("type", meta.type || "output");
  view.searchParams.set("subfolder", meta.subfolder || "");
  return await fetch(view.toString(), {
    headers: comfyHeaders(env),
  });
}

async function proxyComfyView(env, url, method = "GET") {
  const filename = url.searchParams.get("filename");
  if (!filename) return jsonResponse({ error: "missing_filename" }, 400);
  const meta = {
    filename,
    subfolder: url.searchParams.get("subfolder") || "",
    type: url.searchParams.get("type") || "output",
  };
  const invalid = invalidComfyImageMeta(meta);
  if (invalid) return jsonResponse({ error: "invalid_file", message: invalid }, 400);
  const view = new URL(`${comfyBase(env)}/view`);
  view.searchParams.set("filename", meta.filename);
  view.searchParams.set("type", meta.type);
  view.searchParams.set("subfolder", meta.subfolder);
  const response = await fetch(view.toString(), {
    headers: comfyHeaders(env),
  });
  if (!response.ok) {
    return jsonResponse({ error: "comfy_view_failed", status: response.status }, response.status);
  }
  const headers = new Headers(response.headers);
  headers.set("cache-control", "private, max-age=3600");
  headers.set("access-control-allow-origin", "*");
  return new Response(method === "HEAD" ? null : response.body, { status: response.status, headers });
}

function buildFlux1Workflow({ prompt, negativePrompt, width, height, seed }) {
  return {
    "10": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: "flux1-dev-fp8.safetensors" },
    },
    "2": {
      class_type: "CLIPTextEncode",
      inputs: { text: prompt, clip: ["10", 1] },
    },
    "3": {
      class_type: "CLIPTextEncode",
      inputs: { text: negativePrompt || DEFAULT_NEGATIVE, clip: ["10", 1] },
    },
    "20": {
      class_type: "FluxGuidance",
      inputs: { guidance: 3.5, conditioning: ["2", 0] },
    },
    "21": {
      class_type: "EmptyLatentImage",
      inputs: { width, height, batch_size: 1 },
    },
    "22": {
      class_type: "KSampler",
      inputs: {
        seed,
        steps: 22,
        cfg: 1.0,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: 1.0,
        model: ["10", 0],
        positive: ["20", 0],
        negative: ["3", 0],
        latent_image: ["21", 0],
      },
    },
    "23": {
      class_type: "VAEDecode",
      inputs: { samples: ["22", 0], vae: ["10", 2] },
    },
    "8": {
      class_type: "SaveImage",
      inputs: { filename_prefix: "lingji_2d_asset", images: ["23", 0] },
    },
  };
}

function buildFlux1Img2ImgWorkflow({ prompt, negativePrompt, width, height, seed, filename, denoise }) {
  return {
    "10": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: "flux1-dev-fp8.safetensors" },
    },
    "2": {
      class_type: "CLIPTextEncode",
      inputs: { text: prompt, clip: ["10", 1] },
    },
    "3": {
      class_type: "CLIPTextEncode",
      inputs: { text: negativePrompt || DEFAULT_NEGATIVE, clip: ["10", 1] },
    },
    "20": {
      class_type: "FluxGuidance",
      inputs: { guidance: 3.5, conditioning: ["2", 0] },
    },
    "30": {
      class_type: "LoadImage",
      inputs: { image: filename },
    },
    "31": {
      class_type: "ImageScale",
      inputs: { image: ["30", 0], upscale_method: "lanczos", width, height, crop: "center" },
    },
    "32": {
      class_type: "VAEEncode",
      inputs: { pixels: ["31", 0], vae: ["10", 2] },
    },
    "22": {
      class_type: "KSampler",
      inputs: {
        seed,
        steps: 22,
        cfg: 1.0,
        sampler_name: "euler",
        scheduler: "simple",
        denoise,
        model: ["10", 0],
        positive: ["20", 0],
        negative: ["3", 0],
        latent_image: ["32", 0],
      },
    },
    "23": {
      class_type: "VAEDecode",
      inputs: { samples: ["22", 0], vae: ["10", 2] },
    },
    "8": {
      class_type: "SaveImage",
      inputs: { filename_prefix: "lingji_2d_asset", images: ["23", 0] },
    },
  };
}

function buildFlux1PoseImg2ImgWorkflow({
  prompt,
  negativePrompt,
  width,
  height,
  seed,
  filename,
  poseFilename,
  controlNetName,
  denoise,
  controlStrength,
}) {
  return {
    "10": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: "flux1-dev-fp8.safetensors" },
    },
    "2": {
      class_type: "CLIPTextEncode",
      inputs: { text: prompt, clip: ["10", 1] },
    },
    "3": {
      class_type: "CLIPTextEncode",
      inputs: { text: negativePrompt || DEFAULT_NEGATIVE, clip: ["10", 1] },
    },
    "20": {
      class_type: "FluxGuidance",
      inputs: { guidance: 3.5, conditioning: ["2", 0] },
    },
    "30": {
      class_type: "LoadImage",
      inputs: { image: filename },
    },
    "31": {
      class_type: "ImageScale",
      inputs: { image: ["30", 0], upscale_method: "lanczos", width, height, crop: "center" },
    },
    "32": {
      class_type: "VAEEncode",
      inputs: { pixels: ["31", 0], vae: ["10", 2] },
    },
    "40": {
      class_type: "ControlNetLoader",
      inputs: { control_net_name: controlNetName },
    },
    "41": {
      class_type: "SetUnionControlNetType",
      inputs: { control_net: ["40", 0], type: "openpose" },
    },
    "42": {
      class_type: "LoadImage",
      inputs: { image: poseFilename },
    },
    "43": {
      class_type: "ImageScale",
      inputs: { image: ["42", 0], upscale_method: "nearest-exact", width, height, crop: "center" },
    },
    "44": {
      class_type: "ControlNetApplyAdvanced",
      inputs: {
        positive: ["20", 0],
        negative: ["3", 0],
        control_net: ["41", 0],
        image: ["43", 0],
        strength: controlStrength,
        start_percent: 0.0,
        end_percent: 0.62,
        vae: ["10", 2],
      },
    },
    "22": {
      class_type: "KSampler",
      inputs: {
        seed,
        steps: 24,
        cfg: 1.0,
        sampler_name: "euler",
        scheduler: "simple",
        denoise,
        model: ["10", 0],
        positive: ["44", 0],
        negative: ["44", 1],
        latent_image: ["32", 0],
      },
    },
    "23": {
      class_type: "VAEDecode",
      inputs: { samples: ["22", 0], vae: ["10", 2] },
    },
    "8": {
      class_type: "SaveImage",
      inputs: { filename_prefix: "lingji_2d_asset", images: ["23", 0] },
    },
  };
}

function buildSam3LayerSeparationWorkflow({
  filename,
  dimensions,
  modelName,
  threshold,
  refineIterations,
  prompts,
}) {
  const width = Math.max(64, Math.round(Number(dimensions?.width) || 512));
  const height = Math.max(64, Math.round(Number(dimensions?.height) || 512));
  const workflow = {
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: modelName },
    },
    "2": {
      class_type: "LoadImage",
      inputs: { image: filename },
    },
    "3": {
      class_type: "PrimitiveBoundingBox",
      inputs: { x: 0, y: 0, width, height },
    },
  };

  prompts.forEach((layer, index) => {
    const base = 10 + index * 10;
    const detectId = String(base);
    const maskImageId = String(base + 1);
    const saveId = String(base + 2);
    if (layer.mode === "bbox") {
      workflow[detectId] = {
        class_type: "SAM3_Detect",
        inputs: {
          model: ["1", 0],
          image: ["2", 0],
          bboxes: ["3", 0],
          threshold,
          refine_iterations: refineIterations,
          individual_masks: false,
        },
      };
    } else {
      const textId = String(base + 3);
      workflow[textId] = {
        class_type: "CLIPTextEncode",
        inputs: { text: layer.prompt, clip: ["1", 1] },
      };
      workflow[detectId] = {
        class_type: "SAM3_Detect",
        inputs: {
          model: ["1", 0],
          image: ["2", 0],
          conditioning: [textId, 0],
          threshold,
          refine_iterations: refineIterations,
          individual_masks: false,
        },
      };
    }
    workflow[maskImageId] = {
      class_type: "MaskToImage",
      inputs: { mask: [detectId, 0] },
    };
    workflow[saveId] = {
      class_type: "SaveImage",
      inputs: {
        filename_prefix: `lingji_spine_layer_${safeLibrarySegment(layer.id)}`,
        images: [maskImageId, 0],
      },
    };
  });

  return workflow;
}

function normalizeSpineLayerPrompts(value) {
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

function normalizeLayerThreshold(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.45;
  return Math.max(0.05, Math.min(0.95, number));
}

function normalizeLayerRefineIterations(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 2;
  return Math.max(0, Math.min(5, Math.round(number)));
}

function buildHunyuan3DWorkflow({ filename, seed, models }) {
  return {
    "1": {
      class_type: "ImageOnlyCheckpointLoader",
      inputs: { ckpt_name: models.checkpoint },
    },
    "4": {
      class_type: "LoadImage",
      inputs: { image: filename },
    },
    "5": {
      class_type: "ImageScaleToTotalPixels",
      inputs: { image: ["4", 0], upscale_method: "lanczos", megapixels: 1.0, resolution_steps: 1 },
    },
    "6": {
      class_type: "CLIPVisionEncode",
      inputs: { clip_vision: ["1", 1], image: ["5", 0], crop: "center" },
    },
    "7": {
      class_type: "Hunyuan3Dv2Conditioning",
      inputs: { clip_vision_output: ["6", 0] },
    },
    "8": {
      class_type: "EmptyLatentHunyuan3Dv2",
      inputs: { resolution: 3072, batch_size: 1 },
    },
    "9": {
      class_type: "KSampler",
      inputs: {
        model: ["1", 0],
        seed,
        steps: 50,
        cfg: 5.0,
        sampler_name: "euler",
        scheduler: "simple",
        positive: ["7", 0],
        negative: ["7", 1],
        latent_image: ["8", 0],
        denoise: 1.0,
      },
    },
    "10": {
      class_type: "VAEDecodeHunyuan3D",
      inputs: { samples: ["9", 0], vae: ["1", 2], num_chunks: 8000, octree_resolution: 256 },
    },
    "11": {
      class_type: "VoxelToMesh",
      inputs: { voxel: ["10", 0], algorithm: "surface net", threshold: 0.6 },
    },
    "12": {
      class_type: "SaveGLB",
      inputs: { mesh: ["11", 0], filename_prefix: "lingji_3d_asset" },
    },
  };
}

async function submitComfyWorkflow(env, workflow) {
  const clientId = crypto.randomUUID();
  const response = await fetch(`${comfyBase(env)}/prompt`, {
    method: "POST",
    headers: comfyHeaders(env, { "content-type": "application/json" }),
    body: JSON.stringify({ prompt: workflow, client_id: clientId }),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!response.ok) {
    throw new Error(`Comfy POST /prompt failed: ${response.status} ${text.slice(0, 800)}`);
  }
  if (!json?.prompt_id) {
    throw new Error(`Comfy POST /prompt returned no prompt_id: ${text.slice(0, 800)}`);
  }
  if (json.node_errors && Object.keys(json.node_errors).length > 0) {
    throw new Error(`Comfy workflow validation failed: ${JSON.stringify(json.node_errors).slice(0, 1000)}`);
  }
  return { ...json, client_id: clientId };
}

async function ensureComfyInputImage(input, env, fallbackName = "lingji_3d_source.png") {
  const blob = await sourceImageBlob(input, env);
  return await uploadImageToComfy(env, blob, fallbackName);
}

async function ensureSpriteReferenceImage(input, env, fallbackName = "lingji_pack_reference.png") {
  const blob = await sourceImageBlob(input, env);
  await validateSingleFrameReferenceImage(blob);
  return await uploadImageToComfy(env, blob, fallbackName);
}

async function sourceImageBlob(input, env) {
  if (input.comfyImage?.filename) {
    validateComfyImageMeta(input.comfyImage);
    return await fetchComfyFile(env, input.comfyImage);
  }
  if (input.imageUrl) {
    const response = await fetch(input.imageUrl);
    if (!response.ok) throw new Error(`Could not fetch source image: ${response.status}`);
    return await response.blob();
  }
  if (input.imageDataUrl) {
    validateImageDataUrl(input.imageDataUrl);
    return dataUrlToBlob(input.imageDataUrl);
  }
  throw new Error("Generation needs a source image first.");
}

async function validateSingleFrameReferenceImage(blob) {
  const dimensions = await imageBlobDimensions(blob);
  if (!dimensions) return;
  const ratio = dimensions.width / dimensions.height;
  if (ratio < 0.62 || ratio > 1.62) {
    throw httpError(
      400,
      `动作包参考图需要是单帧角色/怪物素材，当前图片尺寸 ${dimensions.width}x${dimensions.height} 像是 sheet 或宽幅图。请先生成一张单帧 2D 定稿，再生成动作包。`,
      "invalid_reference_image",
    );
  }
}

async function imageBlobDimensions(blob) {
  const bytes = new Uint8Array(await blob.slice(0, 32).arrayBuffer());
  if (bytes.length >= 24 && isPngSignature(bytes)) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return {
      width: view.getUint32(16, false),
      height: view.getUint32(20, false),
      type: "image/png",
    };
  }
  return null;
}

async function fetchComfyFile(env, meta) {
  const view = new URL(`${comfyBase(env)}/view`);
  view.searchParams.set("filename", meta.filename);
  view.searchParams.set("subfolder", meta.subfolder || "");
  view.searchParams.set("type", meta.type || "output");
  const response = await fetch(view.toString(), { headers: comfyHeaders(env) });
  if (!response.ok) throw new Error(`Could not fetch Comfy source image: ${response.status}`);
  return await response.blob();
}

async function uploadImageToComfy(env, blob, fallbackName) {
  const ext = mimeToExtension(blob.type) || "png";
  const filename = `${fallbackName.replace(/\.[^.]+$/, "")}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const form = new FormData();
  form.append("image", blob, filename);
  form.append("type", "input");
  form.append("overwrite", "true");
  const response = await fetch(`${comfyBase(env)}/upload/image`, {
    method: "POST",
    headers: comfyHeaders(env),
    body: form,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Comfy upload failed: ${response.status} ${text.slice(0, 500)}`);
  const json = text ? JSON.parse(text) : {};
  if (!json.name) throw new Error(`Comfy upload returned no name: ${text.slice(0, 500)}`);
  return json.name;
}

async function listComfyModels(env) {
  const endpoints = {
    checkpoints: "/models/checkpoints",
    controlnet: "/models/controlnet",
    diffusion: "/models/diffusion_models",
    clipVision: "/models/clip_vision",
    vae: "/models/vae",
    textEncoders: "/models/text_encoders",
    loras: "/models/loras",
  };
  const entries = await Promise.all(
    Object.entries(endpoints).map(async ([key, endpoint]) => {
      try {
        const value = await comfyFetchJson(env, endpoint);
        return [key, Array.isArray(value) ? value : []];
      } catch {
        return [key, []];
      }
    }),
  );
  return Object.fromEntries(entries);
}

function selectPoseControl(objectInfo, modelLists, env = {}) {
  const hasNode = (name) => Boolean(objectInfo && objectInfo[name]);
  const controlnetModels = Array.isArray(modelLists.controlnet) ? modelLists.controlnet : [];
  const configured = env.POSE_CONTROLNET_MODEL || null;
  const model = configured || controlnetModels.find((name) => /openpose|dwpose|pose|union|controlnet.*flux|flux.*controlnet/i.test(name)) || null;
  const requiredNodes = [
    "ControlNetLoader",
    "ControlNetApplyAdvanced",
    "LoadImage",
    "ImageScale",
    "VAEEncode",
  ];
  const missing = [];
  for (const node of requiredNodes) {
    if (!hasNode(node)) missing.push(`missing node: ${node}`);
  }
  if (!model) missing.push("missing ControlNet/OpenPose model");
  return {
    available: missing.length === 0,
    workflow: "reference img2img + pose ControlNet",
    model,
    modelSource: configured ? "env" : model ? "auto" : null,
    nodes: requiredNodes.reduce((acc, node) => {
      acc[node] = hasNode(node);
      return acc;
    }, {}),
    missing,
  };
}

function selectHunyuanModel(objectInfo, env = {}) {
  const fromCombo = (nodeName, inputName) => {
    const value = objectInfo?.[nodeName]?.input?.required?.[inputName]?.[0];
    return Array.isArray(value) ? value : [];
  };
  const values = fromCombo("ImageOnlyCheckpointLoader", "ckpt_name");
  const checkpoint = env.HUNYUAN3D_CHECKPOINT
    || values.find((name) => /hunyuan.*3d|3d.*hunyuan|hy3d/i.test(name))
    || null;
  return {
    checkpoint,
  };
}

async function comfyFetchJson(env, path) {
  const response = await fetch(`${comfyBase(env)}${path}`, {
    headers: comfyHeaders(env),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Comfy ${path} failed: ${response.status} ${text.slice(0, 500)}`);
  }
  return await response.json();
}

function comfyBase(env) {
  const base = env.COMFY_UPSTREAM_BASE || env.COMFY_REST_PROXY_URL;
  if (!base) throw new Error("COMFY_UPSTREAM_BASE is not configured");
  return base.replace(/\/+$/, "");
}

function mistralBase(env) {
  return (env.MISTRAL_BASE_URL || "https://api.mistral.ai/v1").replace(/\/+$/, "");
}

function comfyHeaders(env, extra = {}) {
  const headers = new Headers(extra);
  if (env.COMFY_API_TOKEN) headers.set("authorization", `Bearer ${env.COMFY_API_TOKEN}`);
  return headers;
}

function authorizeApiRequest(request, env) {
  const expected = safeString(env.GENERATOR_ACCESS_TOKEN);
  if (!expected) return null;
  const provided = apiAccessToken(request);
  if (provided && provided === expected) return null;
  return jsonResponse(
    {
      error: "auth_required",
      message: "This generator requires an access token.",
      auth: { required: true },
    },
    401,
  );
}

function apiAccessToken(request) {
  const explicit = safeString(request.headers.get("x-lingji-access-token"));
  if (explicit) return explicit;
  const authorization = safeString(request.headers.get("authorization"));
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

async function enforceUsageLimit(request, env, action, cost) {
  const usage = await requestUsage(request, env, action, cost);
  if (usage.allowed) return null;
  return jsonResponse(
    {
      error: "rate_limited",
      message: usageLimitMessage(usage),
      usage,
    },
    429,
    usageHeaders(usage),
  );
}

async function meteredJsonResponse(request, env, action, cost, operation) {
  const limited = await enforceUsageLimit(request, env, action, cost);
  if (limited) return limited;

  try {
    const result = await operation();
    if (result?.ok === false) {
      await refundUsageCost(request, env, action, cost);
    }
    return jsonResponse(result);
  } catch (error) {
    await refundUsageCost(request, env, action, cost);
    throw error;
  }
}

async function refundUsageCost(request, env, action, cost) {
  if (!cost || cost <= 0) return null;
  try {
    return await requestUsage(request, env, `${action}:refund`, cost, { refund: true });
  } catch (error) {
    console.warn("Usage refund failed", error);
    return null;
  }
}

async function usageStatus(request, env) {
  return await requestUsage(request, env, "status", 0);
}

async function getQueueStatus(env, url) {
  const promptId = safeString(url.searchParams.get("promptId"));
  const data = await comfyFetchJson(env, "/queue");
  const running = normalizeQueueItems(data.queue_running);
  const pending = normalizeQueueItems(data.queue_pending);
  const all = [...running, ...pending];
  const match = promptId ? all.find((item) => item.promptId === promptId) : null;
  return {
    ok: true,
    running: running.length,
    pending: pending.length,
    total: running.length + pending.length,
    promptId: promptId || null,
    current: match
      ? {
          state: running.some((item) => item.promptId === promptId) ? "running" : "pending",
          index: match.index,
          promptId: match.promptId,
        }
      : promptId
        ? { state: "not_in_queue", index: null, promptId }
        : null,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeQueueItems(items) {
  return Array.isArray(items)
    ? items.map((item, index) => ({
        index,
        promptId: queuePromptId(item),
      })).filter((item) => item.promptId)
    : [];
}

function queuePromptId(item) {
  if (Array.isArray(item)) {
    return safeString(item[1] || item[0]?.prompt_id || item[0]?.promptId);
  }
  return safeString(item?.prompt_id || item?.promptId || item?.id);
}

async function requestUsage(request, env, action, cost, options = {}) {
  if (!env.USAGE_LIMITER) {
    return {
      allowed: true,
      configured: false,
      action,
      cost,
      hourly: { used: 0, limit: 0, remaining: 0, resetAt: null },
      daily: { used: 0, limit: 0, remaining: 0, resetAt: null },
    };
  }

  const scope = await usageScope(request);
  const id = env.USAGE_LIMITER.idFromName(scope);
  const stub = env.USAGE_LIMITER.get(id);
  const response = await stub.fetch("https://usage.lingji/check", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action,
      cost,
      refund: options.refund === true,
      hourlyLimit: positiveNumber(env.USAGE_HOURLY_CREDITS, DEFAULT_USAGE_HOURLY_CREDITS),
      dailyLimit: positiveNumber(env.USAGE_DAILY_CREDITS, DEFAULT_USAGE_DAILY_CREDITS),
    }),
  });
  return await response.json();
}

async function usageScope(request) {
  const token = apiAccessToken(request);
  const source = token || request.headers.get("cf-connecting-ip") || "anonymous";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return base64UrlEncode(new Uint8Array(digest)).slice(0, 32);
}

function usageCostForPackInput(input) {
  const preset = PACK_PRESETS[safeString(input?.preset)];
  const frames = Math.max(1, preset?.items?.length || 4);
  return frames * USAGE_COSTS.generate2dPackFrame;
}

function usageLimitMessage(usage) {
  const retry = usage.retryAfterSeconds
    ? `约 ${Math.ceil(usage.retryAfterSeconds / 60)} 分钟后重试`
    : "稍后重试";
  return `生成额度已达到当前限制，${retry}。`;
}

function usageHeaders(usage) {
  const headers = {
    "x-ratelimit-limit": String(usage.hourly?.limit || 0),
    "x-ratelimit-remaining": String(usage.hourly?.remaining || 0),
  };
  if (usage.hourly?.resetAt) headers["x-ratelimit-reset"] = usage.hourly.resetAt;
  if (usage.retryAfterSeconds) headers["retry-after"] = String(usage.retryAfterSeconds);
  return headers;
}

function usagePayload({ allowed, action, cost, hour, day, hourlyLimit, dailyLimit, retryAt }) {
  const now = Date.now();
  return {
    allowed,
    configured: true,
    action,
    cost,
    retryAfterSeconds: retryAt ? Math.max(1, Math.ceil((retryAt - now) / 1000)) : null,
    hourly: {
      used: hour.used,
      limit: hourlyLimit,
      remaining: Math.max(0, hourlyLimit - hour.used),
      resetAt: new Date(hour.start + 3_600_000).toISOString(),
    },
    daily: {
      used: day.used,
      limit: dailyLimit,
      remaining: Math.max(0, dailyLimit - day.used),
      resetAt: new Date(day.start + 86_400_000).toISOString(),
    },
  };
}

function usageJson(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function positiveNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function normalizeGenerationInput(input = {}) {
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

function localPromptPlan(input) {
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
      asset,
      style,
      preset,
      camera,
      `subject: ${input.brief}`,
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

function sanitizePromptPlan(parsed, fallback, input = {}) {
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

function normalizeDimensions(width, height, preset) {
  const defaults = {
    square: [768, 768],
    portrait: [768, 1024],
    sprite: [512, 512],
    icon: [512, 512],
    "character-actions": [1024, 512],
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

function clampDimension(value) {
  const n = Math.max(256, Math.min(1024, Number(value) || 768));
  return Math.round(n / 64) * 64;
}

function clampVideoDimension(value) {
  const n = Math.max(256, Math.min(768, Number(value) || 512));
  return Math.round(n / 64) * 64;
}

function clampVideoLength(value) {
  const n = Math.max(9, Math.min(49, Number(value) || 33));
  return Math.round((n - 1) / 4) * 4 + 1;
}

function clampVideoFps(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(6, Math.min(16, Math.round(n))) : 12;
}

function pickFirst(values = [], pattern = /./) {
  return (Array.isArray(values) ? values : []).find((value) => pattern.test(value)) || firstArrayItem(values) || "";
}

function videoSpritePrompt(input = {}) {
  return [
    safeString(input.brief || input.prompt, "same creature performing a short readable game animation"),
    "short game sprite animation, same subject identity, readable motion, centered full body, orthographic game sprite, flat chroma green background, no shadow, no floor, no gradient, no scenery, no camera movement, no text, no watermark",
  ].join(", ").slice(0, 1200);
}

function videoSpriteNegativePrompt(input = {}) {
  return safeString(
    input.negativePrompt,
    "text, watermark, subtitles, multiple characters, scene cut, camera shake, zoom, crop, blurry, low quality, extra limbs, morphing identity, busy background, transparent background, floor, ground shadow, cast shadow, gradient background, scenery",
  ).slice(0, 900);
}

function normalizeDenoise(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.62;
  return Math.max(0.25, Math.min(0.9, n));
}

function normalizeActionStrength(value) {
  return ["stable", "balanced", "expressive"].includes(value) ? value : "balanced";
}

function denoiseForPackItem(input, normalized, item) {
  if (input.referenceDenoise !== undefined && input.referenceDenoise !== null) {
    return normalizeDenoise(input.referenceDenoise);
  }
  const value = item.referenceDenoise?.[normalized.actionStrength] ?? item.referenceDenoise?.balanced;
  return normalizeDenoise(value);
}

function poseDenoiseForPackItem(input, normalized, item) {
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

function poseStrengthForPackItem(item) {
  const values = {
    idle: 0.55,
    walk: 0.82,
    attack: 0.95,
    hurt: 0.86,
  };
  return values[item.id] || 0.78;
}

function firstImageOutput(outputs) {
  for (const nodeOutput of Object.values(outputs || {})) {
    const image = firstArrayItem(nodeOutput?.images);
    if (image?.filename) {
      return {
        kind: "image",
        filename: image.filename,
        subfolder: image.subfolder || "",
        type: image.type || "output",
      };
    }
  }
  return null;
}

function layerSeparationOutput(outputs) {
  const files = [];
  for (const [nodeId, nodeOutput] of Object.entries(outputs || {})) {
    for (const image of nodeOutput?.images || []) {
      if (!image?.filename) continue;
      const layerId = layerIdFromFilename(image.filename);
      files.push({
        kind: "image",
        nodeId,
        layerId,
        label: spineLayerLabel(layerId),
        filename: image.filename,
        subfolder: image.subfolder || "",
        type: image.type || "output",
      });
    }
  }
  if (files.length === 0) return null;
  const order = new Map(SPINE_LAYER_PROMPTS.map((item, index) => [item.id, index]));
  files.sort((a, b) => (order.get(a.layerId) ?? 999) - (order.get(b.layerId) ?? 999));
  return {
    kind: "layer-separation",
    files,
  };
}

function layerIdFromFilename(filename) {
  const name = safeString(filename).toLowerCase();
  const match = name.match(/lingji_spine_layer_([a-z0-9_-]+?)(?:_\d+_)?\.(?:png|webp|jpg|jpeg)$/i);
  return match ? match[1] : safeLibrarySegment(name.replace(/\.[^.]+$/, ""));
}

function spineLayerLabel(layerId) {
  return SPINE_LAYER_PROMPTS.find((item) => item.id === layerId)?.label || layerId;
}

function firstModelOutput(outputs) {
  for (const nodeOutput of Object.values(outputs || {})) {
    for (const key of ["gltf", "glb", "models", "files", "3d", "model"]) {
      const candidate = firstArrayItem(nodeOutput?.[key]);
      const normalized = normalizeFileCandidate(candidate);
      if (normalized) return { kind: "model", ...normalized };
    }
    const normalized = normalizeFileCandidate(nodeOutput);
    if (normalized) return { kind: "model", ...normalized };
  }
  return null;
}

function firstVideoOutput(outputs) {
  for (const nodeOutput of Object.values(outputs || {})) {
    const imageLikeVideo = firstArrayItem(nodeOutput?.images);
    if (imageLikeVideo?.filename && (nodeOutput?.animated?.[0] || /\.(mp4|webm|mov|gif)$/i.test(imageLikeVideo.filename))) {
      return {
        kind: "video",
        filename: imageLikeVideo.filename,
        subfolder: imageLikeVideo.subfolder || "",
        type: imageLikeVideo.type || "output",
      };
    }
    for (const key of ["videos", "video", "files", "gifs", "animated"]) {
      const candidate = firstArrayItem(nodeOutput?.[key]);
      const normalized = normalizeFileCandidate(candidate);
      if (normalized) return { kind: "video", ...normalized };
    }
    const normalized = normalizeFileCandidate(nodeOutput);
    if (normalized && /\.(mp4|webm|mov|gif)$/i.test(normalized.filename)) {
      return { kind: "video", ...normalized };
    }
  }
  return null;
}

function normalizeFileCandidate(candidate) {
  if (!candidate) return null;
  if (typeof candidate === "string") {
    return { filename: candidate, subfolder: "", type: "output" };
  }
  if (typeof candidate === "object" && typeof candidate.filename === "string") {
    return {
      filename: candidate.filename,
      subfolder: typeof candidate.subfolder === "string" ? candidate.subfolder : "",
      type: typeof candidate.type === "string" ? candidate.type : "output",
    };
  }
  return null;
}

function firstArrayItem(value) {
  return Array.isArray(value) && value.length > 0 ? value[0] : null;
}

function buildComfyViewUrl(meta) {
  const params = new URLSearchParams();
  params.set("filename", meta.filename);
  params.set("subfolder", meta.subfolder || "");
  params.set("type", meta.type || "output");
  return `/api/comfy/view?${params.toString()}`;
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

async function withSignedPackRecord(env, pack, options = {}) {
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

async function buildSignedLibraryViewUrl(env, key, ttlSeconds = 86_400) {
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

function libraryViewSecret(env) {
  return safeString(env.LIBRARY_VIEW_SECRET || env.GENERATOR_ACCESS_TOKEN);
}

async function signLibraryViewKey(secret, key, exp) {
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

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
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

function safeLibrarySegment(value) {
  return safeString(value, "asset")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "asset";
}

async function composePackTransparentFrames(frameFiles) {
  const outputs = [];
  for (const frameFile of frameFiles) {
    const image = await decodePngRgba(frameFile.bytes);
    removeEdgeConnectedBackgroundRgba(image.data, image.width, image.height);
    const bytes = await encodePngRgba(image.width, image.height, image.data);
    outputs.push({
      ...frameFile,
      path: `frames/transparent/${packFrameAlphaZipName(frameFile.frame, frameFile.index)}`,
      bytes,
      image,
    });
  }
  return outputs;
}

async function composePackSheetPng(pack, frameFiles) {
  if (!frameFiles.length) return null;
  const decoded = [];
  for (const frameFile of frameFiles) {
    decoded.push({ ...frameFile, image: frameFile.image || await decodePngRgba(frameFile.bytes) });
  }

  const columns = positiveInteger(pack.metadata?.columns)
    || Math.max(1, ...decoded.map((item) => positiveInteger(item.frame?.column) + 1 || 1));
  const rows = positiveInteger(pack.metadata?.rows)
    || Math.max(1, ...decoded.map((item) => positiveInteger(item.frame?.row) + 1 || 1));
  const cellWidth = positiveInteger(pack.metadata?.cellWidth)
    || positiveInteger(decoded[0]?.frame?.dimensions?.width)
    || decoded[0].image.width;
  const cellHeight = positiveInteger(pack.metadata?.cellHeight)
    || positiveInteger(decoded[0]?.frame?.dimensions?.height)
    || decoded[0].image.height;
  const width = columns * cellWidth;
  const height = rows * cellHeight;
  const sheet = new Uint8Array(width * height * 4);

  for (const item of decoded) {
    const column = positiveInteger(item.frame?.column) || 0;
    const row = positiveInteger(item.frame?.row) || 0;
    blitContainRgba({
      target: sheet,
      targetWidth: width,
      targetHeight: height,
      source: item.image.data,
      sourceWidth: item.image.width,
      sourceHeight: item.image.height,
      x: column * cellWidth,
      y: row * cellHeight,
      width: cellWidth,
      height: cellHeight,
    });
  }

  return {
    bytes: await encodePngRgba(width, height, sheet),
    width,
    height,
    columns,
    rows,
    cellWidth,
    cellHeight,
  };
}

function removeEdgeConnectedBackgroundRgba(data, width, height) {
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

  const threshold = PACK_ALPHA_CONFIG.threshold;
  const feather = PACK_ALPHA_CONFIG.feather;
  const maxDistance = threshold + feather;
  const visited = new Uint8Array(totalPixels);
  const queue = new Uint32Array(totalPixels);
  let read = 0;
  let write = 0;

  const enqueueIfBackground = (index) => {
    if (visited[index]) return;
    const offset = index * 4;
    const distance = backgroundDistanceRgba(data, offset, bg);
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
    const distance = backgroundDistanceRgba(data, offset, bg);
    const alpha = distance <= threshold
      ? 0
      : Math.round(255 * ((distance - threshold) / feather));
    const nextAlpha = Math.min(data[offset + 3], alpha);
    data[offset + 3] = nextAlpha;
    if (nextAlpha <= 2) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
    }

    if (x > 0) enqueueIfBackground(index - 1);
    if (x < width - 1) enqueueIfBackground(index + 1);
    if (y > 0) enqueueIfBackground(index - width);
    if (y < height - 1) enqueueIfBackground(index + width);
  }
}

function backgroundDistanceRgba(data, offset, bg) {
  return Math.hypot(data[offset] - bg.r, data[offset + 1] - bg.g, data[offset + 2] - bg.b);
}

function blitContainRgba({ target, targetWidth, targetHeight, source, sourceWidth, sourceHeight, x, y, width, height }) {
  if (!sourceWidth || !sourceHeight || !width || !height) return;
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = Math.max(1, Math.min(width, Math.round(sourceWidth * scale)));
  const drawHeight = Math.max(1, Math.min(height, Math.round(sourceHeight * scale)));
  const offsetX = x + Math.floor((width - drawWidth) / 2);
  const offsetY = y + Math.floor((height - drawHeight) / 2);

  for (let dy = 0; dy < drawHeight; dy += 1) {
    const ty = offsetY + dy;
    if (ty < 0 || ty >= targetHeight) continue;
    const sy = Math.min(sourceHeight - 1, Math.floor(dy / scale));
    for (let dx = 0; dx < drawWidth; dx += 1) {
      const tx = offsetX + dx;
      if (tx < 0 || tx >= targetWidth) continue;
      const sx = Math.min(sourceWidth - 1, Math.floor(dx / scale));
      const sourceIndex = ((sy * sourceWidth) + sx) * 4;
      const targetIndex = ((ty * targetWidth) + tx) * 4;
      target[targetIndex] = source[sourceIndex];
      target[targetIndex + 1] = source[sourceIndex + 1];
      target[targetIndex + 2] = source[sourceIndex + 2];
      target[targetIndex + 3] = source[sourceIndex + 3];
    }
  }
}

async function decodePngRgba(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (data.length < 33 || !isPngSignature(data)) throw new Error("Unsupported PNG signature.");
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idatChunks = [];

  while (offset + 12 <= data.length) {
    const length = view.getUint32(offset, false);
    const type = asciiFromBytes(data.subarray(offset + 4, offset + 8));
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + length;
    if (chunkEnd + 4 > data.length) throw new Error("Truncated PNG chunk.");
    const chunk = data.subarray(chunkStart, chunkEnd);
    if (type === "IHDR") {
      const chunkView = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      width = chunkView.getUint32(0, false);
      height = chunkView.getUint32(4, false);
      bitDepth = chunk[8];
      colorType = chunk[9];
      interlace = chunk[12];
    } else if (type === "IDAT") {
      idatChunks.push(chunk);
    } else if (type === "IEND") {
      break;
    }
    offset = chunkEnd + 4;
  }

  if (!width || !height || !idatChunks.length) throw new Error("PNG is missing IHDR or IDAT.");
  if (bitDepth !== 8 || interlace !== 0) throw new Error("Only 8-bit non-interlaced PNG files are supported.");
  const channels = pngChannels(colorType);
  if (!channels) throw new Error(`Unsupported PNG color type: ${colorType}`);

  const inflated = await inflateBytes(concatUint8(idatChunks));
  const rowBytes = width * channels;
  const expected = height * (rowBytes + 1);
  if (inflated.length < expected) throw new Error("PNG pixel stream is shorter than expected.");
  const unpacked = new Uint8Array(width * height * channels);
  const bpp = channels;
  let inputOffset = 0;

  for (let rowIndex = 0; rowIndex < height; rowIndex += 1) {
    const filter = inflated[inputOffset];
    inputOffset += 1;
    const rowStart = rowIndex * rowBytes;
    const previousStart = rowStart - rowBytes;
    for (let index = 0; index < rowBytes; index += 1) {
      const raw = inflated[inputOffset + index];
      const left = index >= bpp ? unpacked[rowStart + index - bpp] : 0;
      const up = rowIndex > 0 ? unpacked[previousStart + index] : 0;
      const upLeft = rowIndex > 0 && index >= bpp ? unpacked[previousStart + index - bpp] : 0;
      unpacked[rowStart + index] = (raw + pngFilterPredictor(filter, left, up, upLeft)) & 0xff;
    }
    inputOffset += rowBytes;
  }

  const rgba = new Uint8Array(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const sourceIndex = pixel * channels;
    const targetIndex = pixel * 4;
    if (colorType === 6) {
      rgba[targetIndex] = unpacked[sourceIndex];
      rgba[targetIndex + 1] = unpacked[sourceIndex + 1];
      rgba[targetIndex + 2] = unpacked[sourceIndex + 2];
      rgba[targetIndex + 3] = unpacked[sourceIndex + 3];
    } else if (colorType === 2) {
      rgba[targetIndex] = unpacked[sourceIndex];
      rgba[targetIndex + 1] = unpacked[sourceIndex + 1];
      rgba[targetIndex + 2] = unpacked[sourceIndex + 2];
      rgba[targetIndex + 3] = 255;
    } else if (colorType === 4) {
      const gray = unpacked[sourceIndex];
      rgba[targetIndex] = gray;
      rgba[targetIndex + 1] = gray;
      rgba[targetIndex + 2] = gray;
      rgba[targetIndex + 3] = unpacked[sourceIndex + 1];
    } else {
      const gray = unpacked[sourceIndex];
      rgba[targetIndex] = gray;
      rgba[targetIndex + 1] = gray;
      rgba[targetIndex + 2] = gray;
      rgba[targetIndex + 3] = 255;
    }
  }

  return { width, height, data: rgba };
}

async function encodePngRgba(width, height, rgba) {
  const rowBytes = width * 4;
  const raw = new Uint8Array(height * (rowBytes + 1));
  for (let row = 0; row < height; row += 1) {
    const sourceStart = row * rowBytes;
    const targetStart = row * (rowBytes + 1);
    raw[targetStart] = 0;
    raw.set(rgba.subarray(sourceStart, sourceStart + rowBytes), targetStart + 1);
  }

  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width, false);
  view.setUint32(4, height, false);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = await deflateBytes(raw);
  return concatUint8([
    PNG_SIGNATURE,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", new Uint8Array()),
  ]);
}

function isPngSignature(bytes) {
  return PNG_SIGNATURE.every((byte, index) => bytes[index] === byte);
}

function pngChannels(colorType) {
  return { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType] || 0;
}

function pngFilterPredictor(filter, left, up, upLeft) {
  if (filter === 0) return 0;
  if (filter === 1) return left;
  if (filter === 2) return up;
  if (filter === 3) return Math.floor((left + up) / 2);
  if (filter === 4) return paethPredictor(left, up, upLeft);
  throw new Error(`Unsupported PNG filter: ${filter}`);
}

function paethPredictor(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  return upDistance <= upLeftDistance ? up : upLeft;
}

function pngChunk(type, bytes) {
  const typeBytes = new TextEncoder().encode(type);
  const chunk = new Uint8Array(12 + bytes.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, bytes.length, false);
  chunk.set(typeBytes, 4);
  chunk.set(bytes, 8);
  view.setUint32(8 + bytes.length, crc32(concatUint8([typeBytes, bytes])), false);
  return chunk;
}

async function inflateBytes(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function deflateBytes(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function concatUint8(parts) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function asciiFromBytes(bytes) {
  return String.fromCharCode(...bytes);
}

function positiveInteger(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

const PACK_ALPHA_CONFIG = {
  method: "edge-connected-corner-flood",
  threshold: 34,
  feather: 22,
};

async function createZipBlob(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  let centralSize = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const bytes = file.bytes instanceof Uint8Array ? file.bytes : new Uint8Array(file.bytes);
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

function invalidLibraryFileKey(key) {
  if (!key || key.length > 360) return "Invalid library key.";
  if (!key.startsWith("library/files/")) return "Invalid library key.";
  if (key.includes("..") || key.includes("\\") || key.includes("//")) return "Invalid library key.";
  return "";
}

function contentTypeForResult(result) {
  const filename = safeString(result?.filename).toLowerCase();
  if (result?.kind === "model" || filename.endsWith(".glb")) return "model/gltf-binary";
  if (filename.endsWith(".gltf")) return "model/gltf+json";
  if (result?.kind === "video" || filename.endsWith(".mp4")) return "video/mp4";
  if (filename.endsWith(".webm")) return "video/webm";
  if (filename.endsWith(".mov")) return "video/quicktime";
  if (filename.endsWith(".gif")) return "image/gif";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  if (filename.endsWith(".webp")) return "image/webp";
  if (filename.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

function parseJsonObject(content) {
  const trimmed = String(content || "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object in Mistral response");
    return JSON.parse(match[0]);
  }
}

function dataUrlToBlob(dataUrl) {
  validateImageDataUrl(dataUrl);
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/i.exec(dataUrl || "");
  if (!match) throw new Error("Invalid data URL");
  const mime = match[1] || "application/octet-stream";
  const bytes = match[2]
    ? Uint8Array.from(atob(match[3]), (char) => char.charCodeAt(0))
    : new TextEncoder().encode(decodeURIComponent(match[3]));
  return new Blob([bytes], { type: mime });
}

async function characterOpenPoseDataUrl(kind) {
  const pose = CHARACTER_OPENPOSE_TEMPLATES[kind] || CHARACTER_OPENPOSE_TEMPLATES.idle;
  const width = 512;
  const height = 512;
  const pixels = new Uint8Array(width * height * 4);
  for (let offset = 0; offset < pixels.length; offset += 4) {
    pixels[offset + 3] = 255;
  }
  for (const [from, to, color] of OPENPOSE_LIMBS) {
    drawPoseLineRgba(pixels, width, height, pose[from], pose[to], color, 9);
  }
  for (const point of Object.values(pose)) {
    drawPoseCircleRgba(pixels, width, height, point, 6, [255, 255, 255]);
  }
  return `data:image/png;base64,${bytesToBase64(await encodePngRgba(width, height, pixels))}`;
}

function drawPoseLineRgba(pixels, width, height, from, to, color, lineWidth) {
  if (!from || !to) return;
  const steps = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) * 1.5));
  const radius = Math.max(1, Math.round(lineWidth / 2));
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const x = Math.round(from[0] + (to[0] - from[0]) * t);
    const y = Math.round(from[1] + (to[1] - from[1]) * t);
    drawPoseCircleRgba(pixels, width, height, [x, y], radius, color);
  }
}

function drawPoseCircleRgba(pixels, width, height, point, radius, color) {
  if (!point) return;
  const [cx, cy] = point;
  const r2 = radius * radius;
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(width - 1, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(height - 1, Math.ceil(cy + radius));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > r2) continue;
      const offset = (y * width + x) * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = 255;
    }
  }
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function pngBytesFromDataUrl(dataUrl) {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl || "");
  if (!match) {
    const error = new Error("Invalid PNG data URL.");
    error.status = 500;
    error.code = "invalid_cached_part";
    throw error;
  }
  return Uint8Array.from(atob(match[1]), (char) => char.charCodeAt(0));
}

function validateImageDataUrl(dataUrl) {
  if (typeof dataUrl !== "string" || dataUrl.length > MAX_DATA_URL_CHARS) {
    throw httpError(413, "Image data URL is too large.", "payload_too_large");
  }
  const match = /^data:([^;,]+)?(;base64)?,/i.exec(dataUrl);
  if (!match || match[2] !== ";base64") {
    throw httpError(400, "Image data URL must be base64 encoded.", "invalid_image_data_url");
  }
  const mime = match[1] || "";
  if (!["image/png", "image/jpeg", "image/webp"].includes(mime)) {
    throw httpError(400, "Image data URL must be PNG, JPEG, or WebP.", "invalid_image_data_url");
  }
}

function mimeToExtension(mime) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/png") return "png";
  return null;
}

async function readJson(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_JSON_BODY_BYTES) {
    throw httpError(413, "Request body is too large.", "payload_too_large");
  }
  const text = await request.text();
  if (text.length > MAX_JSON_BODY_BYTES) {
    throw httpError(413, "Request body is too large.", "payload_too_large");
  }
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw httpError(400, "Invalid JSON request body", "invalid_json");
  }
}

function safeString(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function enumString(value, allowed, fallback) {
  const text = safeString(value);
  return allowed.has(text) ? text : fallback;
}

function validateComfyImageMeta(meta) {
  const invalid = invalidComfyImageMeta(meta);
  if (invalid) throw httpError(400, invalid, "invalid_file");
}

function invalidComfyImageMeta(meta) {
  const filename = safeString(meta?.filename);
  const subfolder = safeString(meta?.subfolder);
  const type = safeString(meta?.type, "output");
  if (!filename || filename.length > 180) return "Invalid Comfy filename.";
  if (subfolder.length > 180) return "Invalid Comfy subfolder.";
  if (!ALLOWED_COMFY_FILE_TYPES.has(type)) return "Invalid Comfy file type.";
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) return "Invalid Comfy filename.";
  if (subfolder.includes("\\") || subfolder.includes("..")) return "Invalid Comfy subfolder.";
  return "";
}

function titleFromBrief(brief) {
  return safeString(brief, "游戏素材").replace(/[，。,.!！?？].*$/, "").slice(0, 18) || "游戏素材";
}

function randomSeed() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0];
}

function httpError(status, message, code = "bad_request") {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(),
      ...extraHeaders,
    },
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,HEAD,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-lingji-access-token",
  };
}

function normalizePath(pathname) {
  return pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
}

function isFilePath(pathname) {
  return /\.([a-zA-Z0-9]+)$/.test(pathname);
}

function mapSectionPath(pathname) {
  const match = PAGE_PREFIXES.find((prefix) => pathname.startsWith(prefix));
  if (!match) return null;
  return pathname;
}

function buildAssetRequest(request, pathname) {
  const target = new URL(request.url);
  target.pathname = pathname;
  return new Request(target.toString(), request);
}

async function tryFetchAsset(request, env, candidates) {
  for (const pathname of candidates) {
    const assetReq = buildAssetRequest(request, pathname);
    const res = await env.ASSETS.fetch(assetReq);
    if (res.status !== 404) return res;
  }
  return null;
}
