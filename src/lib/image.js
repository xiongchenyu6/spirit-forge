// image —— 从 worker.js 拆出的模块（纯机械抽取，逻辑不变）。
import { CHARACTER_OPENPOSE_TEMPLATES, OPENPOSE_LIMBS, PACK_ALPHA_CONFIG, validateImageDataUrl } from "../app.js";
import { bytesToBase64, decodePngRgba, encodePngRgba, positiveInteger } from "./binary.js";

function imageSafeLibrarySegment(value) {
  const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  return (text || "asset")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "asset";
}

function imagePackFrameZipName(frame, index) {
  const order = Number.isFinite(Number(frame.index)) ? Number(frame.index) + 1 : index + 1;
  const label = frame.id || frame.label || `frame-${index + 1}`;
  const source = frame.result?.filename || `${imageSafeLibrarySegment(label)}.png`;
  const extension = source.includes(".") ? source.slice(source.lastIndexOf(".")).toLowerCase() : ".png";
  return `${String(order).padStart(2, "0")}-${imageSafeLibrarySegment(label)}${extension}`;
}

function imagePackFrameAlphaZipName(frame, index) {
  return imagePackFrameZipName(frame, index).replace(/(\.[^.]+)?$/, "_alpha.png");
}

export function alphaBounds(data, width, height, threshold = 24) {
  return alphaBoundsInRect(data, width, height, 0, 0, width, height, threshold);
}

export function alphaBoundsInRect(data, width, height, x, y, rectWidth, rectHeight, threshold = 24) {
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

export async function composePackTransparentFrames(frameFiles) {
  const outputs = [];
  for (const frameFile of frameFiles) {
    const image = await decodePngRgba(frameFile.bytes);
    removeEdgeConnectedBackgroundRgba(image.data, image.width, image.height);
    const bytes = await encodePngRgba(image.width, image.height, image.data);
    outputs.push({
      ...frameFile,
      path: `frames/transparent/${imagePackFrameAlphaZipName(frameFile.frame, frameFile.index)}`,
      bytes,
      image,
    });
  }
  return outputs;
}

export async function composePackSheetBundlePng(pack, frameFiles, options = {}) {
  if (!frameFiles.length) return null;
  const decoded = await decodePackFrameFiles(frameFiles);
  const includeSheet = options.includeSheet !== false;
  const includeClipSheets = options.includeClipSheets !== false;
  return {
    sheet: includeSheet ? await composeFullPackSheetPng(pack, decoded) : null,
    clipSheets: includeClipSheets ? await composePackClipSheetsFromDecoded(pack, decoded) : [],
  };
}

export async function composePackSheetPng(pack, frameFiles) {
  const bundle = await composePackSheetBundlePng(pack, frameFiles, { includeClipSheets: false });
  return bundle?.sheet || null;
}

export async function composePackClipSheetsPng(pack, frameFiles) {
  const bundle = await composePackSheetBundlePng(pack, frameFiles, { includeSheet: false });
  return bundle?.clipSheets || [];
}

async function decodePackFrameFiles(frameFiles) {
  const decoded = [];
  for (const frameFile of frameFiles) {
    decoded.push({ ...frameFile, image: frameFile.image || await decodePngRgba(frameFile.bytes) });
  }
  return decoded;
}

async function composeFullPackSheetPng(pack, decoded) {
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
    path: "sheet.png",
    width,
    height,
    columns,
    rows,
    cellWidth,
    cellHeight,
  };
}

async function composePackClipSheetsFromDecoded(pack, decoded) {
  if (pack?.packKind !== "sprite-actions" || decoded.length === 0) return [];
  const groups = groupDecodedClipFrames(decoded);
  const cellWidth = positiveInteger(pack.metadata?.cellWidth)
    || positiveInteger(decoded[0]?.frame?.dimensions?.width)
    || decoded[0].image.width;
  const cellHeight = positiveInteger(pack.metadata?.cellHeight)
    || positiveInteger(decoded[0]?.frame?.dimensions?.height)
    || decoded[0].image.height;
  const sheets = [];
  for (const group of groups) {
    const frames = group.frames.slice().sort(compareClipFrameOrder);
    const columns = Math.max(1, frames.length);
    const width = columns * cellWidth;
    const height = cellHeight;
    const sheet = new Uint8Array(width * height * 4);
    frames.forEach((item, index) => {
      blitContainRgba({
        target: sheet,
        targetWidth: width,
        targetHeight: height,
        source: item.image.data,
        sourceWidth: item.image.width,
        sourceHeight: item.image.height,
        x: index * cellWidth,
        y: 0,
        width: cellWidth,
        height: cellHeight,
      });
    });
    sheets.push({
      key: group.key,
      action: group.action,
      direction: group.direction,
      path: `sheets/${imageSafeLibrarySegment(group.key)}.png`,
      bytes: await encodePngRgba(width, height, sheet),
      width,
      height,
      columns,
      rows: 1,
      cellWidth,
      cellHeight,
      frames: frames.map((item, index) => ({
        id: item.frame?.id || "",
        index,
        row: 0,
        column: index,
        sourceRow: positiveInteger(item.frame?.row),
        sourceColumn: positiveInteger(item.frame?.column),
      })),
    });
  }
  return sheets;
}

