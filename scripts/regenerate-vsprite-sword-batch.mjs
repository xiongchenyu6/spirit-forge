#!/usr/bin/env node
// Regenerate the official swordmaster video-sprite showcase batch:
// source still -> local green-screen composite -> green FLF start/end frames ->
// Wan FLF video -> sampled transparent frames -> contact sheet/GIF/QA report.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import vm from "node:vm";
import { decodePngRgba, encodePngRgba } from "../src/lib/binary.js";

const ROOT = new URL("..", import.meta.url).pathname;
const BASE = process.env.LINGJI_BASE || "https://lingji-forge.xiongchenyu6.workers.dev";
const OUT_OFFICIAL = join(ROOT, "assets/generated/official");
const OUT_SHOWCASE = join(ROOT, "assets/generated/showcase");
const POSITIONAL_ARGS = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const REVIEW_ROOT = POSITIONAL_ARGS[0] || join(ROOT, "assets/generated/review/vsprite-sword-regenerated");
const FORCE = process.argv.includes("--force") || process.env.FORCE === "1";
const TOKEN = readToken();
const FRAME_COUNT = 22;
const GIF_SIZE = 300;
const SHEET_CELL = 146;
const SHEET_COLUMNS = 6;
const GREEN = "纯绿色背景 #00ff00 chroma key green screen,flat uniform RGB(0,255,0) backdrop,背景必须是均匀无渐变纯绿,四角和边缘都是同一个绿色,无地面阴影,全身入镜";
const NEG = "多个角色,两个人,双人,三人,分身,复制人,克隆人,群像,人群,额外的人,镜像,飞行,御剑飞行,腾空,云海,天空,云朵,渐变背景,浅蓝灰背景,灰色背景,白色背景,影棚背景,电影运镜,背景场景,镜头推拉,文字水印";
const SUBJECT = "同一名2D游戏小比例剑客sprite,黑发发髻,黄褐外衣,红色裤袍,黑色鞋,手持长剑,严格保持参考图服装和身材比例,全身入镜,不要写实立绘,不要华丽长袍,不要绿色服装";
const SOURCE_RIG_GIF = join(OUT_OFFICIAL, "rig-swordmaster-idle.gif");
const DEATH_RIG_GIF = join(OUT_OFFICIAL, "rig-swordmaster-death.gif");
const SOURCE_IMAGE = join(REVIEW_ROOT, "source-rig.png");
const GREEN_CONFIG = {
  color: [0, 255, 0],
  startDenoise: 0.46,
  endDenoise: 0.66,
};
const ALPHA_CONFIG = {
  threshold: 34,
  feather: 22,
};
const ACTIONS = [
  {
    id: "idle",
    prompt: "原地待机站立,轻微呼吸起伏,头发和衣摆轻微摆动,双脚踩地",
  },
  {
    id: "walk",
    prompt: "原地踏步行走循环,双腿交替迈步,双臂自然摆动,身体轻微上下起伏,双脚踩地",
  },
  {
    id: "attack",
    prompt: "挥剑横劈攻击,持剑手臂大幅向前挥砍,身体前倾发力,剑刃轨迹清楚,双脚踩地",
  },
  {
    id: "hurt",
    prompt: "被击中受击,身体猛地后仰踉跄,单脚后退,手臂失衡摆开,双脚仍贴地",
  },
  {
    id: "death",
    prompt: "中招倒下,身体向后倒地并瘫倒,动作从站立过渡到倒地,不可飞起",
    directEndGif: DEATH_RIG_GIF,
    directEndFrame: 11,
  },
];

mkdirSync(REVIEW_ROOT, { recursive: true });
mkdirSync(OUT_OFFICIAL, { recursive: true });
mkdirSync(OUT_SHOWCASE, { recursive: true });

const gifEncoder = loadGifEncoder();
prepareSourceSpritePng();
const sourceGreenPath = join(REVIEW_ROOT, "source-green.png");
const sourceGreenDataUrl = await createGreenSourceDataUrl(SOURCE_IMAGE, sourceGreenPath);
const reports = [];

for (const action of ACTIONS) {
  reports.push(await regenerateAction(action, sourceGreenDataUrl));
}

