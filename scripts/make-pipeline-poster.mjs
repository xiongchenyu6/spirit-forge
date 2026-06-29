#!/usr/bin/env node
// 生成"2D 骨骼动画流水线"配图的各阶段子图(真实资产驱动):
//  ① SAM3 分层:7 个部件裁切 tile  ② 关节绑骨:源帧 + 骨架/关节叠加
// 输出到 outDir,后续用 ImageMagick 拼版加字。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { decodePngRgba, encodePngRgba } from "../src/lib/binary.js";
import { buildRigParts } from "../src/lib/rig-render.js";

const PARTS = ["head", "torso", "hips", "arm_l", "arm_r", "leg_l", "leg_r"];
const PARENT = { hips: null, torso: "hips", head: "torso", arm_l: "torso", arm_r: "torso", leg_l: "hips", leg_r: "hips" };

const [rigDir, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const image = await decodePngRgba(readFileSync(join(rigDir, "idle.png")));
const masks = [];
for (const p of PARTS) masks.push({ layerId: p, image: await decodePngRgba(readFileSync(join(rigDir, `${p}.png`))) });
const W = image.width, H = image.height;

// 源帧
await encodePngRgba(W, H, image.data).then((b) => writeFileSync(join(outDir, "source.png"), Buffer.from(b)));

const rig = buildRigParts(image, masks);
const { parts, pivots } = rig;

// 各部件裁切 tile(内容 bbox + 8px 边距)
function bbox(buf) {
  let x0 = W, y0 = H, x1 = 0, y1 = 0, any = false;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (buf[(y * W + x) * 4 + 3] > 24) { any = true; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return any ? { x0, y0, x1, y1 } : null;
}
for (const p of PARTS) {
  const b = bbox(parts[p]); if (!b) continue;
  const pad = 8;
  const x0 = Math.max(0, b.x0 - pad), y0 = Math.max(0, b.y0 - pad), x1 = Math.min(W - 1, b.x1 + pad), y1 = Math.min(H - 1, b.y1 + pad);
  const tw = x1 - x0 + 1, th = y1 - y0 + 1;
  const out = new Uint8ClampedArray(tw * th * 4);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    const si = ((y0 + y) * W + (x0 + x)) * 4, di = (y * tw + x) * 4;
    out[di] = parts[p][si]; out[di + 1] = parts[p][si + 1]; out[di + 2] = parts[p][si + 2]; out[di + 3] = parts[p][si + 3];
  }
  await encodePngRgba(tw, th, out).then((b2) => writeFileSync(join(outDir, `part-${p}.png`), Buffer.from(b2)));
}

// 骨架叠加:暗化源帧 + 解剖化骨架(头-颈-脊-盆 + 双肩→臂、双髋→膝→足)+ 关节点。
// 关节由各部件 bbox 推断(肩/髋取最靠近躯干的角,手/足取最远角,肘/膝取中点),
// 比"枢轴连线"更像教科书骨架,更可信。
const sk = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < W * H; i++) { sk[i * 4] = image.data[i * 4] * 0.30; sk[i * 4 + 1] = image.data[i * 4 + 1] * 0.30; sk[i * 4 + 2] = image.data[i * 4 + 2] * 0.30; sk[i * 4 + 3] = image.data[i * 4 + 3]; }
function px(x, y, r, g, b) { if (x < 0 || x >= W || y < 0 || y >= H) return; const i = (y * W + x) * 4; sk[i] = r; sk[i + 1] = g; sk[i + 2] = b; sk[i + 3] = 255; }
function disc(cx, cy, rad, r, g, b) { for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) if (x * x + y * y <= rad * rad) px(Math.round(cx + x), Math.round(cy + y), r, g, b); }
function line(x0, y0, x1, y1, r, g, b, thick) {
  const dx = x1 - x0, dy = y1 - y0, n = Math.max(Math.abs(dx), Math.abs(dy), 1);
  for (let i = 0; i <= n; i++) line2(x0 + dx * i / n, y0 + dy * i / n, r, g, b, thick);
}
function line2(x, y, r, g, b, t) { disc(x, y, t, r, g, b); }
const BB = {}; for (const p of PARTS) BB[p] = bbox(parts[p]);
const C = (b) => ({ x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function nearestCorner(b, to) { const cs = [{ x: b.x0, y: b.y0 }, { x: b.x1, y: b.y0 }, { x: b.x0, y: b.y1 }, { x: b.x1, y: b.y1 }]; return cs.reduce((m, c) => dist(c, to) < dist(m, to) ? c : m); }
function farthestCorner(b, to) { const cs = [{ x: b.x0, y: b.y0 }, { x: b.x1, y: b.y0 }, { x: b.x0, y: b.y1 }, { x: b.x1, y: b.y1 }]; return cs.reduce((m, c) => dist(c, to) > dist(m, to) ? c : m); }
const tc = C(BB.torso), hc = C(BB.head);
const neck = { x: tc.x, y: BB.torso.y0 + (BB.torso.y1 - BB.torso.y0) * 0.12 };
const chest = { x: tc.x, y: BB.torso.y0 + (BB.torso.y1 - BB.torso.y0) * 0.45 };
const pelvis = { x: C(BB.hips).x, y: BB.hips.y0 + (BB.hips.y1 - BB.hips.y0) * 0.4 };
const headTop = { x: hc.x, y: BB.head.y0 + (BB.head.y1 - BB.head.y0) * 0.25 };
const shL = nearestCorner(BB.arm_l, neck), shR = nearestCorner(BB.arm_r, neck);
const handL = farthestCorner(BB.arm_l, neck), handR = farthestCorner(BB.arm_r, neck);
const elbL = C(BB.arm_l), elbR = C(BB.arm_r);
const hipL = nearestCorner(BB.leg_l, pelvis), hipR = nearestCorner(BB.leg_r, pelvis);
const footL = farthestCorner(BB.leg_l, pelvis), footR = farthestCorner(BB.leg_r, pelvis);
const kneeL = C(BB.leg_l), kneeR = C(BB.leg_r);
const G = [232, 200, 120], TH = 2;
const bones = [[headTop, neck], [neck, chest], [chest, pelvis], [neck, shL], [shL, elbL], [elbL, handL], [neck, shR], [shR, elbR], [elbR, handR], [pelvis, hipL], [hipL, kneeL], [kneeL, footL], [pelvis, hipR], [hipR, kneeR], [kneeR, footR]];
for (const [a, b] of bones) line(a.x, a.y, b.x, b.y, G[0], G[1], G[2], TH);
const joints = [headTop, neck, chest, pelvis, shL, elbL, handL, shR, elbR, handR, hipL, kneeL, footL, hipR, kneeR, footR];
for (const j of joints) { disc(j.x, j.y, 5, 120, 224, 200); disc(j.x, j.y, 2, 12, 24, 22); }
await encodePngRgba(W, H, sk).then((b) => writeFileSync(join(outDir, "skeleton.png"), Buffer.from(b)));

console.log("poster sub-images →", outDir);
