// image —— 从 worker.js 拆出的模块（纯机械抽取，逻辑不变）。
import { CHARACTER_OPENPOSE_TEMPLATES, OPENPOSE_LIMBS, PACK_ALPHA_CONFIG, validateImageDataUrl } from "../worker.js";
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

export async function composePackSheetPng(pack, frameFiles) {
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

// 根据朝向与帧相位生成行走骨架：4 帧相位 [contact, passing, contact, passing]，
// 左右肢体反相摆动、躯干轻微上浮。属管线脚手架（quality-WIP）。
function directionalWalkPoseKeypoints(direction, phase, frames = WALK_4DIR_FRAMES) {
  const base = direction === "right"
    ? mirrorOpenPoseTemplate(DIRECTIONAL_WALK_OPENPOSE_BASE.left)
    : DIRECTIONAL_WALK_OPENPOSE_BASE[direction] || DIRECTIONAL_WALK_OPENPOSE_BASE.down;
  const cycle = Math.max(1, frames);
  const swing = Math.sin((phase / cycle) * Math.PI * 2); // -1..1，左右肢体反相
  const sideways = direction === "left" || direction === "right";
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

// 解析姿态键：支持 4 方向行走的 "walk4:<direction>:<phase>" 复合键，否则查既有动作模板。
function resolveOpenPoseTemplate(kind) {
  if (typeof kind === "string" && kind.startsWith("walk4:")) {
    const [, direction = "down", phase = "0"] = kind.split(":");
    return directionalWalkPoseKeypoints(direction, Number(phase) || 0);
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
