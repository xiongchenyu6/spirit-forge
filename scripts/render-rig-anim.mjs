#!/usr/bin/env node
// 把 SAM3 全幅分层(mask × 源帧 = 各部件全幅切图)按关节枢轴做层级骨骼动画,
// 逐帧合成循环 GIF。这是"绑骨→驱动播放"里产品此前缺失的播放环节。
//
// 全幅切图天然落在原位,叠加即还原角色;动画 = 每个部件绕其关节(pivot)旋转,
// 子部件继承父级世界变换(转躯干会带动头/手臂)。
//
// 用法: node scripts/render-rig-anim.mjs <rigDir> <outDir> [--size 320] [--fps 14]
//   rigDir 内需有 idle.png + head/torso/hips/arm_l/arm_r/leg_l/leg_r.png(全幅 mask)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { decodePngRgba, encodePngRgba } from "../src/lib/binary.js";

const PARTS = ["head", "torso", "hips", "arm_l", "arm_r", "leg_l", "leg_r"];
const DRAW_ORDER = ["leg_l", "leg_r", "hips", "torso", "arm_l", "arm_r", "head"];
const PARENT = { hips: "root", torso: "hips", head: "torso", arm_l: "torso", arm_r: "torso", leg_l: "hips", leg_r: "hips" };

function loadGif() {
  const src = readFileSync(new URL("../ui_kits/generator/gif-encoder.js", import.meta.url), "utf8");
  const sb = { window: {}, console }; vm.createContext(sb); vm.runInContext(src, sb);
  return sb.window.LingjiGifEncoder;
}

// 仿射 [a,b,c,d,tx,ty]: x'=a*x+c*y+tx, y'=b*x+d*y+ty
const T = (x, y) => [1, 0, 0, 1, x, y];
const Rm = (deg) => { const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [c, s, -s, c, 0, 0]; };
const Sm = (x, y) => [x, 0, 0, y, 0, 0];
const I = [1, 0, 0, 1, 0, 0];
function mul(m, n) {
  return [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]];
}
function inv(m) { const det = m[0]*m[3]-m[1]*m[2], id = 1/det, a=m[3]*id, b=-m[1]*id, c=-m[2]*id, d=m[0]*id; return [a,b,c,d,-(a*m[4]+c*m[5]),-(b*m[4]+d*m[5])]; }
const ap = (m, x, y) => [m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]];
// 绕枢轴 p 旋转 θ、缩放 sx,sy、再平移 dx,dy(均在图像坐标)
const around = (px, py, deg, sx = 1, sy = 1, dx = 0, dy = 0) => mul(T(px + dx, py + dy), mul(Rm(deg), mul(Sm(sx, sy), T(-px, -py))));

function contentBBox(part, W, H) {
  let minX = W, minY = H, maxX = 0, maxY = 0, any = false;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (part[(y*W+x)*4+3] > 24) { any = true; if (x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; }
  }
  return any ? { minX, minY, maxX, maxY, cx: (minX+maxX)/2, cy: (minY+maxY)/2 } : null;
}

function lerp(a, b, u) { return a + (b - a) * u; }
// 关键帧: [{t, rot, dx, dy, sx, sy}]; 采样并 loop
function sample(track, t) {
  const d = { rot: 0, dx: 0, dy: 0, sx: 1, sy: 1 };
  if (!track || !track.length) return d;
  if (t <= track[0].t) return { ...d, ...track[0] };
  const last = track[track.length - 1];
  if (t >= last.t) return { ...d, ...last };
  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i], b = track[i+1];
    if (t >= a.t && t <= b.t) {
      const u = (t - a.t) / (b.t - a.t || 1);
      return { rot: lerp(a.rot??0,b.rot??0,u), dx: lerp(a.dx??0,b.dx??0,u), dy: lerp(a.dy??0,b.dy??0,u), sx: lerp(a.sx??1,b.sx??1,u), sy: lerp(a.sy??1,b.sy??1,u) };
    }
  }
  return d;
}

