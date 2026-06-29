// rig-render.js — 把 SAM3 全幅分层(mask × 源帧)按关节枢轴做层级骨骼动画,
// 逐帧合成循环 GIF。Worker 内运行,补上"绑骨→驱动播放"里缺失的播放环节。
//
// 全幅切图天然落原位,叠加即还原角色;动画 = 每部件绕关节(pivot)旋转,
// 子部件继承父级世界变换(转躯干带动头/手臂)。输入 image/masks 均已解码。
import { encodeAnimatedGif } from "./gif-encoder.js";

const PARTS = ["head", "torso", "hips", "arm_l", "arm_r", "leg_l", "leg_r"];
const DRAW_ORDER = ["leg_l", "leg_r", "hips", "torso", "arm_l", "arm_r", "head"];
const PARENT = { hips: "root", torso: "hips", head: "torso", arm_l: "torso", arm_r: "torso", leg_l: "hips", leg_r: "hips" };

export const RIG_CLIPS = ["idle", "walk", "attack", "hurt", "death"];

// 仿射 [a,b,c,d,tx,ty]: x'=a*x+c*y+tx, y'=b*x+d*y+ty
const T = (x, y) => [1, 0, 0, 1, x, y];
const Rm = (deg) => { const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [c, s, -s, c, 0, 0]; };
const Sm = (x, y) => [x, 0, 0, y, 0, 0];
const I = [1, 0, 0, 1, 0, 0];
function mul(m, n) {
  return [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]];
}
function invert(m) { const det = m[0]*m[3]-m[1]*m[2], id = 1/det, a=m[3]*id, b=-m[1]*id, c=-m[2]*id, d=m[0]*id; return [a,b,c,d,-(a*m[4]+c*m[5]),-(b*m[4]+d*m[5])]; }
const ap = (m, x, y) => [m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]];
const around = (px, py, deg, sx = 1, sy = 1, dx = 0, dy = 0) => mul(T(px + dx, py + dy), mul(Rm(deg), mul(Sm(sx, sy), T(-px, -py))));

function contentBBox(part, W, H) {
  let minX = W, minY = H, maxX = 0, maxY = 0, any = false;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (part[(y * W + x) * 4 + 3] > 24) { any = true; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  return any ? { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 } : null;
}

const lerp = (a, b, u) => a + (b - a) * u;
function sample(track, t) {
  const d = { rot: 0, dx: 0, dy: 0, sx: 1, sy: 1 };
  if (!track || !track.length) return d;
  if (t <= track[0].t) return { ...d, ...track[0] };
  const last = track[track.length - 1];
  if (t >= last.t) return { ...d, ...last };
  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i], b = track[i + 1];
    if (t >= a.t && t <= b.t) {
      const u = (t - a.t) / (b.t - a.t || 1);
      return { rot: lerp(a.rot ?? 0, b.rot ?? 0, u), dx: lerp(a.dx ?? 0, b.dx ?? 0, u), dy: lerp(a.dy ?? 0, b.dy ?? 0, u), sx: lerp(a.sx ?? 1, b.sx ?? 1, u), sy: lerp(a.sy ?? 1, b.sy ?? 1, u) };
    }
  }
  return d;
}

function drawPart(canvas, W, H, part, F, bilinear) {
  const Fi = invert(F);
  const corners = [ap(F, 0, 0), ap(F, W, 0), ap(F, 0, H), ap(F, W, H)];
  const minX = Math.max(0, Math.floor(Math.min(...corners.map((c) => c[0]))));
  const maxX = Math.min(W - 1, Math.ceil(Math.max(...corners.map((c) => c[0]))));
  const minY = Math.max(0, Math.floor(Math.min(...corners.map((c) => c[1]))));
  const maxY = Math.min(H - 1, Math.ceil(Math.max(...corners.map((c) => c[1]))));
  for (let py = minY; py <= maxY; py++) for (let px = minX; px <= maxX; px++) {
    const [u, v] = ap(Fi, px + 0.5, py + 0.5);
    if (u < 0 || u >= W || v < 0 || v >= H) continue;
    let r, g, b, a;
    if (bilinear) {
      const x0 = Math.floor(u - 0.5), y0 = Math.floor(v - 0.5), fx = (u - 0.5) - x0, fy = (v - 0.5) - y0;
      r = g = b = a = 0;
      for (let k = 0; k < 4; k++) {
        const xx = Math.min(W - 1, Math.max(0, x0 + (k & 1))), yy = Math.min(H - 1, Math.max(0, y0 + (k >> 1)));
        const wgt = ((k & 1) ? fx : 1 - fx) * ((k >> 1) ? fy : 1 - fy);
        const si = (yy * W + xx) * 4, al = part[si + 3] * wgt;
        r += part[si] * al; g += part[si + 1] * al; b += part[si + 2] * al; a += al;
      }
      if (a <= 0) continue; r /= a; g /= a; b /= a;
    } else {
      const sx = Math.min(W - 1, Math.max(0, Math.round(u - 0.5))), sy = Math.min(H - 1, Math.max(0, Math.round(v - 0.5)));
      const si = (sy * W + sx) * 4;
      a = part[si + 3]; if (a <= 0) continue; r = part[si]; g = part[si + 1]; b = part[si + 2];
    }
    const A = Math.min(255, a) / 255, di = (py * W + px) * 4, ia = 1 - A;
    canvas[di] = r * A + canvas[di] * ia; canvas[di + 1] = g * A + canvas[di + 1] * ia; canvas[di + 2] = b * A + canvas[di + 2] * ia; canvas[di + 3] = Math.min(255, a + canvas[di + 3] * ia);
  }
}

