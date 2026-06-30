#!/usr/bin/env node
// 演示/验证"视频抽帧自动 FLF"全链路(与生成台一键流程一致):
// 文生图基图(首帧) → img2img 推导动作姿势(尾帧) → WanFirstLastFrameToVideo 首尾帧插值 → 下载 webm。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://lingji-forge.xiongchenyu6.workers.dev";
const ROOT = new URL("..", import.meta.url).pathname;
const OUT = process.argv[2] || "/tmp/auto-flf";
mkdirSync(OUT, { recursive: true });
const TOKEN = (readFileSync(join(ROOT, ".dev.vars"), "utf8").match(/^GENERATOR_ACCESS_TOKEN=(.*)$/m) || [])[1].trim().replace(/^"|"$/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const H = () => ({ "content-type": "application/json", "x-lingji-access-token": TOKEN });

const GREEN = "纯绿色背景 #00ff00 chroma key green screen,flat uniform RGB(0,255,0) backdrop,背景必须是均匀无渐变纯绿,四角和边缘都是同一个绿色,无地面阴影,全身入镜";
const NEG = "多个角色,两个人,分身,复制人,群像,飞行,御剑,腾空,云海,天空,渐变背景,浅蓝灰背景,灰色背景,白色背景,影棚背景,电影运镜,文字水印";
const SUBJECTS = [
  { id: "xianxia-sword", base: "仙侠青衫剑客,全身直立站姿,纯色背景,游戏立绘", action: "挥剑横劈攻击,持剑手臂大幅前挥,身体前倾" },
  { id: "cyber-girl",   base: "赛博朋克少女,机械义肢,全身直立,纯色背景,游戏立绘", action: "向前迈步奔跑,双臂摆动" },
  { id: "plate-knight", base: "西幻板甲骑士,持剑持盾,全身直立,纯色背景,游戏立绘", action: "举剑过顶劈砍攻击" },
];

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
const ref = (r) => ({ filename: r.filename, subfolder: r.subfolder || "", type: r.type || "output" });

for (const s of SUBJECTS) {
  console.log(`\n=== ${s.id} ===`);
  console.log(" ① 文生图基图(首帧)");
  const b = await api("/api/generate/2d", { method: "POST", body: JSON.stringify({ mode: "2d", brief: s.base, assetType: "character", style: "production", camera: "front", preset: "single" }) });
  const base = b?.promptId ? await poll(b.promptId, "2d") : null;
  if (!base?.filename) { console.log("  基图失败,跳过"); continue; }
  console.log(" ①b 绿幕首帧");
  const gs = await api("/api/generate/2d", { method: "POST", body: JSON.stringify({ mode: "2d", brief: `${s.base},原地直立站姿,${GREEN}`, assetType: "character", style: "production", camera: "front", preset: "single", denoise: 0.68, comfyImage: ref(base) }) });
  const gstart = gs?.promptId ? await poll(gs.promptId, "2d") : null;
  const startRef = gstart?.filename ? ref(gstart) : ref(base);
  console.log(" ② 绿幕动作尾帧");
  const e = await api("/api/generate/2d", { method: "POST", body: JSON.stringify({ mode: "2d", brief: `${s.base},${s.action},明显动作姿势,动态pose,肢体大幅变化,${GREEN}`, assetType: "character", style: "production", camera: "front", preset: "single", denoise: 0.72, comfyImage: startRef }) });
  const end = e?.promptId ? await poll(e.promptId, "2d") : null;
  console.log(" ③ 首尾帧插值视频(FLF)");
  const v = await api("/api/generate/video-sprite", { method: "POST", body: JSON.stringify({ mode: "2d", brief: `${s.base},${s.action},固定镜头,${GREEN}`, negativePrompt: NEG, assetType: "character", style: "production", preset: "single", length: 25, submit: true, comfyImage: startRef, ...(end?.filename ? { endComfyImage: ref(end) } : {}) }) });
  const vid = v?.promptId ? await poll(v.promptId, "video-sprite") : null;
  if (vid?.filename) {
    const u = new URL(`${BASE}/api/comfy/view`); u.searchParams.set("filename", vid.filename); if (vid.subfolder) u.searchParams.set("subfolder", vid.subfolder); u.searchParams.set("type", vid.type || "output");
    const res = await fetch(u, { headers: H() });
    writeFileSync(join(OUT, `${s.id}.webm`), Buffer.from(await res.arrayBuffer()));
    console.log(`  ↓ ${s.id}.webm  (FLF=${end?.filename ? "是" : "退回i2v"})`);
  } else console.log("  视频失败");
}
console.log("\n完成 →", OUT);