function drawPart(canvas, W, H, part, F) {
  const Fi = inv(F);
  const corners = [ap(F,0,0), ap(F,W,0), ap(F,0,H), ap(F,W,H)];
  const minX = Math.max(0, Math.floor(Math.min(...corners.map(c=>c[0]))));
  const maxX = Math.min(W-1, Math.ceil(Math.max(...corners.map(c=>c[0]))));
  const minY = Math.max(0, Math.floor(Math.min(...corners.map(c=>c[1]))));
  const maxY = Math.min(H-1, Math.ceil(Math.max(...corners.map(c=>c[1]))));
  for (let py = minY; py <= maxY; py++) for (let px = minX; px <= maxX; px++) {
    const [u, v] = ap(Fi, px+0.5, py+0.5);
    if (u<0||u>=W||v<0||v>=H) continue;
    // 双线性
    const x0=Math.floor(u-0.5), y0=Math.floor(v-0.5), fx=(u-0.5)-x0, fy=(v-0.5)-y0;
    let r=0,g=0,b=0,a=0;
    for (let k=0;k<4;k++){ const xx=Math.min(W-1,Math.max(0,x0+(k&1))), yy=Math.min(H-1,Math.max(0,y0+(k>>1))); const wgt=((k&1)?fx:1-fx)*((k>>1)?fy:1-fy); const si=(yy*W+xx)*4; const al=part[si+3]*wgt; r+=part[si]*al; g+=part[si+1]*al; b+=part[si+2]*al; a+=al; }
    if (a<=0) continue; r/=a; g/=a; b/=a;
    const A=Math.min(255,a)/255, di=(py*W+px)*4, ia=1-A;
    canvas[di]=r*A+canvas[di]*ia; canvas[di+1]=g*A+canvas[di+1]*ia; canvas[di+2]=b*A+canvas[di+2]*ia; canvas[di+3]=Math.min(255,a+canvas[di+3]*ia);
  }
}

function worldTransforms(pivots, poseByPart, rootDx, rootDy) {
  const world = { root: T(rootDx, rootDy) };
  function compute(name) {
    if (world[name]) return world[name];
    const parent = PARENT[name] || "root";
    const pw = world[parent] || compute(parent);
    const p = pivots[name], po = poseByPart[name] || {};
    world[name] = mul(pw, around(p.x, p.y, po.rot||0, po.sx||1, po.sy||1, po.dx||0, po.dy||0));
    return world[name];
  }
  for (const n of PARTS) compute(n);
  return world;
}