function worldTransforms(pivots, poseByPart, rootDx, rootDy) {
  const world = { root: T(rootDx, rootDy) };
  function compute(name) {
    if (world[name]) return world[name];
    const parent = PARENT[name] || "root";
    const pw = world[parent] || compute(parent);
    const p = pivots[name], po = poseByPart[name] || {};
    if (!p) { world[name] = pw; return pw; }
    world[name] = mul(pw, around(p.x, p.y, po.rot || 0, po.sx || 1, po.sy || 1, po.dx || 0, po.dy || 0));
    return world[name];
  }
  for (const n of PARTS) compute(n);
  return world;
}

const breathe = (amp) => [{ t: 0, sy: 1 }, { t: 0.5, sy: 1 + amp }, { t: 1, sy: 1 }];
const CLIPS = {
  idle: { dur: 1.6, fps: 12, root: [{ t: 0, dy: 0 }, { t: 0.5, dy: -2 }, { t: 1, dy: 0 }], pose: {
    torso: breathe(0.025), head: [{ t: 0, rot: 0 }, { t: 0.5, rot: -1.5 }, { t: 1, rot: 0 }],
    arm_l: [{ t: 0, rot: 0 }, { t: 0.5, rot: 3 }, { t: 1, rot: 0 }], arm_r: [{ t: 0, rot: 0 }, { t: 0.5, rot: -3 }, { t: 1, rot: 0 }],
  } },
  walk: { dur: 0.8, fps: 14, root: [{ t: 0, dy: 0 }, { t: 0.25, dy: -6 }, { t: 0.5, dy: 0 }, { t: 0.75, dy: -6 }, { t: 1, dy: 0 }], pose: {
    leg_l: [{ t: 0, rot: 28 }, { t: 0.5, rot: -28 }, { t: 1, rot: 28 }], leg_r: [{ t: 0, rot: -28 }, { t: 0.5, rot: 28 }, { t: 1, rot: -28 }],
    arm_l: [{ t: 0, rot: -24 }, { t: 0.5, rot: 24 }, { t: 1, rot: -24 }], arm_r: [{ t: 0, rot: 24 }, { t: 0.5, rot: -24 }, { t: 1, rot: 24 }],
    torso: [{ t: 0, rot: -3 }, { t: 0.25, rot: 3 }, { t: 0.5, rot: -3 }, { t: 0.75, rot: 3 }, { t: 1, rot: -3 }],
    head: [{ t: 0, rot: 2 }, { t: 0.5, rot: -2 }, { t: 1, rot: 2 }],
  } },
  attack: { dur: 0.9, fps: 14, root: [{ t: 0, dx: 0 }, { t: 0.4, dx: -7 }, { t: 0.58, dx: 16 }, { t: 1, dx: 0 }], pose: {
    arm_r: [{ t: 0, rot: 0 }, { t: 0.4, rot: -85 }, { t: 0.58, rot: 72 }, { t: 0.8, rot: 46 }, { t: 1, rot: 0 }],
    arm_l: [{ t: 0, rot: 0 }, { t: 0.4, rot: 28 }, { t: 0.58, rot: -18 }, { t: 1, rot: 0 }],
    torso: [{ t: 0, rot: 0 }, { t: 0.4, rot: -16 }, { t: 0.58, rot: 20 }, { t: 1, rot: 0 }],
    head: [{ t: 0, rot: 0 }, { t: 0.4, rot: -8 }, { t: 0.58, rot: 12 }, { t: 1, rot: 0 }],
    leg_r: [{ t: 0, rot: 0 }, { t: 0.58, rot: -16 }, { t: 1, rot: 0 }],
  } },
  // 受击:快速后仰回弹(knockback)。
  hurt: { dur: 0.6, fps: 14, root: [{ t: 0, dx: 0 }, { t: 0.18, dx: -14 }, { t: 0.5, dx: -4 }, { t: 1, dx: 0 }], pose: {
    torso: [{ t: 0, rot: 0 }, { t: 0.18, rot: 22 }, { t: 0.5, rot: 8 }, { t: 1, rot: 0 }],
    head: [{ t: 0, rot: 0 }, { t: 0.18, rot: 26 }, { t: 0.5, rot: 10 }, { t: 1, rot: 0 }],
    arm_l: [{ t: 0, rot: 0 }, { t: 0.18, rot: 40 }, { t: 1, rot: 0 }],
    arm_r: [{ t: 0, rot: 0 }, { t: 0.18, rot: -40 }, { t: 1, rot: 0 }],
    leg_l: [{ t: 0, rot: 0 }, { t: 0.18, rot: -10 }, { t: 1, rot: 0 }],
  } },
  // 倒地:躯干前倾下沉、四肢瘫软,整体下移(GIF 循环,作预览足够)。
  death: { dur: 1.0, fps: 12, root: [{ t: 0, dy: 0 }, { t: 0.7, dy: 26 }, { t: 1, dy: 26 }], pose: {
    torso: [{ t: 0, rot: 0 }, { t: 0.7, rot: 58 }, { t: 1, rot: 58 }],
    head: [{ t: 0, rot: 0 }, { t: 0.7, rot: 40 }, { t: 1, rot: 40 }],
    arm_l: [{ t: 0, rot: 0 }, { t: 0.7, rot: -38 }, { t: 1, rot: -38 }],
    arm_r: [{ t: 0, rot: 0 }, { t: 0.7, rot: 34 }, { t: 1, rot: 34 }],
    leg_l: [{ t: 0, rot: 0 }, { t: 0.7, rot: 30 }, { t: 1, rot: 30 }],
    leg_r: [{ t: 0, rot: 0 }, { t: 0.7, rot: -26 }, { t: 1, rot: -26 }],
  } },
};

