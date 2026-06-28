#!/usr/bin/env node
// 纯 JS Spine region-rig 渲染器:吃 SAM3 分层导出的 parts/*.png + skeleton.json,
// 按骨骼世界变换把各部件贴回画布,逐帧合成 → 输出循环动画 GIF。
// 这是产品里此前缺失的一环:rig 早已生成,却没有任何地方真正驱动播放它。
//
// 用法: node scripts/render-spine-rig.mjs <rigDir> <outGif> [--mode setup|clip|idle|walk|attack] [--size 512] [--fps 12] [--seconds 1.2]
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { decodePngRgba, encodePngRgba } from "../src/lib/binary.js";

const PARTS = ["head", "torso", "hips", "arm_l", "arm_r", "leg_l", "leg_r"];

// ---- GIF 编码器(浏览器端 gif-encoder.js,在 vm 里跑) ----
function loadGifEncoder() {
  const src = readFileSync(new URL("../ui_kits/generator/gif-encoder.js", import.meta.url), "utf8");
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window.LingjiGifEncoder;
}

// ---- 2x3 仿射矩阵 [a,b,c,d,tx,ty]: x'=a*x+c*y+tx, y'=b*x+d*y+ty ----
const I = [1, 0, 0, 1, 0, 0];
const T = (x, y) => [1, 0, 0, 1, x, y];
const S = (x, y) => [x, 0, 0, y, 0, 0];
const R = (deg) => { const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [c, s, -s, c, 0, 0]; };
function compose(m, n) { // 先 n 后 m
  return [
    m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}
function invert(m) {
  const det = m[0] * m[3] - m[1] * m[2];
  const id = 1 / det;
  const a = m[3] * id, b = -m[1] * id, c = -m[2] * id, d = m[0] * id;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
}
const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

// ---- 关键帧采样(线性插值, loop) ----
function sampleTrack(keys, t, fields, defaults) {
  if (!keys || !keys.length) return defaults.slice();
  if (t <= keys[0].time) return fields.map((f, i) => keys[0][f] ?? defaults[i]);
  const last = keys[keys.length - 1];
  if (t >= last.time) return fields.map((f, i) => last[f] ?? defaults[i]);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t >= a.time && t <= b.time) {
      const u = (t - a.time) / (b.time - a.time || 1);
      return fields.map((f, i2) => {
        const va = a[f] ?? defaults[i2], vb = b[f] ?? defaults[i2];
        return va + (vb - va) * u;
      });
    }
  }
  return fields.map((f, i) => last[f] ?? defaults[i]);
}

// ---- 计算每根骨在某时刻的世界矩阵 ----
function boneWorlds(skel, animBones, t) {
  const byName = {};
  skel.bones.forEach((b) => { byName[b.name] = b; });
  const world = {};
  for (const b of skel.bones) {
    const setupRot = b.rotation || 0, setupX = b.x || 0, setupY = b.y || 0;
    const setupSX = b.scaleX || 1, setupSY = b.scaleY || 1;
    let rot = setupRot, x = setupX, y = setupY, sx = setupSX, sy = setupSY;
    const tl = animBones && animBones[b.name];
    if (tl) {
      if (tl.rotate) rot = setupRot + sampleTrack(tl.rotate, t, ["angle"], [0])[0];
      if (tl.translate) { const [dx, dy] = sampleTrack(tl.translate, t, ["x", "y"], [0, 0]); x = setupX + dx; y = setupY + dy; }
      if (tl.scale) { const [scx, scy] = sampleTrack(tl.scale, t, ["x", "y"], [1, 1]); sx = setupSX * scx; sy = setupSY * scy; }
    }
    const local = compose(compose(T(x, y), R(rot)), S(sx, sy));
    const parent = b.parent ? world[b.parent] : I;
    world[b.name] = compose(parent, local);
  }
  return world;
}

function drawRegion(canvas, W, H, part, F) {
  // F: (u,v 像素) -> 画布像素。逆映射采样。
  const { data, width: pw, height: ph } = part.img;
  const corners = [ap(F, 0, 0), ap(F, pw, 0), ap(F, 0, ph), ap(F, pw, ph)];
  const minX = Math.max(0, Math.floor(Math.min(...corners.map((c) => c[0]))));
  const maxX = Math.min(W - 1, Math.ceil(Math.max(...corners.map((c) => c[0]))));
  const minY = Math.max(0, Math.floor(Math.min(...corners.map((c) => c[1]))));
  const maxY = Math.min(H - 1, Math.ceil(Math.max(...corners.map((c) => c[1]))));
  const Finv = invert(F);
  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const [u, v] = ap(Finv, px + 0.5, py + 0.5);
      if (u < 0 || u >= pw || v < 0 || v >= ph) continue;
      const sx = Math.min(pw - 1, Math.max(0, Math.round(u - 0.5)));
      const sy = Math.min(ph - 1, Math.max(0, Math.round(v - 0.5)));
      const si = (sy * pw + sx) * 4;
      const sa = data[si + 3];
      if (!sa) continue;
      const di = (py * W + px) * 4;
      const a = sa / 255, ia = 1 - a;
      canvas[di] = data[si] * a + canvas[di] * ia;
      canvas[di + 1] = data[si + 1] * a + canvas[di + 1] * ia;
      canvas[di + 2] = data[si + 2] * a + canvas[di + 2] * ia;
      canvas[di + 3] = Math.min(255, sa + canvas[di + 3] * ia);
    }
  }
}

