#!/usr/bin/env node
// 焦点生成:对指定主体做 2D→图生视频(video-sprite),下载 webm 供造物展"视频抽帧"对比。
// 用法: node scripts/gen-extra-videos.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://lingji-forge.xiongchenyu6.workers.dev";
const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "assets/generated/showcase");
const TOKEN = (readFileSync(join(ROOT, ".dev.vars"), "utf8").match(/^GENERATOR_ACCESS_TOKEN=(.*)$/m) || [])[1].trim().replace(/^"|"$/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const H = () => ({ "content-type": "application/json", "x-lingji-access-token": TOKEN });

const SUBJECTS = [
  { id: "cyber-hacker-girl", assetType: "character", style: "anime", camera: "front", brief: "赛博朋克少女黑客，霓虹粉发，机械义眼与义肢，全息屏，雨夜霓虹，全身像" },
  { id: "frost-dragon", assetType: "creature", style: "production", camera: "front", brief: "西幻冰霜巨龙，冰晶鳞甲，展翅，口吐寒气，战斗姿态" },
];

async function api(path, opts = {}) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(`${BASE}${path}`, { ...opts, headers: { ...H(), ...(opts.headers || {}) } });
    if (res.status === 429) { const retry = Number(res.headers.get("retry-after")) || 30; console.log(`  [429] ${retry}s 后重试`); await sleep(retry * 1000); continue; }
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
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(OUT, name), buf);
  console.log(`  ↓ ${name} (${buf.length}B)`);
}

for (const s of SUBJECTS) {
  console.log(`\n=== ${s.id} ===`);
  const base = await api("/api/generate/2d", { method: "POST", body: JSON.stringify({ mode: "2d", brief: s.brief, assetType: s.assetType, style: s.style, camera: s.camera, preset: "single", actionStrength: "balanced", animationRoute: "frames" }) });
  const bjob = base?.promptId ? await poll(base.promptId, "2d") : base;
  if (!bjob?.result?.filename) { console.log("  2D 失败,跳过"); continue; }
  const img = { filename: bjob.result.filename, subfolder: bjob.result.subfolder || "", type: bjob.result.type || "output" };
  const vid = await api("/api/generate/video-sprite", { method: "POST", body: JSON.stringify({ mode: "2d", brief: s.brief, assetType: s.assetType, style: s.style, camera: s.camera, preset: "single", submit: true, comfyImage: img }) });
  const vjob = vid?.promptId ? await poll(vid.promptId, "video") : vid;
  if (vjob?.result?.filename) await download(vjob.result, `${s.id}-video-sprite.webm`);
  else console.log("  视频失败");
}
console.log("\n完成。");