const manifest = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  sourceRigGif: relativePath(SOURCE_RIG_GIF),
  sourceImage: relativePath(SOURCE_IMAGE),
  frameCount: FRAME_COUNT,
  green: {
    prompt: GREEN,
    startDenoise: GREEN_CONFIG.startDenoise,
    endDenoise: GREEN_CONFIG.endDenoise,
  },
  actions: reports,
};
writeFileSync(join(REVIEW_ROOT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`\n完成。审查目录: ${relativePath(REVIEW_ROOT)}`);

async function regenerateAction(action, sourceGreenDataUrl) {
  const actionDir = join(REVIEW_ROOT, action.id);
  const startPath = join(actionDir, "start.png");
  const endPath = join(actionDir, "end.png");
  const webmPath = join(OUT_SHOWCASE, `vsprite-sword-${action.id}.webm`);
  const hasLocalVideo = !FORCE && existsSync(startPath) && existsSync(endPath) && existsSync(webmPath);
  if (!hasLocalVideo && existsSync(actionDir)) rmSync(actionDir, { recursive: true, force: true });
  mkdirSync(actionDir, { recursive: true });
  console.log(`\n=== ${action.id} ===`);
  const startPrompt = `${SUBJECT},原地直立站姿,${GREEN}`;
  const endPrompt = `${SUBJECT},${action.prompt},明显动作姿势,动态pose,肢体大幅变化,${GREEN}`;
  const videoPrompt = `${SUBJECT},${action.prompt},固定镜头不移动,单个角色,${GREEN}`;

  if (hasLocalVideo) {
    console.log("  复用已下载的本地 start/end/webm");
  } else if (action.directEndGif) {
    console.log("  ① 使用本地 rig 首帧/尾帧");
    writeFileSync(startPath, readFileSync(sourceGreenPath));
    const rigEndPath = join(actionDir, "end-rig.png");
    prepareRigFramePng(action.directEndGif, action.directEndFrame, rigEndPath);
    const endGreenDataUrl = await createGreenSourceDataUrl(rigEndPath, endPath, { normalizeSubject: true });
    const video = await submitVideoAndWait("② FLF 视频", {
      mode: "2d",
      brief: videoPrompt,
      negativePrompt: NEG,
      assetType: "character",
      style: "production",
      camera: "front",
      preset: "single",
      length: 25,
      fps: 12,
      submit: true,
      imageDataUrl: sourceGreenDataUrl,
      endImageDataUrl: endGreenDataUrl,
    });
    await downloadResult(video, webmPath);
  } else {
    const start = await submit2DAndWait("① 绿幕首帧", {
      mode: "2d",
      brief: startPrompt,
      negativePrompt: NEG,
      assetType: "character",
      style: "production",
      camera: "front",
      preset: "single",
      denoise: GREEN_CONFIG.startDenoise,
      imageDataUrl: sourceGreenDataUrl,
    });
    const startRef = ref(start);
    const end = await submit2DAndWait("② 动作尾帧", {
      mode: "2d",
      brief: endPrompt,
      negativePrompt: NEG,
      assetType: "character",
      style: "production",
      camera: "front",
      preset: "single",
      denoise: GREEN_CONFIG.endDenoise,
      comfyImage: startRef,
    });
    const endRef = ref(end);

    const video = await submitVideoAndWait("③ FLF 视频", {
      mode: "2d",
      brief: videoPrompt,
      negativePrompt: NEG,
      assetType: "character",
      style: "production",
      camera: "front",
      preset: "single",
      length: 25,
      fps: 12,
      submit: true,
      comfyImage: startRef,
      endComfyImage: endRef,
    });

    await downloadResult(start, startPath);
    await downloadResult(end, endPath);
    await downloadResult(video, webmPath);
  }
  const frameReport = await exportVideoSprites({
    action,
    actionDir,
    webmPath,
  });
  const report = {
    id: action.id,
    prompt: action.prompt,
    start: relativePath(startPath),
    end: relativePath(endPath),
    webm: relativePath(webmPath),
    gif: relativePath(frameReport.gifPath),
    sheet: relativePath(frameReport.sheetPath),
    quality: frameReport.quality,
  };
  writeFileSync(join(actionDir, "quality.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`  ✓ ${action.id}: score=${frameReport.quality.score} warnings=${frameReport.quality.warnings.length}`);
  return report;
}

async function exportVideoSprites({ action, actionDir, webmPath }) {
  const originalDir = join(actionDir, "frames/original");
  const transparentDir = join(actionDir, "frames/transparent");
  rmSync(join(actionDir, "frames"), { recursive: true, force: true });
  mkdirSync(originalDir, { recursive: true });
  mkdirSync(transparentDir, { recursive: true });
  const duration = ffprobeDuration(webmPath);
  const frames = [];
  for (let index = 0; index < FRAME_COUNT; index += 1) {
    const time = duration > 0 ? safeFrameTime(duration, index) : 0;
    const originalPath = join(originalDir, `${String(index + 1).padStart(2, "0")}.png`);
    extractVideoFrame(webmPath, originalPath, time, GIF_SIZE);
    const image = await decodePngRgba(readFileSync(originalPath));
    removeGreenScreenRgba(image.data);
    removeEdgeConnectedBackgroundRgba(image.data, image.width, image.height);
    cleanupTransparentPixels(image.data);
    const transparentPath = join(transparentDir, `${String(index + 1).padStart(2, "0")}.png`);
    writeFileSync(transparentPath, Buffer.from(await encodePngRgba(image.width, image.height, image.data)));
    frames.push({
      index,
      label: `frame-${String(index + 1).padStart(2, "0")}`,
      time: round(time),
      path: transparentPath,
      image,
      alpha: measureAlpha(image),
    });
  }

  const sheet = await composeContactSheet(frames, SHEET_CELL, SHEET_COLUMNS);
  const sheetPath = join(OUT_OFFICIAL, `vsprite-sword-${action.id}-sheet.png`);
  writeFileSync(sheetPath, Buffer.from(sheet.bytes));

  const gifPath = join(OUT_OFFICIAL, `vsprite-sword-${action.id}.gif`);
  const gifFrames = frames.map((frame) => ({ imageData: frame.image }));
  const gif = gifEncoder.encodeAnimatedGif(gifFrames, { delay: 90, loop: 0, transparent: true });
  writeFileSync(gifPath, Buffer.from(gif));

  const quality = analyzeFrames(frames);
  return { frames, sheetPath, gifPath, quality };
}

function submit2DAndWait(label, body) {
  console.log(`  ${label}`);
  return submitAndWait("/api/generate/2d", body, "2d");
}

function submitVideoAndWait(label, body) {
  console.log(`  ${label}`);
  return submitAndWait("/api/generate/video-sprite", body, "video-sprite");
}

async function submitAndWait(path, body, kind) {
  const submitted = await api(path, { method: "POST", body: JSON.stringify(body) });
  if (!submitted?.promptId) {
    throw new Error(`提交失败 ${path}: ${submitted?.message || JSON.stringify(submitted).slice(0, 240)}`);
  }
  return await pollJob(submitted.promptId, kind);
}

async function pollJob(promptId, kind) {
  process.stdout.write(`    ${promptId}`);
  for (let attempt = 0; attempt < 260; attempt += 1) {
    await sleep(2500);
    const job = await api(`/api/jobs/${encodeURIComponent(promptId)}?kind=${encodeURIComponent(kind)}`).catch(() => null);
    if (job?.status === "complete" && job?.result?.filename) {
      console.log(" ✓");
      return job.result;
    }
    if (job?.result?.filename) {
      console.log(" ✓");
      return job.result;
    }
    if (job?.status === "error" || job?.status === "failed" || job?.error) {
      throw new Error(job?.message || job?.error || `任务失败 ${promptId}`);
    }
    process.stdout.write(".");
  }
  throw new Error(`任务超时 ${promptId}`);
}

async function api(path, opts = {}) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await fetch(`${BASE}${path}`, {
      ...opts,
      headers: {
        "content-type": "application/json",
        "x-lingji-access-token": TOKEN,
        ...(opts.headers || {}),
      },
    }).catch((error) => ({ networkError: error }));
    if (response.networkError) {
      await sleep(4000);
      continue;
    }
    if (response.status === 429) {
      const retry = Math.min(150, Number(response.headers.get("retry-after")) || 45);
      console.log(`\n    [429] ${retry}s 后重试`);
      await sleep(retry * 1000);
      continue;
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || data?.error || `HTTP ${response.status}`);
    }
    return data;
  }
  throw new Error(`网络重试耗尽: ${path}`);
}