function renderFrame(skel, atts, slots, parts, animBones, t, W, H, scaleFit) {
  const world = boneWorlds(skel, animBones, t);
  const canvas = new Uint8ClampedArray(W * H * 4); // 透明
  // 世界(spine y-up,原点居中)-> 512 图像(y-down):imgX=x+256, imgY=256-y;再按 scaleFit 缩放到 W。
  const ox = (skel.skeleton?.width || 512) / 2, oy = (skel.skeleton?.height || 512) / 2;
  const W2I = [scaleFit, 0, 0, -scaleFit, (W / 2) - ox * scaleFit + ox * scaleFit, 0]; // placeholder, set below
  // 直接构造: imgPx = (worldX + ox) * scaleFit ; imgPy = (oy - worldY) * scaleFit
  const toImg = [scaleFit, 0, 0, -scaleFit, ox * scaleFit, oy * scaleFit];
  for (const slot of slots) {
    const att = atts[slot.name] && atts[slot.name][slot.attachment || slot.name];
    if (!att) continue;
    const part = parts[slot.name];
    if (!part) continue;
    const bw = world[slot.bone];
    if (!bw) continue;
    const w = att.width, h = att.height, attX = att.x || 0, attY = att.y || 0, attRot = att.rotation || 0;
    // region 像素 (u,v) -> bone-local: localX = attX - w/2 + u ; localY = attY + h/2 - v (纹理 y-down)
    const L = compose(T(attX, attY), compose(R(attRot), T(-w / 2, h / 2 - h))); // see note
    // 上式等价: 先把像素原点移到 region 中心、翻 y,再加 attX/attY、attRot。下面用更直接的构造覆盖:
    const local = [1, 0, 0, -1, attX - w / 2, attY + h / 2];
    const F = compose(toImg, compose(bw, local));
    drawRegion(canvas, W, H, part, F);
  }
  return canvas;
}

function main() {
  const [rigDir, outGif, ...rest] = process.argv.slice(2);
  if (!rigDir || !outGif) { console.error("用法: render-spine-rig.mjs <rigDir> <outGif> [--mode ...] [--size N] [--fps N] [--seconds N]"); process.exit(1); }
  const opt = {};
  for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, "")] = rest[i + 1];
  const mode = opt.mode || "clip";
  const W = Number(opt.size || 512), H = W, fps = Number(opt.fps || 12), seconds = Number(opt.seconds || 1.2);
  const scaleFit = W / 512;

  const skel = JSON.parse(readFileSync(join(rigDir, "skeleton.json"), "utf8"));
  const slots = skel.slots;
  const skin = Array.isArray(skel.skins) ? skel.skins[0] : skel.skins;
  const atts = skin.attachments || skin.default || skin;
  const enc = loadGifEncoder();

  const parts = {};
  return Promise.all(PARTS.map(async (p) => {
    const img = await decodePngRgba(readFileSync(join(rigDir, "parts", `${p}.png`)));
    parts[p] = { img };
  })).then(() => {
    let animBones = null, duration = 0;
    if (mode !== "setup") {
      const animName = Object.keys(skel.animations)[0];
      animBones = skel.animations[animName].bones;
      for (const tl of Object.values(animBones)) for (const keys of Object.values(tl)) for (const k of keys) duration = Math.max(duration, k.time || 0);
    }
    if (mode === "setup") {
      const frame = renderFrame(skel, atts, slots, parts, null, 0, W, H, scaleFit);
      return encodePngRgba(W, H, Uint8Array.from(frame)).then((png) => { writeFileSync(outGif.replace(/\.gif$/, ".png"), Buffer.from(png)); console.log("setup ->", outGif.replace(/\.gif$/, ".png")); });
    }
    const nframes = Math.max(2, Math.round(fps * seconds));
    const frames = [];
    for (let i = 0; i < nframes; i++) {
      const t = (i / nframes) * duration;
      const buf = renderFrame(skel, atts, slots, parts, animBones, t, W, H, scaleFit);
      frames.push({ imageData: { data: buf, width: W, height: H } });
    }
    const gif = enc.encodeAnimatedGif(frames, { delay: Math.round(1000 / fps), loop: 0, transparent: false });
    writeFileSync(outGif, Buffer.from(gif));
    console.log(`✓ ${outGif} (${nframes} 帧, ${Math.round(gif.length / 1024)}KB, dur=${duration}s)`);
  });
}

main();
