// 4 方向行走动画（管线脚手架，quality-WIP）：一个 pack 生成 4 朝向 × N 帧，
// sprite sheet 行=朝向、列=帧；每帧 metadata 标注 direction。质量依赖底模与参考图。
const WALK_4DIR_DIRECTIONS = [
  { id: "down", label: "Down", facing: "facing toward the camera (front view)", extra: "front of the character clearly visible" },
  { id: "left", label: "Left", facing: "in a left-facing side profile", extra: "left-facing silhouette" },
  { id: "right", label: "Right", facing: "in a right-facing side profile", extra: "right-facing silhouette" },
  { id: "up", label: "Up", facing: "facing away from the camera (back view)", extra: "back of the head and back of the costume visible" },
];
// 8 方向行走（管线脚手架，quality-WIP）：4 正方向 + 四个斜向（3/4 侧身）。
// 朝向顺序 direction-major：down, down-left, left, up-left, up, up-right, right, down-right。
const WALK_8DIR_DIRECTIONS = [
  { id: "down", label: "Down", facing: "facing toward the camera (front view)", extra: "front of the character clearly visible" },
  { id: "down-left", label: "Down-Left", facing: "in a front three-quarter view turned toward the lower-left", extra: "three-quarter front-left silhouette" },
  { id: "left", label: "Left", facing: "in a left-facing side profile", extra: "left-facing silhouette" },
  { id: "up-left", label: "Up-Left", facing: "in a back three-quarter view turned toward the upper-left", extra: "three-quarter back-left silhouette" },
  { id: "up", label: "Up", facing: "facing away from the camera (back view)", extra: "back of the head and back of the costume visible" },
  { id: "up-right", label: "Up-Right", facing: "in a back three-quarter view turned toward the upper-right", extra: "three-quarter back-right silhouette" },
  { id: "right", label: "Right", facing: "in a right-facing side profile", extra: "right-facing silhouette" },
  { id: "down-right", label: "Down-Right", facing: "in a front three-quarter view turned toward the lower-right", extra: "three-quarter front-right silhouette" },
];
const WALK_4DIR_FRAME_COUNT = 4;
const WALK_4DIR_PHASE_LABELS = ["contact", "passing", "contact", "passing"];
const ACTION_CLIP_FRAME_COUNT = 4;
const MONSTER_ACTION_CLIP_FRAME_COUNT = 8;

// 构建方向行走 items：行=朝向、列=帧（direction-major）；poseTag 区分 walk4 / walk8。
function buildDirectionalWalkItems(directions, poseTag) {
  const items = [];
  for (const direction of directions) {
    for (let frame = 0; frame < WALK_4DIR_FRAME_COUNT; frame += 1) {
      const phase = WALK_4DIR_PHASE_LABELS[frame] || "key";
      items.push({
        id: `${direction.id}_${frame}`,
        label: `${direction.label} ${frame + 1}`,
        direction: direction.id,
        frame,
        // 姿态键映射到 image.js 的方向行走骨架生成器。
        pose: `${poseTag}:${direction.id}:${frame}`,
        prompt: `walk cycle ${phase} pose, ${direction.facing}, mid-stride legs with one foot forward, arms swinging in opposition, ${direction.extra}, full body, not idle`,
        referenceDenoise: { stable: 0.5, balanced: 0.58, expressive: 0.66 },
      });
    }
  }
  return items;
}

function buildWalk4DirItems() {
  return buildDirectionalWalkItems(WALK_4DIR_DIRECTIONS, "walk4");
}

function buildWalk8DirItems() {
  return buildDirectionalWalkItems(WALK_8DIR_DIRECTIONS, "walk8");
}

function buildActionClipItems(actions, frameCount = ACTION_CLIP_FRAME_COUNT) {
  const items = [];
  for (const action of actions) {
    for (let frame = 0; frame < frameCount; frame += 1) {
      const phase = action.phases?.[frame] || `animation key pose ${frame + 1}`;
      items.push({
        id: `${action.id}_${frame}`,
        label: `${action.label} ${frame + 1}`,
        action: action.id,
        clip: action.id,
        actionFrame: frame,
        frame,
        loop: action.loop !== false,
        fps: action.fps || 8,
        pose: action.pose ? `action:${action.id}:${frame}` : null,
        prompt: [
          action.prompt,
          phase,
          `frame ${frame + 1} of a ${frameCount}-frame ${action.label.toLowerCase()} animation clip`,
          "same silhouette size and camera as the other frames in this clip",
        ].filter(Boolean).join(", "),
        referenceDenoise: action.referenceDenoise,
      });
    }
  }
  return items;
}