async function downloadResult(result, outputPath) {
  const url = new URL(`${BASE}/api/comfy/view`);
  url.searchParams.set("filename", result.filename);
  if (result.subfolder) url.searchParams.set("subfolder", result.subfolder);
  url.searchParams.set("type", result.type || "output");
  const response = await fetch(url, { headers: { "x-lingji-access-token": TOKEN } });
  if (!response.ok) throw new Error(`下载失败 ${result.filename}: ${response.status}`);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));
  return outputPath;
}

async function createGreenSourceDataUrl(sourcePath, outputPath, options = {}) {
  let image = await decodePngRgba(readFileSync(sourcePath));
  removeEdgeConnectedBackgroundRgba(image.data, image.width, image.height);
  if (options.normalizeSubject) {
    image = normalizeSubjectImage(image, options);
  }
  const composited = new Uint8Array(image.width * image.height * 4);
  for (let offset = 0; offset < image.data.length; offset += 4) {
    const alpha = image.data[offset + 3] / 255;
    composited[offset] = Math.round((image.data[offset] * alpha) + (GREEN_CONFIG.color[0] * (1 - alpha)));
    composited[offset + 1] = Math.round((image.data[offset + 1] * alpha) + (GREEN_CONFIG.color[1] * (1 - alpha)));
    composited[offset + 2] = Math.round((image.data[offset + 2] * alpha) + (GREEN_CONFIG.color[2] * (1 - alpha)));
    composited[offset + 3] = 255;
  }
  const bytes = await encodePngRgba(image.width, image.height, composited);
  writeFileSync(outputPath, Buffer.from(bytes));
  return `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
}

function normalizeSubjectImage(image, options = {}) {
  const alpha = measureAlpha(image);
  const bounds = alpha.bounds;
  if (!bounds) return image;
  const maxRatio = Number(options.maxSubjectRatio) || 0.76;
  const target = new Uint8Array(image.width * image.height * 4);
  const scale = Math.min(
    (image.width * maxRatio) / bounds.width,
    (image.height * maxRatio) / bounds.height,
    1.2,
  );
  const drawWidth = Math.max(1, Math.round(bounds.width * scale));
  const drawHeight = Math.max(1, Math.round(bounds.height * scale));
  const drawX = Math.round((image.width - drawWidth) / 2);
  const drawY = Math.round((image.height - drawHeight) / 2);
  for (let y = 0; y < drawHeight; y += 1) {
    const sy = bounds.y + Math.min(bounds.height - 1, Math.floor(y / scale));
    for (let x = 0; x < drawWidth; x += 1) {
      const sx = bounds.x + Math.min(bounds.width - 1, Math.floor(x / scale));
      const sourceOffset = ((sy * image.width) + sx) * 4;
      const targetOffset = (((drawY + y) * image.width) + drawX + x) * 4;
      target[targetOffset] = image.data[sourceOffset];
      target[targetOffset + 1] = image.data[sourceOffset + 1];
      target[targetOffset + 2] = image.data[sourceOffset + 2];
      target[targetOffset + 3] = image.data[sourceOffset + 3];
    }
  }
  return { width: image.width, height: image.height, data: target };
}

function extractVideoFrame(webmPath, outputPath, time, size) {
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-ss",
    String(Math.max(0, time)),
    "-i",
    webmPath,
    "-frames:v",
    "1",
    "-vf",
    `scale=${size}:${size}:flags=lanczos`,
    outputPath,
  ]);
  if (!existsSync(outputPath)) {
    execFileSync("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-sseof",
      "-0.08",
      "-i",
      webmPath,
      "-frames:v",
      "1",
      "-vf",
      `scale=${size}:${size}:flags=lanczos`,
      outputPath,
    ]);
  }
}

function safeFrameTime(duration, index) {
  const safeEnd = Math.max(0, duration - 0.12);
  const t = duration * ((index + 0.5) / FRAME_COUNT);
  return Math.max(0, Math.min(safeEnd, t));
}

function removeGreenScreenRgba(data) {
  for (let offset = 0; offset < data.length; offset += 4) {
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const greenDominance = g - Math.max(r, b);
    const distance = Math.hypot(r - GREEN_CONFIG.color[0], g - GREEN_CONFIG.color[1], b - GREEN_CONFIG.color[2]);
    if (greenDominance < 22 && distance > 150) {
      if (data[offset + 3] > 0 && greenDominance > 12) {
        data[offset + 1] = Math.min(data[offset + 1], Math.max(data[offset], data[offset + 2]) + 8);
      }
      continue;
    }
    const alpha = distance <= 96 || greenDominance > 58
      ? 0
      : Math.round(255 * Math.min(1, Math.max(0, (distance - 96) / 54)));
    data[offset + 3] = Math.min(data[offset + 3], alpha);
    if (data[offset + 3] <= 2) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
    }
  }
}

function ffprobeDuration(path) {
  const text = execFileSync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    path,
  ], { encoding: "utf8" }).trim();
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

async function composeContactSheet(frames, cell, columns) {
  const rows = Math.ceil(frames.length / columns);
  const width = columns * cell;
  const height = rows * cell;
  const sheet = new Uint8Array(width * height * 4);
  for (const [index, frame] of frames.entries()) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    blitContain({
      target: sheet,
      targetWidth: width,
      targetHeight: height,
      source: frame.image.data,
      sourceWidth: frame.image.width,
      sourceHeight: frame.image.height,
      x: column * cell,
      y: row * cell,
      width: cell,
      height: cell,
    });
  }
  return { bytes: await encodePngRgba(width, height, sheet), width, height, rows, columns };
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

  const maxDistance = ALPHA_CONFIG.threshold + ALPHA_CONFIG.feather;
  const visited = new Uint8Array(totalPixels);
  const queue = new Uint32Array(totalPixels);
  let read = 0;
  let write = 0;
  const enqueue = (index) => {
    if (visited[index]) return;
    const offset = index * 4;
    const distance = Math.hypot(data[offset] - bg.r, data[offset + 1] - bg.g, data[offset + 2] - bg.b);
    if (distance > maxDistance) return;
    visited[index] = 1;
    queue[write] = index;
    write += 1;
  };
  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }
  while (read < write) {
    const index = queue[read];
    read += 1;
    const x = index % width;
    const y = Math.floor(index / width);
    const offset = index * 4;
    const distance = Math.hypot(data[offset] - bg.r, data[offset + 1] - bg.g, data[offset + 2] - bg.b);
    const alpha = distance <= ALPHA_CONFIG.threshold
      ? 0
      : Math.round(255 * ((distance - ALPHA_CONFIG.threshold) / ALPHA_CONFIG.feather));
    data[offset + 3] = Math.min(data[offset + 3], alpha);
    if (data[offset + 3] <= 2) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
    }
    if (x > 0) enqueue(index - 1);
    if (x < width - 1) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y < height - 1) enqueue(index + width);
  }
}

function cleanupTransparentPixels(data) {
  for (let offset = 0; offset < data.length; offset += 4) {
    const alpha = data[offset + 3];
    if (alpha <= 28) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 0;
    } else if (alpha >= 232) {
      data[offset + 3] = 255;
    }
  }
}

function measureAlpha(image) {
  let visible = 0;
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const alpha = image.data[((y * image.width) + x) * 4 + 3];
      if (alpha <= 24) continue;
      visible += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  const bounds = maxX >= minX
    ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
    : null;
  return {
    coverage: round(visible / (image.width * image.height)),
    bounds,
    edgeMargin: bounds ? Math.min(minX, minY, image.width - 1 - maxX, image.height - 1 - maxY) : 0,
    boundsAreaRatio: bounds ? round((bounds.width * bounds.height) / (image.width * image.height)) : 0,
  };
}

function analyzeFrames(frames) {
  const warnings = [];
  for (const frame of frames) {
    if (!frame.alpha.bounds) {
      warnings.push({ severity: "fail", frame: frame.label, message: "未检测到主体" });
    } else {
      if (frame.alpha.coverage < 0.018) warnings.push({ severity: "warn", frame: frame.label, message: "主体占比偏低" });
      if (frame.alpha.boundsAreaRatio > 0.78) warnings.push({ severity: "warn", frame: frame.label, message: "主体过满" });
      if (frame.alpha.edgeMargin <= 2) warnings.push({ severity: "warn", frame: frame.label, message: "主体触边" });
    }
  }
  const deltas = [];
  for (let index = 1; index < frames.length; index += 1) {
    deltas.push(frameDelta(frames[index - 1].image, frames[index].image));
  }
  const avgDelta = average(deltas);
  if (avgDelta < 0.012) warnings.push({ severity: "warn", frame: "motion", message: "动作变化偏弱" });
  if (avgDelta > 0.42) warnings.push({ severity: "warn", frame: "motion", message: "动作跳变偏大" });
  const failCount = warnings.filter((item) => item.severity === "fail").length;
  const warnCount = warnings.length - failCount;
  return {
    score: Math.max(0, 100 - failCount * 22 - warnCount * 8),
    status: failCount ? "fail" : warnCount ? "warn" : "pass",
    frameCount: frames.length,
    averageCoverage: round(average(frames.map((frame) => frame.alpha.coverage))),
    averageBounds: round(average(frames.map((frame) => frame.alpha.boundsAreaRatio))),
    averageFrameDelta: round(avgDelta),
    warnings,
    frames: frames.map((frame) => ({
      label: frame.label,
      time: frame.time,
      alpha: frame.alpha,
      path: relativePath(frame.path),
    })),
  };
}

function frameDelta(a, b) {
  const stride = 3;
  let total = 0;
  let samples = 0;
  for (let y = 0; y < a.height; y += stride) {
    for (let x = 0; x < a.width; x += stride) {
      const offset = ((y * a.width) + x) * 4;
      const alphaA = a.data[offset + 3] / 255;
      const alphaB = b.data[offset + 3] / 255;
      const visible = Math.max(alphaA, alphaB);
      if (visible <= 0.08) continue;
      total += Math.abs(alphaA - alphaB) * 0.65
        + ((Math.abs(a.data[offset] - b.data[offset])
        + Math.abs(a.data[offset + 1] - b.data[offset + 1])
        + Math.abs(a.data[offset + 2] - b.data[offset + 2])) / 765) * visible * 0.35;
      samples += 1;
    }
  }
  return samples ? total / samples : 0;
}

function blitContain({ target, targetWidth, targetHeight, source, sourceWidth, sourceHeight, x, y, width, height }) {
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = Math.max(1, Math.round(sourceWidth * scale));
  const drawHeight = Math.max(1, Math.round(sourceHeight * scale));
  const dx0 = x + Math.floor((width - drawWidth) / 2);
  const dy0 = y + Math.floor((height - drawHeight) / 2);
  for (let dy = 0; dy < drawHeight; dy += 1) {
    const sy = Math.min(sourceHeight - 1, Math.floor(dy / scale));
    for (let dx = 0; dx < drawWidth; dx += 1) {
      const sx = Math.min(sourceWidth - 1, Math.floor(dx / scale));
      const sourceOffset = ((sy * sourceWidth) + sx) * 4;
      const targetOffset = (((dy0 + dy) * targetWidth) + dx0 + dx) * 4;
      target[targetOffset] = source[sourceOffset];
      target[targetOffset + 1] = source[sourceOffset + 1];
      target[targetOffset + 2] = source[sourceOffset + 2];
      target[targetOffset + 3] = source[sourceOffset + 3];
    }
  }
}

function ref(result) {
  return {
    filename: result.filename,
    subfolder: result.subfolder || "",
    type: result.type || "output",
  };
}

function loadGifEncoder() {
  const source = readFileSync(join(ROOT, "ui_kits/generator/gif-encoder.js"), "utf8");
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.window.LingjiGifEncoder;
}

function prepareSourceSpritePng() {
  prepareRigFramePng(SOURCE_RIG_GIF, 0, SOURCE_IMAGE);
}

function prepareRigFramePng(gifPath, frame, outputPath) {
  execFileSync("magick", [
    `${gifPath}[${frame}]`,
    "-coalesce",
    "-alpha",
    "on",
    `PNG32:${outputPath}`,
  ]);
}

function readToken() {
  const envPath = join(ROOT, ".dev.vars");
  if (!existsSync(envPath)) throw new Error(".dev.vars 不存在,无法读取 GENERATOR_ACCESS_TOKEN");
  const match = readFileSync(envPath, "utf8").match(/^GENERATOR_ACCESS_TOKEN=(.*)$/m);
  if (!match) throw new Error(".dev.vars 缺少 GENERATOR_ACCESS_TOKEN");
  return match[1].trim().replace(/^"|"$/g, "");
}

function relativePath(path) {
  return path.startsWith(ROOT) ? path.slice(ROOT.length).replace(/^\/+/, "") : path;
}

function average(values) {
  const list = values.filter(Number.isFinite);
  return list.length ? list.reduce((sum, value) => sum + value, 0) / list.length : 0;
}

function round(value) {
  return Math.round(Number(value || 0) * 10000) / 10000;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