function groupDecodedClipFrames(decoded) {
  const groups = [];
  const byKey = new Map();
  for (const item of decoded) {
    const frame = item.frame || {};
    const action = frame.action || frame.clip || "";
    const direction = action ? "" : frame.direction || "";
    const key = action || direction || "animation";
    if (!byKey.has(key)) {
      const group = { key, action: action || null, direction: direction || null, frames: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).frames.push(item);
  }
  return groups;
}

function compareClipFrameOrder(a, b) {
  const af = a.frame || {};
  const bf = b.frame || {};
  const aFrame = Number.isFinite(Number(af.actionFrame)) ? Number(af.actionFrame) : Number(af.column);
  const bFrame = Number.isFinite(Number(bf.actionFrame)) ? Number(bf.actionFrame) : Number(bf.column);
  if (Number.isFinite(aFrame) && Number.isFinite(bFrame) && aFrame !== bFrame) return aFrame - bFrame;
  return (Number(af.index) || 0) - (Number(bf.index) || 0);
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

export function dataUrlToBlob(dataUrl) {
  validateImageDataUrl(dataUrl);
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/i.exec(dataUrl || "");
  if (!match) throw new Error("Invalid data URL");
  const mime = match[1] || "application/octet-stream";
  const bytes = match[2]
    ? Uint8Array.from(atob(match[3]), (char) => char.charCodeAt(0))
    : new TextEncoder().encode(decodeURIComponent(match[3]));
  return new Blob([bytes], { type: mime });
}

// 4 方向行走 OpenPose 模板（管线脚手架，quality-WIP）。
// 朝向：down(面向镜头) / up(背向镜头) / left / right(left 镜像)。仅作 ControlNet 姿态引导，
// 复用 drawPoseLineRgba / drawPoseCircleRgba 绘制原语；真实行走质量依赖底模与参考图，
// 后续可替换为更精细的逐帧骨架。
export const WALK_4DIR_DIRECTIONS = ["down", "left", "right", "up"];
export const WALK_4DIR_FRAMES = 4;
// 8 方向行走：在 4 正方向之外补四个斜向（direction-major，行=朝向）。
// 斜向骨架由相邻两个正方向基模板插值（≈ 3/4 侧身），右侧斜向再做镜像。
export const WALK_8DIR_DIRECTIONS = [
  "down", "down-left", "left", "up-left", "up", "up-right", "right", "down-right",
];
export const WALK_8DIR_FRAMES = 4;

const DIRECTIONAL_WALK_OPENPOSE_BASE = {
  // 面向镜头（正面），脸部关键点可见。
  down: {
    nose: [256, 110], lEye: [246, 104], rEye: [266, 104],
    lEar: [238, 110], rEar: [274, 110],
    neck: [256, 156], lShoulder: [216, 168], rShoulder: [296, 168],
    lElbow: [206, 230], rElbow: [306, 230], lHand: [200, 288], rHand: [312, 288],
    lHip: [232, 286], rHip: [280, 286],
    lKnee: [226, 360], rKnee: [286, 360], lFoot: [218, 442], rFoot: [294, 442],
  },
  // 背向镜头（背面）：脸部朝里、左右内收，脸部细节弱化（quality-WIP）。
  up: {
    nose: [256, 118], lEye: [264, 112], rEye: [248, 112],
    lEar: [276, 114], rEar: [236, 114],
    neck: [256, 156], lShoulder: [296, 168], rShoulder: [216, 168],
    lElbow: [306, 230], rElbow: [206, 230], lHand: [312, 288], rHand: [200, 288],
    lHip: [280, 286], rHip: [232, 286],
    lKnee: [286, 360], rKnee: [226, 360], lFoot: [294, 442], rFoot: [218, 442],
  },
  // 朝左侧面：身体侧转，四肢在 x 上靠拢，silhouette 更窄。
  left: {
    nose: [232, 110], lEye: [224, 104], rEye: [236, 106],
    lEar: [246, 110], rEar: [250, 112],
    neck: [252, 156], lShoulder: [248, 168], rShoulder: [264, 170],
    lElbow: [236, 230], rElbow: [270, 232], lHand: [226, 288], rHand: [276, 290],
    lHip: [252, 286], rHip: [268, 286],
    lKnee: [240, 360], rKnee: [278, 360], lFoot: [222, 442], rFoot: [294, 442],
  },
};

const OPENPOSE_LR_SWAP = {
  lEye: "rEye", rEye: "lEye", lEar: "rEar", rEar: "lEar",
  lShoulder: "rShoulder", rShoulder: "lShoulder",
  lElbow: "rElbow", rElbow: "lElbow", lHand: "rHand", rHand: "lHand",
  lHip: "rHip", rHip: "lHip", lKnee: "rKnee", rKnee: "lKnee",
  lFoot: "rFoot", rFoot: "lFoot",
};

// 侧面镜像：x 翻转并交换左右肢体，得到 right 朝向。
function mirrorOpenPoseTemplate(template, width = 512) {
  const mirrored = {};
  for (const [key, point] of Object.entries(template)) {
    const target = OPENPOSE_LR_SWAP[key] || key;
    mirrored[target] = [width - point[0], point[1]];
  }
  return mirrored;
}

// 两个正方向模板按权重插值，得到 3/4 侧身的斜向基模板（左斜向用 down/up + left）。
function blendOpenPoseTemplates(a, b, weight = 0.5) {
  const blended = {};
  for (const key of Object.keys(a)) {
    if (!b[key]) continue;
    blended[key] = [
      a[key][0] * (1 - weight) + b[key][0] * weight,
      a[key][1] * (1 - weight) + b[key][1] * weight,
    ];
  }
  return blended;
}

// 解析任意 8 向的基模板：4 正方向沿用原 4dir 逻辑；四个斜向由相邻正方向插值，
// 右侧斜向（up-right/down-right/right）由对应左侧模板镜像得到。
function directionalWalkBaseTemplate(direction) {
  switch (direction) {
    case "down":
      return DIRECTIONAL_WALK_OPENPOSE_BASE.down;
    case "up":
      return DIRECTIONAL_WALK_OPENPOSE_BASE.up;
    case "left":
      return DIRECTIONAL_WALK_OPENPOSE_BASE.left;
    case "right":
      return mirrorOpenPoseTemplate(DIRECTIONAL_WALK_OPENPOSE_BASE.left);
    case "down-left":
      return blendOpenPoseTemplates(DIRECTIONAL_WALK_OPENPOSE_BASE.down, DIRECTIONAL_WALK_OPENPOSE_BASE.left, 0.55);
    case "up-left":
      return blendOpenPoseTemplates(DIRECTIONAL_WALK_OPENPOSE_BASE.up, DIRECTIONAL_WALK_OPENPOSE_BASE.left, 0.55);
    case "down-right":
      return mirrorOpenPoseTemplate(
        blendOpenPoseTemplates(DIRECTIONAL_WALK_OPENPOSE_BASE.down, DIRECTIONAL_WALK_OPENPOSE_BASE.left, 0.55),
      );
    case "up-right":
      return mirrorOpenPoseTemplate(
        blendOpenPoseTemplates(DIRECTIONAL_WALK_OPENPOSE_BASE.up, DIRECTIONAL_WALK_OPENPOSE_BASE.left, 0.55),
      );
    default:
      return DIRECTIONAL_WALK_OPENPOSE_BASE.down;
  }
}

// 根据朝向与帧相位生成行走骨架：4 帧相位 [contact, passing, contact, passing]，
// 左右肢体反相摆动、躯干轻微上浮。属管线脚手架（quality-WIP）。支持 4/8 向。
function directionalWalkPoseKeypoints(direction, phase, frames = WALK_4DIR_FRAMES) {
  const base = directionalWalkBaseTemplate(direction);
  const cycle = Math.max(1, frames);
  const swing = Math.sin((phase / cycle) * Math.PI * 2); // -1..1，左右肢体反相
  const sideways = direction.includes("left") || direction.includes("right");
  const legAmp = sideways ? 30 : 20;
  const footAmp = legAmp + 10;
  const armAmp = 16;
  const lift = Math.round(Math.abs(swing) * 6);
  const bob = -Math.round(Math.abs(swing) * 4);

  const pose = {};
  for (const [key, point] of Object.entries(base)) pose[key] = [point[0], point[1]];

  pose.lKnee = [pose.lKnee[0] + swing * legAmp, pose.lKnee[1] - lift];
  pose.lFoot = [pose.lFoot[0] + swing * footAmp, pose.lFoot[1]];
  pose.rKnee = [pose.rKnee[0] - swing * legAmp, pose.rKnee[1] - lift];
  pose.rFoot = [pose.rFoot[0] - swing * footAmp, pose.rFoot[1]];
  pose.lElbow = [pose.lElbow[0] - swing * armAmp, pose.lElbow[1]];
  pose.lHand = [pose.lHand[0] - swing * (armAmp + 6), pose.lHand[1]];
  pose.rElbow = [pose.rElbow[0] + swing * armAmp, pose.rElbow[1]];
  pose.rHand = [pose.rHand[0] + swing * (armAmp + 6), pose.rHand[1]];
  for (const key of ["nose", "lEye", "rEye", "lEar", "rEar", "neck", "lShoulder", "rShoulder", "lHip", "rHip"]) {
    if (pose[key]) pose[key] = [pose[key][0], pose[key][1] + bob];
  }
  for (const key of Object.keys(pose)) pose[key] = [Math.round(pose[key][0]), Math.round(pose[key][1])];
  return pose;
}

function cloneOpenPoseTemplate(template) {
  const pose = {};
  for (const [key, point] of Object.entries(template || {})) {
    pose[key] = [point[0], point[1]];
  }
  return pose;
}

function roundedOpenPoseTemplate(template) {
  const pose = {};
  for (const [key, point] of Object.entries(template || {})) {
    pose[key] = [Math.round(point[0]), Math.round(point[1])];
  }
  return pose;
}

function applyPoseOffset(template, dx = 0, dy = 0, keys = null) {
  const pose = cloneOpenPoseTemplate(template);
  const targetKeys = Array.isArray(keys) ? keys : Object.keys(pose);
  for (const key of targetKeys) {
    if (!pose[key]) continue;
    pose[key] = [pose[key][0] + dx, pose[key][1] + dy];
  }
  return pose;
}

function idleActionPoseKeypoints(frame) {
  const bob = [0, -4, -1, 2][Math.abs(frame) % 4] || 0;
  const pose = applyPoseOffset(CHARACTER_OPENPOSE_TEMPLATES.idle, 0, bob, [
    "nose", "lEye", "rEye", "lEar", "rEar", "neck",
    "lShoulder", "rShoulder", "lElbow", "rElbow", "lHand", "rHand",
  ]);
  if (frame % 4 === 1) {
    pose.lHand = [pose.lHand[0] - 4, pose.lHand[1] - 2];
    pose.rHand = [pose.rHand[0] + 4, pose.rHand[1] - 2];
  } else if (frame % 4 === 3) {
    pose.lHand = [pose.lHand[0] + 3, pose.lHand[1] + 2];
    pose.rHand = [pose.rHand[0] - 3, pose.rHand[1] + 2];
  }
  return roundedOpenPoseTemplate(pose);
}

function characterActionPoseKeypoints(action, frame) {
  const phase = Math.max(0, Number(frame) || 0) % 4;
  if (action === "idle") return idleActionPoseKeypoints(phase);
  if (action === "walk") return directionalWalkPoseKeypoints("down", phase);
  if (action === "attack") {
    const weights = [0.25, 0.75, 1, 0.45];
    return roundedOpenPoseTemplate(blendOpenPoseTemplates(
      CHARACTER_OPENPOSE_TEMPLATES.idle,
      CHARACTER_OPENPOSE_TEMPLATES.attack,
      weights[phase] ?? 1,
    ));
  }
  if (action === "hurt") {
    const weights = [0.35, 1, 0.7, 0.25];
    return roundedOpenPoseTemplate(blendOpenPoseTemplates(
      CHARACTER_OPENPOSE_TEMPLATES.idle,
      CHARACTER_OPENPOSE_TEMPLATES.hurt,
      weights[phase] ?? 1,
    ));
  }
  return CHARACTER_OPENPOSE_TEMPLATES[action] || CHARACTER_OPENPOSE_TEMPLATES.idle;
}

// 解析姿态键：支持方向行走的 "walk4:<direction>:<phase>" / "walk8:<direction>:<phase>"
// 复合键（斜向 direction 含连字符，如 down-left），否则查既有动作模板。
function resolveOpenPoseTemplate(kind) {
  if (typeof kind === "string" && (kind.startsWith("walk4:") || kind.startsWith("walk8:"))) {
    const [, direction = "down", phase = "0"] = kind.split(":");
    return directionalWalkPoseKeypoints(direction, Number(phase) || 0);
  }
  if (typeof kind === "string" && kind.startsWith("action:")) {
    const [, action = "idle", phase = "0"] = kind.split(":");
    return characterActionPoseKeypoints(action, Number(phase) || 0);
  }
  return CHARACTER_OPENPOSE_TEMPLATES[kind] || CHARACTER_OPENPOSE_TEMPLATES.idle;
}

export async function characterOpenPoseDataUrl(kind) {
  const pose = resolveOpenPoseTemplate(kind);
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

export function pngBytesFromDataUrl(dataUrl) {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl || "");
  if (!match) {
    const error = new Error("Invalid PNG data URL.");
    error.status = 500;
    error.code = "invalid_cached_part";
    throw error;
  }
  return Uint8Array.from(atob(match[1]), (char) => char.charCodeAt(0));
}
