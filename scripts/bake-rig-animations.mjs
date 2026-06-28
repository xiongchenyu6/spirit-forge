#!/usr/bin/env node
// 离线烘焙骨骼驱动动画:对带 SAM3 分层的包,渲染 idle/walk/attack 循环 GIF,
// 上传到 R2 的端点缓存键,使 /api/packs/:id/spine-sam3/animation/:clip.gif 直接命中。
// 纯 JS 解码 8 张 512² PNG + 逐帧合成在 Worker(Free plan)会超 CPU,故离线预渲染。
//
// 用法: node scripts/bake-rig-animations.mjs [packId ...] [--size 288] [--worker-url URL]
//   不传 packId 则烘焙 scripts/spine-sam3-packs.json 里 enabled 的全部包。
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { decodePngRgba } from "../src/lib/binary.js";
import { renderPackRigAnimation, RIG_CLIPS } from "../src/lib/rig-render.js";

const BUCKET = "lingji-forge-assets";
const ROOT = new URL("..", import.meta.url).pathname;
const TMP = "/tmp/lingji-bake-rig";

function devVar(name) {
  try {
    const txt = readFileSync(join(ROOT, ".dev.vars"), "utf8");
    const m = txt.match(new RegExp(`^${name}=(.*)$`, "m"));
    return m ? m[1].trim().replace(/^"|"$/g, "") : "";
  } catch { return ""; }
}

const args = process.argv.slice(2);
const opt = { size: 288, workerUrl: "https://lingji-forge.xiongchenyu6.workers.dev" };
const ids = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--size") opt.size = Number(args[++i]);
  else if (args[i] === "--worker-url") opt.workerUrl = args[++i];
  else ids.push(args[i]);
}
const TOKEN = devVar("GENERATOR_ACCESS_TOKEN");
if (!TOKEN) { console.error("缺少 GENERATOR_ACCESS_TOKEN(.dev.vars)"); process.exit(1); }

const packIds = ids.length ? ids : JSON.parse(readFileSync(join(ROOT, "scripts/spine-sam3-packs.json"), "utf8"))
  .packs.filter((p) => p.enabled !== false && p.hasSam3).map((p) => p.packId);

const PARTS = ["head", "torso", "hips", "arm_l", "arm_r", "leg_l", "leg_r"];

async function api(path, asBuffer) {
  const res = await fetch(`${opt.workerUrl}${path}`, { headers: { "x-lingji-access-token": TOKEN } });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return asBuffer ? Buffer.from(await res.arrayBuffer()) : res.json();
}

async function bakePack(packId) {
  const preview = await api(`/api/packs/${packId}/spine-sam3/preview.json`);
  const jobId = preview.jobId;
  if (!jobId) { console.warn(`  ${packId}: 无 jobId,跳过`); return; }
  const work = join(TMP, packId);
  rmSync(work, { recursive: true, force: true }); mkdirSync(work, { recursive: true });
  const zip = join(work, "pack.zip");
  writeFileSync(zip, await api(`/api/packs/${packId}/download.zip`, true));
  execSync(`unzip -oq "${zip}" "spine/sam3-layers/masks/*" "frames/transparent/01-idle_alpha.png" "frames/original/01-idle.png" -d "${work}"`, { stdio: "ignore" });
  const framePath = ["frames/transparent/01-idle_alpha.png", "frames/original/01-idle.png"].map((p) => join(work, p)).find((p) => existsSync(p));
  if (!framePath) { console.warn(`  ${packId}: 无源帧,跳过`); return; }
  const image = await decodePngRgba(readFileSync(framePath));
  const masks = [];
  for (const p of PARTS) {
    const mp = join(work, "spine/sam3-layers/masks", `${p}.png`);
    if (!existsSync(mp)) { console.warn(`  ${packId}: 缺 mask ${p},跳过`); return; }
    masks.push({ layerId: p, image: await decodePngRgba(readFileSync(mp)) });
  }
  for (const clip of RIG_CLIPS) {
    const r = renderPackRigAnimation({ image, masks, clip, size: opt.size, bilinear: true });
    if (!r?.gif) { console.warn(`  ${packId}/${clip}: 渲染失败`); continue; }
    const gifPath = join(work, `${clip}.gif`);
    writeFileSync(gifPath, Buffer.from(r.gif));
    const key = `library/packs/${packId}/spine-sam3/anim-v1-${jobId}/${clip}.gif`;
    execSync(`wrangler r2 object put "${BUCKET}/${key}" --file="${gifPath}" --content-type=image/gif --remote`, { cwd: ROOT, stdio: "ignore" });
    console.log(`  ✓ ${packId}/${clip} (${r.frameCount}帧 ${Math.round(r.gif.length / 1024)}KB) → R2`);
  }
}

console.log(`烘焙 ${packIds.length} 个包 → ${opt.workerUrl}`);
for (const id of packIds) {
  console.log(`· ${id}`);
  try { await bakePack(id); } catch (e) { console.warn(`  失败: ${e.message}`); }
}
console.log("完成。");
