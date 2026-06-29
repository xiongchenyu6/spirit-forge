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

const BASE_BRIEF = "仙侠青衫剑客，御剑而立，鎏金衣纹流光，长发飘逸，全身像，纯色背景";
const ACTIONS = [
  { id: "idle", brief: "仙侠青衫剑客全身，原地待机,轻微呼吸起伏、衣摆飘动,纯色背景" },
  { id: "walk", brief: "仙侠青衫剑客全身,向前行走,迈步摆臂,纯色背景" },
  { id: "attack", brief: "仙侠青衫剑客全身,挥剑向前劈砍攻击,纯色背景" },
  { id: "hurt", brief: "仙侠青衫剑客全身,受击身体后仰踉跄,纯色背景" },
  { id: "death", brief: "仙侠青衫剑客全身,中招倒地不起,纯色背景" },
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
  const vid = await api("/api/generate/video-sprite", { method: "POST", body: JSON.stringify({ mode: "2d", brief: a.brief, assetType: "character", style: "production", camera: "front", preset: "single", submit: true, comfyImage: img }) });
  const vjob = vid?.promptId ? await poll(vid.promptId, "video") : vid;
  if (vjob?.result?.filename) await download(vjob.result, `vsprite-sword-${a.id}.webm`);
  else console.log("  视频失败");
}
console.log("\n完成。");