async function main() {
  const [rigDir, outDir, ...rest] = process.argv.slice(2);
  const opt = {}; for (let i=0;i<rest.length;i+=2) opt[rest[i].replace(/^--/,"")] = rest[i+1];
  const SRC = 512; const W = Number(opt.size||320), H = W, fps = Number(opt.fps||14);
  mkdirSync(outDir, { recursive: true });

  const idle = await decodePngRgba(readFileSync(join(rigDir, "idle.png")));
  const parts = {};
  for (const p of PARTS) {
    const m = await decodePngRgba(readFileSync(join(rigDir, `${p}.png`)));
    const buf = new Uint8ClampedArray(SRC*SRC*4);
    for (let i=0;i<SRC*SRC;i++){ const mg=m.data[i*4]; const a=Math.round(idle.data[i*4+3]*(mg/255)); buf[i*4]=idle.data[i*4]; buf[i*4+1]=idle.data[i*4+1]; buf[i*4+2]=idle.data[i*4+2]; buf[i*4+3]=a; }
    parts[p] = buf;
  }
  // 枢轴(关节):由各部件内容 bbox 推断,符合解剖。
  const bb = {}; for (const p of PARTS) bb[p] = contentBBox(parts[p], SRC, SRC);
  const pv = {
    head: { x: bb.head.cx, y: bb.head.maxY },          // 脖子
    torso:{ x: bb.torso.cx, y: bb.torso.maxY },         // 腰
    hips: { x: bb.hips.cx, y: bb.hips.cy },
    arm_l:{ x: bb.arm_l.cx, y: bb.arm_l.minY + (bb.arm_l.maxY-bb.arm_l.minY)*0.15 }, // 肩
    arm_r:{ x: bb.arm_r.cx, y: bb.arm_r.minY + (bb.arm_r.maxY-bb.arm_r.minY)*0.15 },
    leg_l:{ x: bb.leg_l.cx, y: bb.leg_l.minY + (bb.leg_l.maxY-bb.leg_l.minY)*0.1 },  // 髋
    leg_r:{ x: bb.leg_r.cx, y: bb.leg_r.minY + (bb.leg_r.maxY-bb.leg_r.minY)*0.1 },
  };
  console.log("pivots:", Object.fromEntries(Object.entries(pv).map(([k,v])=>[k,[Math.round(v.x),Math.round(v.y)]])));

  // ---- 动画 clips:每部件 [{t,rot,dx,dy,sx,sy}],t∈[0,1] 循环 ----
  const breathe = (amp) => [{t:0,sy:1},{t:0.5,sy:1+amp},{t:1,sy:1}];
  const CLIPS = {
    idle: { dur: 1.6, root: [{t:0,dy:0},{t:0.5,dy:-2},{t:1,dy:0}], pose: {
      torso: breathe(0.025), head: [{t:0,rot:0},{t:0.5,rot:-1.5},{t:1,rot:0}],
      arm_l: [{t:0,rot:0},{t:0.5,rot:3},{t:1,rot:0}], arm_r: [{t:0,rot:0},{t:0.5,rot:-3},{t:1,rot:0}],
    }},
    walk: { dur: 0.8, root: [{t:0,dy:0},{t:0.25,dy:-4},{t:0.5,dy:0},{t:0.75,dy:-4},{t:1,dy:0}], pose: {
      leg_l: [{t:0,rot:22},{t:0.5,rot:-22},{t:1,rot:22}], leg_r: [{t:0,rot:-22},{t:0.5,rot:22},{t:1,rot:-22}],
      arm_l: [{t:0,rot:-18},{t:0.5,rot:18},{t:1,rot:-18}], arm_r: [{t:0,rot:18},{t:0.5,rot:-18},{t:1,rot:18}],
      torso: [{t:0,rot:-2},{t:0.25,rot:2},{t:0.5,rot:-2},{t:0.75,rot:2},{t:1,rot:-2}],
      head: [{t:0,rot:1},{t:0.5,rot:-1},{t:1,rot:1}],
    }},
    attack: { dur: 0.9, root: [{t:0,dx:0},{t:0.45,dx:-4},{t:0.6,dx:10},{t:1,dx:0}], pose: {
      arm_r: [{t:0,rot:0},{t:0.4,rot:-70},{t:0.6,rot:60},{t:0.8,rot:40},{t:1,rot:0}],
      arm_l: [{t:0,rot:0},{t:0.4,rot:20},{t:0.6,rot:-14},{t:1,rot:0}],
      torso: [{t:0,rot:0},{t:0.4,rot:-10},{t:0.6,rot:14},{t:1,rot:0}],
      head:  [{t:0,rot:0},{t:0.4,rot:-6},{t:0.6,rot:8},{t:1,rot:0}],
      leg_r: [{t:0,rot:0},{t:0.6,rot:-12},{t:1,rot:0}],
    }},
  };

  const enc = loadGif();
  const scale = W / SRC;
  for (const [name, clip] of Object.entries(CLIPS)) {
    const nframes = Math.max(2, Math.round(fps * clip.dur));
    const frames = [];
    for (let i=0;i<nframes;i++){
      const t = i / nframes;
      const poseByPart = {}; for (const p of PARTS) poseByPart[p] = sample(clip.pose[p], t);
      const rootP = sample(clip.root, t);
      const world = worldTransforms(pv, poseByPart, rootP.dx||0, rootP.dy||0);
      const canvas = new Uint8ClampedArray(SRC*SRC*4);
      for (const slot of DRAW_ORDER) drawPart(canvas, SRC, SRC, parts[slot], world[slot]);
      // 缩放到输出尺寸(最近邻保持像素感)
      const out = new Uint8ClampedArray(W*H*4);
      for (let y=0;y<H;y++) for (let x=0;x<W;x++){ const sx=Math.min(SRC-1,Math.floor(x/scale)), sy=Math.min(SRC-1,Math.floor(y/scale)); const si=(sy*SRC+sx)*4, di=(y*W+x)*4; out[di]=canvas[si];out[di+1]=canvas[si+1];out[di+2]=canvas[si+2];out[di+3]=canvas[si+3]; }
      frames.push({ imageData: { data: out, width: W, height: H } });
    }
    const gif = enc.encodeAnimatedGif(frames, { delay: Math.round(1000/fps), loop: 0, transparent: true });
    writeFileSync(join(outDir, `${name}.gif`), Buffer.from(gif));
    console.log(`✓ ${name}.gif (${nframes}帧, ${Math.round(gif.length/1024)}KB)`);
  }
}
main();
