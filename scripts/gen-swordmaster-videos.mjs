#!/usr/bin/env node
// 为"视频抽帧"对比组生成同一角色的 5 个动作视频(idle/walk/attack/hurt/death):
// 先出 1 张剑客基图,再用同一基图 + 不同运动提示词跑 5 段 Wan2.2 图生视频,下载 webm。
// 与 Spine 骨骼卡片的 5 动作对齐,便于投资人对比"视频抽帧 vs 骨骼绑定"。
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://lingji-forge.xiongchenyu6.workers.dev";
const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "assets/generated/showcase");
const TOKEN = (readFileSync(join(ROOT, ".dev.vars"), "utf8").match(/^GENERATOR_ACCESS_TOKEN=(.*)$/m) || [])[1].trim().replace(/^"|"$/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const H = () => ({ "content-type": "application/json", "x-lingji-access-token": TOKEN });

// 基图:纯绿幕 + 直立站姿(不要御剑/飞行),便于 i2v 保持纯色背景与地面动作、便于扣像。
const BASE_BRIEF = "仙侠青衫剑客，全身直立站姿，双脚踩地，双臂自然下垂，手持长剑，鎏金衣纹，纯绿色背景 chroma key green screen，游戏角色立绘，平涂无阴影";
// 每个动作强约束:固定镜头 + 纯绿幕 + 双脚踩地原地 + 明确动作 + 禁飞行御剑云海。
const CONSTRAINT = "固定镜头不移动，纯绿色背景 chroma green，角色双脚踩地、原地做动作，全身入镜，2D 游戏精灵动画";
const NEG = "飞行，御剑飞行，腾空，云海，天空，云朵，飘逸长镜头，电影运镜，背景场景，渐变背景，阴影，地面，文字水印，多角色，镜头推拉";
const ACTIONS = [
  { id: "idle", brief: `仙侠剑客原地待机站立，轻微呼吸起伏，${CONSTRAINT}` },
  { id: "walk", brief: `仙侠剑客原地踏步行走循环，双腿交替迈步、双臂前后摆动，${CONSTRAINT}` },
  { id: "attack", brief: `仙侠剑客挥剑横劈攻击，持剑手臂大幅向前挥砍，身体前倾发力，${CONSTRAINT}` },
  { id: "hurt", brief: `仙侠剑客被击中，身体猛地后仰踉跄、单脚后退，${CONSTRAINT}` },
  { id: "death", brief: `仙侠剑客中招倒下，身体向后倒地、瘫倒在地，${CONSTRAINT}` },
];

async function api(path, opts = {}) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const res = await fetch(`${BASE}${path}`, { ...opts, headers: { ...H(), ...(opts.headers || {}) } });
    if (res.status === 429) { const retry = Math.min(120, Number(res.headers.get("retry-after")) || 30); console.log(`  [429] ${retry}s 后重试`); await sleep(retry * 1000); continue; }
    return res.json();
  }
}
async function poll(promptId, kind) {
  process.stdout.write(`  ${kind} ${promptId} 轮询`);
  for (let i = 0; i < 400; i++) {
    await sleep(2500);
    const job = await api(`/api/jobs/${promptId}`, { method: "GET" });
    if (job?.status === "completed" || job?.result) { console.log(" ✓"); return job; }
    if (job?.status === "failed" || job?.error) { console.log(" ✗", job?.message || job?.error); return null; }
    process.stdout.write(".");
  }
  console.log(" 超时"); return null;
}
async function download(result, name) {
  const u = new URL(`${BASE}/api/comfy/view`);
  u.searchParams.set("filename", result.filename);
  if (result.subfolder) u.searchParams.set("subfolder", result.subfolder);
  if (result.type) u.searchParams.set("type", result.type);
  const res = await fetch(u, { headers: H() });
  if (!res.ok) { console.log(`  下载失败 ${name}: ${res.status}`); return; }
  writeFileSync(join(OUT, name), Buffer.from(await res.arrayBuffer()));
  console.log(`  ↓ ${name}`);
}

console.log("=== 生成剑客基图 ===");
const base = await api("/api/generate/2d", { method: "POST", body: JSON.stringify({ mode: "2d", brief: BASE_BRIEF, assetType: "character", style: "production", camera: "front", preset: "single", actionStrength: "balanced", animationRoute: "frames" }) });
const bjob = base?.promptId ? await poll(base.promptId, "2d") : base;
if (!bjob?.result?.filename) { console.log("基图失败,退出"); process.exit(1); }
const img = { filename: bjob.result.filename, subfolder: bjob.result.subfolder || "", type: bjob.result.type || "output" };
console.log("基图:", img.filename);

for (const a of ACTIONS) {
  console.log(`\n=== video ${a.id} ===`);
  const vid = await api("/api/generate/video-sprite", { method: "POST", body: JSON.stringify({ mode: "2d", brief: a.brief, negativePrompt: NEG, assetType: "character", style: "production", camera: "front", preset: "single", submit: true, comfyImage: img }) });
  const vjob = vid?.promptId ? await poll(vid.promptId, "video") : vid;
  if (vjob?.result?.filename) await download(vjob.result, `vsprite-sword-${a.id}.webm`);
  else console.log("  视频失败");
}
console.log("\n完成。");
