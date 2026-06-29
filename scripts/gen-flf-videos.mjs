#!/usr/bin/env node
// FLF2V:用 rig 关键帧(中性起始 + 动作峰值)作首尾帧引导 Wan2.2 插补,生成更可控、
// 单角色的动作视频(绿幕),再抽帧。对应"先生成首尾帧→再生成动画→抽帧"提高可控性。
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://lingji-forge.xiongchenyu6.workers.dev";
const ROOT = new URL("..", import.meta.url).pathname;
const SC = "/tmp/claude-1000/-home-freeman-xiong-Documents-github-xiongchenyu6-spirit-forge/ecba7043-29fe-4c3f-b3c4-248be799e4a4/scratchpad/flf";
const OUT = join(ROOT, "assets/generated/showcase");
const TOKEN = (readFileSync(join(ROOT, ".dev.vars"), "utf8").match(/^GENERATOR_ACCESS_TOKEN=(.*)$/m) || [])[1].trim().replace(/^"|"$/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const H = () => ({ "content-type": "application/json", "x-lingji-access-token": TOKEN });
const dataUrl = (p) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;

const NEG = "多个角色,两个人,双人,分身,复制人,克隆,群像,人群,额外的人,飞行,御剑飞行,腾空,云海,天空,云朵,渐变背景,电影运镜,镜头推拉,文字水印";
const CONSTRAINT = "固定镜头,纯绿色背景 chroma green,单个角色,角色双脚踩地原地,全身入镜,2D 游戏精灵动画";
const ACTIONS = [
  { id: "idle", brief: `仙侠剑客原地待机站立轻微呼吸,${CONSTRAINT}` },
  { id: "walk", brief: `仙侠剑客原地踏步行走循环,双腿交替迈步,${CONSTRAINT}` },
  { id: "attack", brief: `仙侠剑客挥剑横劈攻击,持剑手臂向前挥砍,${CONSTRAINT}` },
  { id: "hurt", brief: `仙侠剑客被击中身体后仰踉跄,${CONSTRAINT}` },
  { id: "death", brief: `仙侠剑客中招向后倒地瘫倒,${CONSTRAINT}` },
];

async function api(path, opts = {}) {
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, { ...opts, headers: { ...H(), ...(opts.headers || {}) } });
      if (res.status === 429) { const retry = Math.min(120, Number(res.headers.get("retry-after")) || 30); console.log(`  [429] ${retry}s`); await sleep(retry * 1000); continue; }
      return res.json();
    } catch (e) { console.log(`  net err: ${e.message} (retry)`); await sleep(4000); }
  }
  return null;
}
async function poll(promptId, kind) {
  process.stdout.write(`  ${kind} ${promptId} 轮询`);
  for (let i = 0; i < 500; i++) {
    await sleep(2500);
    let job = null;
    try { job = await api(`/api/jobs/${promptId}`, { method: "GET" }); } catch { /* keep polling */ }
    if (job?.status === "completed" || job?.result) { console.log(" ✓"); return job; }
    if (job?.status === "failed" || job?.status === "error" || job?.error) { console.log(" ✗", job?.message || job?.error || job?.status); return null; }
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

const startUrl = dataUrl(join(SC, "start.png"));
for (const a of ACTIONS) {
  console.log(`\n=== FLF ${a.id} ===`);
  const endUrl = dataUrl(join(SC, `end-${a.id}.png`));
  const vid = await api("/api/generate/video-sprite", { method: "POST", body: JSON.stringify({
    mode: "2d", brief: a.brief, negativePrompt: NEG, assetType: "character", style: "production", camera: "front", preset: "single",
    submit: true, imageDataUrl: startUrl, endImageDataUrl: endUrl,
  }) });
  const vjob = vid?.promptId ? await poll(vid.promptId, "video") : vid;
  if (vjob?.result?.filename) await download(vjob.result, `vsprite-sword-${a.id}.webm`);
  else console.log("  失败:", JSON.stringify(vid).slice(0, 160));
}
console.log("\n完成。");