export const PACK_PRESETS = {
  "character-walk-4dir": {
    kind: "sprite-actions",
    assetType: "character",
    style: "pixel",
    camera: "front",
    cell: [512, 512],
    columns: WALK_4DIR_FRAME_COUNT, // 列 = 帧
    rows: WALK_4DIR_DIRECTIONS.length, // 行 = 朝向
    directional: true,
    shared: "same character identity, same costume and colors, one full-body walking sprite frame only, centered, plain solid background, no frame border, consistent scale across every direction and frame",
    items: buildWalk4DirItems(),
  },
  "character-walk-8dir": {
    kind: "sprite-actions",
    assetType: "character",
    style: "pixel",
    camera: "front",
    cell: [512, 512],
    columns: WALK_4DIR_FRAME_COUNT, // 列 = 帧
    rows: WALK_8DIR_DIRECTIONS.length, // 行 = 朝向（8）
    directional: true,
    shared: "same character identity, same costume and colors, one full-body walking sprite frame only, centered, plain solid background, no frame border, consistent scale across every direction and frame",
    items: buildWalk8DirItems(),
  },
  "character-actions": {
    kind: "sprite-actions",
    assetType: "character",
    style: "pixel",
    camera: "front",
    cell: [512, 512],
    columns: ACTION_CLIP_FRAME_COUNT,
    rows: 4,
    shared: "same character identity, same costume and colors, one full-body sprite frame only, centered, plain solid background, no frame border, action-major sprite sheet layout where each row is one animation clip and each column is a frame",
    items: buildActionClipItems([
      {
        id: "idle",
        label: "Idle",
        loop: true,
        pose: true,
        fps: 8,
        prompt: "idle standing animation, relaxed ready stance, subtle breathing motion",
        phases: [
          "breathing low pose, shoulders relaxed",
          "slight chest rise and cloak lift",
          "settling pose, weight centered",
          "return pose that loops cleanly to frame 1",
        ],
        referenceDenoise: { stable: 0.38, balanced: 0.46, expressive: 0.54 },
      },
      {
        id: "walk",
        label: "Walk",
        loop: true,
        pose: true,
        fps: 8,
        prompt: "walk cycle animation, readable stepping motion, arms swinging in opposition, not idle",
        phases: [
          "left foot contact pose, right arm forward",
          "passing pose with lifted trailing foot",
          "right foot contact pose, left arm forward",
          "passing pose that loops cleanly to frame 1",
        ],
        referenceDenoise: { stable: 0.58, balanced: 0.7, expressive: 0.82 },
      },
      {
        id: "attack",
        label: "Attack",
        loop: false,
        pose: true,
        fps: 10,
        prompt: "attack animation, wide sword slash, weapon arc readable, dramatic torso turn, not idle",
        phases: [
          "anticipation wind-up, weapon pulled back",
          "slash startup, torso twisting into the strike",
          "impact frame, weapon fully extended with the clearest silhouette",
          "recovery pose after the strike, returning toward ready stance",
        ],
        referenceDenoise: { stable: 0.66, balanced: 0.78, expressive: 0.88 },
      },
      {
        id: "hurt",
        label: "Hurt",
        loop: false,
        pose: true,
        fps: 10,
        prompt: "hurt reaction animation, body recoiling backward, off-balance stance, defensive expression, not idle",
        phases: [
          "first impact recoil, shoulders knocked back",
          "deep stagger frame, body most off-balance",
          "guarded recovery, knees bent and arms defensive",
          "returning toward ready stance",
        ],
        referenceDenoise: { stable: 0.62, balanced: 0.74, expressive: 0.84 },
      },
    ]),
  },
  "monster-actions": {
    kind: "sprite-actions",
    assetType: "creature",
    style: "pixel",
    camera: "front",
    cell: [512, 512],
    columns: MONSTER_ACTION_CLIP_FRAME_COUNT,
    rows: 4,
    shared: "same creature identity, same colors and body shape, one centered monster sprite frame only, plain solid background, no frame border, action-major sprite sheet layout where each row is one animation clip and each column is one of eight frames",
    items: buildActionClipItems([
      {
        id: "idle",
        label: "Idle",
        loop: true,
        fps: 8,
        prompt: "idle monster animation, neutral expression, subtle breathing or pulsing motion",
        phases: [
          "low breathing pose",
          "breathing rise begins, chest and head lift slightly",
          "slight body rise and mouth twitch",
          "highest breathing pose, tiny tail or spine motion",
          "settling pose",
          "body lowers, limbs relax",
          "near return pose with small mouth or eye change",
          "return pose that loops cleanly to frame 1",
        ],
        referenceDenoise: { stable: 0.38, balanced: 0.46, expressive: 0.54 },
      },
      {
        id: "move",
        label: "Move",
        loop: true,
        fps: 8,
        prompt: "monster movement cycle animation, body squashing forward or stepping, clear locomotion, not idle",
        phases: [
          "first contact or squash pose",
          "push-off begins, body leaning forward",
          "forward passing pose",
          "stretched stride pose, tail trailing",
          "second contact or stretch pose",
          "recovery step, weight crossing center",
          "second passing pose with opposite limb emphasis",
          "passing pose that loops cleanly to frame 1",
        ],
        referenceDenoise: { stable: 0.58, balanced: 0.7, expressive: 0.82 },
      },
      {
        id: "attack",
        label: "Attack",
        loop: false,
        fps: 10,
        prompt: "monster attack animation, open mouth or striking appendage, aggressive forward motion, not idle",
        phases: [
          "anticipation wind-up, body crouched",
          "deeper wind-up with claws or mouth pulled back",
          "attack startup, claws or mouth moving forward",
          "fast lunge, body stretched forward",
          "impact frame, largest aggressive silhouette",
          "follow-through frame after impact",
          "recoil from attack, body pulling back",
          "recovery pose after the strike",
        ],
        referenceDenoise: { stable: 0.66, balanced: 0.78, expressive: 0.88 },
      },
      {
        id: "death",
        label: "Death",
        loop: false,
        fps: 10,
        prompt: "monster death animation, defeated collapse, flattened or fallen body, readable silhouette, not idle",
        phases: [
          "hit reaction, body starting to collapse",
          "staggering backward, limbs losing balance",
          "falling frame, limbs or tail losing support",
          "half-collapsed frame, body rotated toward ground",
          "impact on ground, body flattened",
          "post-impact squash, tail and limbs settling",
          "nearly still defeated pose",
          "final defeated pose, no active motion",
        ],
        referenceDenoise: { stable: 0.62, balanced: 0.74, expressive: 0.84 },
      },
    ], MONSTER_ACTION_CLIP_FRAME_COUNT),
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