// 由全幅 mask × 源帧重建 7 个全幅部件,并按解剖推断关节枢轴。
export function buildRigParts(image, masks) {
  const W = image.width, H = image.height;
  const maskByName = new Map(masks.map((m) => [m.layerId, m]));
  const parts = {};
  for (const p of PARTS) {
    const m = maskByName.get(p);
    if (!m) return null;
    const md = m.image.data, buf = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < W * H; i++) {
      const mg = md[i * 4];
      buf[i * 4] = image.data[i * 4]; buf[i * 4 + 1] = image.data[i * 4 + 1]; buf[i * 4 + 2] = image.data[i * 4 + 2];
      buf[i * 4 + 3] = Math.round(image.data[i * 4 + 3] * (mg / 255));
    }
    parts[p] = buf;
  }
  const bb = {};
  for (const p of PARTS) { bb[p] = contentBBox(parts[p], W, H); if (!bb[p]) return null; }
  const pivots = {
    head: { x: bb.head.cx, y: bb.head.maxY },
    torso: { x: bb.torso.cx, y: bb.torso.maxY },
    hips: { x: bb.hips.cx, y: bb.hips.cy },
    arm_l: { x: bb.arm_l.cx, y: bb.arm_l.minY + (bb.arm_l.maxY - bb.arm_l.minY) * 0.15 },
    arm_r: { x: bb.arm_r.cx, y: bb.arm_r.minY + (bb.arm_r.maxY - bb.arm_r.minY) * 0.15 },
    leg_l: { x: bb.leg_l.cx, y: bb.leg_l.minY + (bb.leg_l.maxY - bb.leg_l.minY) * 0.1 },
    leg_r: { x: bb.leg_r.cx, y: bb.leg_r.minY + (bb.leg_r.maxY - bb.leg_r.minY) * 0.1 },
  };
  return { parts, pivots, width: W, height: H };
}

// 渲染单个 clip → GIF 字节。image/masks 已解码;clip ∈ RIG_CLIPS。
export function renderPackRigAnimation({ image, masks, clip = "walk", size = 240, bilinear = true, maxFrames = 0 } = {}) {
  const rig = buildRigParts(image, masks);
  if (!rig) return null;
  const def = CLIPS[clip];
  if (!def) return null;
  const { parts, pivots, width: SRCW, height: SRCH } = rig;
  const fps = def.fps || 12;
  let nframes = Math.max(2, Math.round(fps * def.dur));
  if (maxFrames && nframes > maxFrames) nframes = maxFrames;
  const W = size, H = Math.round(size * (SRCH / SRCW));
  const scaleX = W / SRCW, scaleY = H / SRCH;
  const frames = [];
  for (let i = 0; i < nframes; i++) {
    const t = i / nframes;
    const poseByPart = {};
    for (const p of PARTS) poseByPart[p] = sample(def.pose[p], t);
    const rootP = sample(def.root, t);
    const world = worldTransforms(pivots, poseByPart, rootP.dx || 0, rootP.dy || 0);
    const canvas = new Uint8ClampedArray(SRCW * SRCH * 4);
    for (const slot of DRAW_ORDER) drawPart(canvas, SRCW, SRCH, parts[slot], world[slot], bilinear);
    const out = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const sx = Math.min(SRCW - 1, Math.floor(x / scaleX)), sy = Math.min(SRCH - 1, Math.floor(y / scaleY));
      const si = (sy * SRCW + sx) * 4, di = (y * W + x) * 4;
      out[di] = canvas[si]; out[di + 1] = canvas[si + 1]; out[di + 2] = canvas[si + 2]; out[di + 3] = canvas[si + 3];
    }
    frames.push({ imageData: { data: out, width: W, height: H } });
  }
  const gif = encodeAnimatedGif(frames, { delay: Math.round(1000 / fps), loop: 0, transparent: true });
  return { gif, frameCount: nframes, width: W, height: H };
}
