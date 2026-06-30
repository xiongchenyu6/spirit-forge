#!/usr/bin/env node
// 验证「浏览器端 canvas 抠像贴 #00ff00 → img2img」真实路径(node 用 imagemagick 复刻 removeCornerBackground):
// ① 文生图源帧 → ② 角连通洪填抠像 + 合成纯绿画布(= createGreenScreenImageDataUrl)→
// ③ 以 imageDataUrl 喂 /api/generate/2d 做动作 img2img(denoise 0.68)→ ④ 下载,采样背景四角验证是否纯绿。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const BASE = "https://lingji-forge.xiongchenyu6.workers.dev";
const ROOT = new URL("..", import.meta.url).pathname;
const OUT = process.argv[2] || "/tmp/green-verify";
mkdirSync(OUT, { recursive: true });
const TOKEN = (readFileSync(join(ROOT, ".dev.vars"), "utf8").match(/^GENERATOR_ACCESS_TOKEN=(.*)$/m) || [])[1].trim().replace(/^"|"$/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const H = () => ({ "content-type": "application/json", "x-lingji-access-token": TOKEN });

async function api(path, opts = {}) {
  for (let a = 0; a < 12; a++) {
    try {
      const res = await fetch(`${BASE}${path}`, { ...opts, headers: { ...H(), ...(opts.headers || {}) } });
      if (res.status === 429) { const r = Math.min(120, Number(res.headers.get("retry-after")) || 30); console.log(`  [429] ${r}s`); await sleep(r * 1000); continue; }
      return res.json();
    } catch (e) { console.log(`  net ${e.message}`); await sleep(4000); }
  }
  return null;
}
async function poll(id, kind) {
  process.stdout.write(`  ${kind} 轮询`);
  for (let i = 0; i < 200; i++) {
    await sleep(2500);
    const j = await api(`/api/jobs/${id}?kind=${kind}`).catch(() => null);
    const s = j?.status;
    if (s === "complete" || s === "completed" || j?.result) { console.log(" ✓"); return j?.result || null; }
    if (s === "failed" || s === "error" || j?.error) { console.log(" ✗", j?.message || j?.error); return null; }
    process.stdout.write(".");
  }
  console.log(" 超时"); return null;
}
async function download(r, file) {
  const u = new URL(`${BASE}/api/comfy/view`);
  u.searchParams.set("filename", r.filename);
  if (r.subfolder) u.searchParams.set("subfolder", r.subfolder);
  u.searchParams.set("type", r.type || "output");
  const res = await fetch(u, { headers: H() });
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

const SUBJECTS = [
  { id: "sword", base: "仙侠青衫剑客,全身直立站姿,纯色背景,游戏立绘", action: "挥剑横劈攻击,持剑手臂大幅前挥,身体前倾,明显动作姿势" },
  { id: "cyber", base: "赛博朋克少女,机械义肢,全身直立,纯色背景,游戏立绘", action: "向前迈步奔跑,双臂大幅摆动,明显动作姿势" },
];

for (const s of SUBJECTS) {
  console.log(`\n=== ${s.id} ===`);
  // ① 文生图源帧
  console.log(" ① 文生图源帧");
  const b = await api("/api/generate/2d", { method: "POST", body: JSON.stringify({ mode: "2d", brief: s.base, assetType: "character", style: "production", camera: "front", preset: "single" }) });
  const base = b?.promptId ? await poll(b.promptId, "2d") : null;
  if (!base?.filename) { console.log("  源帧失败,跳过"); continue; }
  const srcPng = join(OUT, `${s.id}-src.png`);
  await download(base, srcPng);

  // ② 复刻 createGreenScreenImageDataUrl:角连通洪填抠背景 → 合成到 #00ff00
  console.log(" ② 本地抠像合成纯绿(imagemagick 复刻 canvas)");
  const cutPng = join(OUT, `${s.id}-cut.png`);
  const greenPng = join(OUT, `${s.id}-green.png`);
  // 四角各做一次 floodfill 抠透明(fuzz ~12%,角连通 = removeCornerBackground)
  const W = Number(execFileSync("magick", ["identify", "-format", "%w", srcPng]).toString());
  const Hh = Number(execFileSync("magick", ["identify", "-format", "%h", srcPng]).toString());
  execFileSync("magick", [srcPng, "-alpha", "set", "-fuzz", "12%",
    "-fill", "none",
    "-draw", "color 0,0 floodfill",
    "-draw", `color ${W - 1},0 floodfill`,
    "-draw", `color 0,${Hh - 1} floodfill`,
    "-draw", `color ${W - 1},${Hh - 1} floodfill`,
    cutPng], { stdio: "inherit" });
  execFileSync("magick", ["-size", `${W}x${Hh}`, "xc:#00ff00", cutPng, "-composite", greenPng], { stdio: "inherit" });

  // ③ imageDataUrl img2img 动作帧
  console.log(" ③ imageDataUrl img2img 动作帧(denoise 0.68)");
  const dataUrl = "data:image/png;base64," + readFileSync(greenPng).toString("base64");
  const e = await api("/api/generate/2d", { method: "POST", body: JSON.stringify({ mode: "2d", brief: `${s.base},${s.action},纯绿色背景 #00ff00 chroma key green screen,flat uniform RGB(0,255,0) backdrop,背景必须是均匀无渐变纯绿`, assetType: "character", style: "production", camera: "front", preset: "single", denoise: 0.68, imageDataUrl: dataUrl }) });
  const end = e?.promptId ? await poll(e.promptId, "2d") : null;
  if (!end?.filename) { console.log("  动作帧失败"); continue; }
  const endPng = join(OUT, `${s.id}-end.png`);
  await download(end, endPng);

  // ④ 采样四角背景色
  const corner = (x, y) => execFileSync("magick", [endPng, "-format", `%[pixel:p{${x},${y}}]`, "info:"]).toString();
  const ew = Number(execFileSync("magick", ["identify", "-format", "%w", endPng]).toString());
  const eh = Number(execFileSync("magick", ["identify", "-format", "%h", endPng]).toString());
  console.log(`  尾帧四角采样: TL=${corner(2, 2)} TR=${corner(ew - 3, 2)} BL=${corner(2, eh - 3)} BR=${corner(ew - 3, eh - 3)}`);
}
console.log("\n完成 →", OUT);
