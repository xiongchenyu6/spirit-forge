#!/usr/bin/env node
// 全覆盖素材生成 / 端到端测试 harness。
//
// 驱动 Worker 的真实生成 API（2D / 动作包 / 3D / 视频精灵 / SAM3 分层），
// 跑一个覆盖各资产类型 × 画风的矩阵，轮询任务、下载产物、写 manifest，
// 产出可作「网站素材」的 showcase 资产集。
//
// 安全设计（会消耗真实 GPU/API 额度）：
//   - 默认 dry-run，只打印计划与预算估算；加 --go 才真正提交。
//   - --max-credits N 预算护栏，预计超出即停（默认 600；后端日额度 1200/时额度 240）。
//   - 429（额度限流）自动退避重试，遵守 usage limiter。
//
// 用法:
//   node scripts/generate-showcase-assets.mjs               # dry-run，打印计划
//   node scripts/generate-showcase-assets.mjs --go          # 真正生成（本地 wrangler dev）
//   node scripts/generate-showcase-assets.mjs --go --base https://lingji-forge.xiongchenyu6.workers.dev
//   node scripts/generate-showcase-assets.mjs --go --only character --max-credits 200
//
// 读取 GENERATOR_ACCESS_TOKEN：--token 优先，否则 .dev.vars。

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const args = parseArgs(process.argv.slice(2));
const BASE = (args.base || "http://127.0.0.1:8787").replace(/\/$/, "");
const OUT = args.out || "assets/generated/showcase";
const MAX_CREDITS = Number.isFinite(args.maxCredits) ? args.maxCredits : 600;
const PACE_MS = Number.isFinite(args.paceMs) ? args.paceMs : 1500;
const GO = Boolean(args.go);
const TOKEN = args.token || readToken(args.envFile || ".dev.vars");

// 各操作额度成本（与后端 usage.costs 对齐；启动时会用 /api/capabilities 校正）。
let COSTS = {
  prompt: 1,
  generate2d: 20,
  generate2dPackFrame: 12,
  generateLayerSeparation: 8,
  generate3d: 120,
  prepareVideoSprite: 0,
  generateVideoSprite: 80,
};

// 生成矩阵：每个「主体」先出一张 2D 基图，再从基图派生 3D / 视频精灵 / 动作包 / 分层。
// 覆盖 8 种资产类型 × 代表性画风，传达「万象」（多题材），不仅仙侠。
// 刷新矩阵:更有意思、风格更杂(仙侠/赛博/蒸汽/西幻/科幻/暗黑/Q版/像素/国风),
// 主体各不相同,避免之前"一堆同款绿胖怪"。绑骨展示主体选人形剑客(rig 最干净)。
const SUBJECTS = [
  { id: "xianxia-swordmaster", assetType: "character", style: "production", camera: "front",
    brief: "仙侠青衫剑客，御剑而立，鎏金衣纹流光，长发飘逸，半身立绘", derive: ["3d", "actions", "layers"] },
  { id: "cyber-hacker-girl", assetType: "character", style: "anime", camera: "front",
    brief: "赛博朋克少女黑客，霓虹粉发，机械义眼与义肢，全息屏，雨夜霓虹，全身像", derive: ["actions"] },
  { id: "steampunk-engineer", assetType: "character", style: "production", camera: "front",
    brief: "蒸汽朋克女工程师，黄铜护目镜，齿轮机械臂，棕色皮革风衣，全身像", derive: ["video"] },
  { id: "chibi-star-mage", assetType: "character", style: "anime", camera: "front",
    brief: "Q版二次元小法师萌娘，尖顶星辰法袍，大眼，捧发光法球，可爱", derive: [] },
  { id: "pixel-forest-ranger", assetType: "character", style: "pixel-art", camera: "side",
    brief: "像素风森林游侠，绿色斗篷与长弓，侧身行走，16-bit 复古", derive: [] },
  { id: "frost-dragon", assetType: "creature", style: "production", camera: "front",
    brief: "西幻冰霜巨龙，冰晶鳞甲，展翅，口吐寒气，战斗姿态", derive: ["3d"] },
  { id: "mecha-scorpion-boss", assetType: "creature", style: "isometric", camera: "isometric",
    brief: "科幻机械蝎子 BOSS，钢铁尾刺，等离子炮，发光关节，重装甲", derive: [] },
  { id: "qilin-spirit-beast", assetType: "creature", style: "production", camera: "front",
    brief: "国风麒麟瑞兽，鎏金鬃毛，祥云纹，独角，祥瑞华丽，全身", derive: [] },
  { id: "undead-skeleton-knight", assetType: "creature", style: "production", camera: "front",
    brief: "暗黑骷髅亡灵骑士，破损黑铠，幽绿火焰眼，握锈蚀阔剑", derive: [] },
  { id: "jade-immortal-sword", assetType: "weapon", style: "production", camera: "front",
    brief: "玉骨仙剑，半透碧玉剑身，鎏金云纹护手，灵光萦绕", derive: ["3d"] },
  { id: "cyber-plasma-rifle", assetType: "weapon", style: "production", camera: "front",
    brief: "赛博朋克等离子步枪，霓虹蓝能量管，磨损金属，未来科技", derive: [] },
  { id: "spirit-orb", assetType: "prop", style: "production", camera: "front",
    brief: "灵石宝珠，多面切割，内蕴流光，透明背景道具", derive: [] },
  { id: "steam-pocketwatch", assetType: "prop", style: "production", camera: "front",
    brief: "蒸汽朋克黄铜怀表，齿轮外露，复古做旧，发条精密", derive: [] },
  { id: "lightning-vfx", assetType: "vfx", style: "anime", camera: "front",
    brief: "雷电技能特效，紫蓝闪电缠绕金色火花，居中，四帧序列", derive: [] },
  { id: "guofeng-hud", assetType: "ui", style: "production", camera: "front",
    brief: "国风游戏 HUD 边框组件，深色玻璃拟态，鎏金祥云描边", derive: [] },
  { id: "lava-dungeon-tile", assetType: "map", style: "production", camera: "top-down",
    brief: "俯视熔岩地牢瓦片，黑岩与流动岩浆裂缝，可平铺", derive: [] },
  { id: "element-skill-icons", assetType: "icon", style: "production", camera: "front",
    brief: "元素技能图标组，火/水/雷/风，圆形符文徽记，发光", derive: [] },
];

let spent = 0;
const manifest = [];

async function main() {
  if (!TOKEN) fail("缺少 GENERATOR_ACCESS_TOKEN（--token 或 .dev.vars）");
  await syncCosts();

  const plan = buildPlan();
  printPlan(plan);
  if (!GO) {
    console.log("\n[dry-run] 加 --go 真正生成。预算护栏 --max-credits", MAX_CREDITS);
    return;
  }

  mkdirSync(OUT, { recursive: true });
  for (const subject of SUBJECTS) {
    if (args.only && subject.assetType !== args.only) continue;
    if (spent + COSTS.generate2d > MAX_CREDITS) { console.log("预算用尽，停止"); break; }
    await runSubject(args.singlesOnly ? { ...subject, derive: [] } : subject);
  }
  writeFileSync(join(OUT, "manifest.json"), JSON.stringify({ base: BASE, generatedAt: null, spentCredits: spent, assets: manifest }, null, 2));
  console.log(`\n完成。共消耗 ${spent} 额度，产出 ${manifest.length} 件，manifest → ${join(OUT, "manifest.json")}`);
}

async function runSubject(s) {
  console.log(`\n=== ${s.id} (${s.assetType}/${s.style}) ===`);
  const base = await submitAndPoll("/api/generate/2d", { mode: "2d", brief: s.brief, assetType: s.assetType, style: s.style, camera: s.camera, preset: "single", actionStrength: "balanced", animationRoute: "frames" }, "generate2d");
  if (!base?.result?.filename) { console.log("  2D 基图失败，跳过派生"); return; }
  await save(s.id, "2d", base.result);
  const img = pick(base.result);

  for (const d of s.derive || []) {
    if (spent > MAX_CREDITS) break;
    if (d === "3d" && spent + COSTS.generate3d <= MAX_CREDITS) {
      const j = await submitAndPoll("/api/generate/3d", { mode: "3d", brief: s.brief, assetType: s.assetType, style: s.style, camera: s.camera, preset: "single", comfyImage: img }, "generate3d");
      if (j?.result?.filename) await save(s.id, "3d", j.result);
    } else if (d === "actions") {
      const j = await submitAndPoll("/api/generate/2d-pack", { mode: "2d", brief: s.brief, assetType: s.assetType, style: s.style, camera: s.camera, preset: s.assetType === "creature" ? "monster-actions" : "character-actions", actionStrength: "balanced", animationRoute: "frames", referenceImage: null, poseImages: null, requestId: `showcase-${s.id}` }, "generate2dPackFrame");
      if (j?.packId) manifest.push({ subject: s.id, kind: "actions-pack", packId: j.packId });
    } else if (d === "video") {
      const j = await submitAndPoll("/api/generate/video-sprite", { mode: "2d", brief: s.brief, assetType: s.assetType, style: s.style, camera: s.camera, preset: "single", submit: true, comfyImage: img }, "generateVideoSprite");
      if (j?.result?.filename) await save(s.id, "video-sprite", j.result);
    } else if (d === "layers") {
      manifest.push({ subject: s.id, kind: "layers", note: "需先有动作包 packId，集成后补充" });
    }
  }
}

async function submitAndPoll(path, body, costKey) {
  spent += COSTS[costKey] || 0;
  const submit = await api(path, { method: "POST", body: JSON.stringify(body) });
  if (!submit?.ok && !submit?.promptId && !submit?.packId) { console.log(`  提交失败 ${path}:`, submit?.message || JSON.stringify(submit).slice(0, 200)); return null; }
  if (!submit.promptId) return submit; // pack 等异步对象直接返回
  process.stdout.write(`  ${path} promptId=${submit.promptId} 轮询`);
  for (let i = 0; i < 300; i++) {
    await sleep(2000);
    const job = await api(`/api/jobs/${submit.promptId}`, { method: "GET" });
    if (job?.status === "completed" || job?.result) { console.log(" ✓"); return job; }
    if (job?.status === "failed" || job?.error) { console.log(" ✗", job?.error || job?.message); return null; }
    process.stdout.write(".");
  }
  console.log(" 超时"); return null;
}

async function save(subjectId, kind, result) {
  try {
    const u = new URL(`${BASE}/api/comfy/view`);
    u.searchParams.set("filename", result.filename);
    if (result.subfolder) u.searchParams.set("subfolder", result.subfolder);
    if (result.type) u.searchParams.set("type", result.type);
    const res = await fetch(u, { headers: authHeaders() });
    if (!res.ok) { console.log(`  下载失败 ${kind}: HTTP ${res.status}`); return; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = (result.filename.match(/\.[a-z0-9]+$/i) || [".png"])[0];
    const name = `${subjectId}-${kind}${ext}`;
    writeFileSync(join(OUT, name), buf);
    manifest.push({ subject: subjectId, kind, file: name, bytes: buf.length });
    console.log(`  ↓ ${name} (${buf.length}B)`);
  } catch (e) { console.log(`  下载异常 ${kind}:`, e.message); }
}

async function api(path, opts = {}, attempt = 0) {
  await sleep(PACE_MS);
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: { "content-type": "application/json", ...authHeaders(), ...(opts.headers || {}) } });
  if (res.status === 429 && attempt < 8) {
    const retry = Number(res.headers.get("retry-after")) || 30;
    console.log(`  [429] 额度限流，${retry}s 后重试`);
    await sleep(retry * 1000);
    return api(path, opts, attempt + 1);
  }
  try { return await res.json(); } catch { return { ok: res.ok, status: res.status }; }
}

async function syncCosts() {
  try {
    const cap = await api("/api/capabilities", { method: "GET" });
    if (cap?.usage?.costs) COSTS = { ...COSTS, ...cap.usage.costs };
  } catch { /* 离线则用默认成本 */ }
}

function buildPlan() {
  const rows = [];
  for (const s of SUBJECTS) {
    if (args.only && s.assetType !== args.only) continue;
    rows.push({ subject: s.id, type: s.assetType, style: s.style, ops: ["2d", ...(s.derive || [])] });
  }
  return rows;
}

function printPlan(plan) {
  console.log(`目标 Worker: ${BASE}`);
  console.log(`输出目录: ${OUT}   预算上限: ${MAX_CREDITS} 额度`);
  let est = 0;
  console.log("\n生成计划:");
  for (const r of plan) {
    let c = COSTS.generate2d;
    for (const op of r.ops.slice(1)) {
      c += op === "3d" ? COSTS.generate3d : op === "video" ? COSTS.generateVideoSprite : op === "actions" ? COSTS.generate2dPackFrame * 4 : op === "layers" ? COSTS.generateLayerSeparation : 0;
    }
    est += c;
    console.log(`  ${r.subject.padEnd(22)} ${r.type.padEnd(10)} ${r.style.padEnd(11)} ops=${r.ops.join("+").padEnd(20)} ~${c} 额度`);
  }
  console.log(`\n预计总额度 ≈ ${est}（时限 240/h，日限 1200，会自动退避）`);
}

function pick(r) { return { filename: r.filename, subfolder: r.subfolder, type: r.type }; }
function authHeaders() { return { "x-lingji-access-token": TOKEN }; }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function fail(m) { console.error("错误:", m); process.exit(1); }

function readToken(envFile) {
  if (!existsSync(envFile)) return process.env.GENERATOR_ACCESS_TOKEN || "";
  const txt = readFileSync(envFile, "utf8");
  const m = txt.match(/GENERATOR_ACCESS_TOKEN\s*=\s*"?([^"\n]+)"?/);
  return m ? m[1].trim() : (process.env.GENERATOR_ACCESS_TOKEN || "");
}

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--go") a.go = true;
    else if (k === "--base") a.base = argv[++i];
    else if (k === "--out") a.out = argv[++i];
    else if (k === "--token") a.token = argv[++i];
    else if (k === "--env-file") a.envFile = argv[++i];
    else if (k === "--only") a.only = argv[++i];
    else if (k === "--max-credits") a.maxCredits = Number(argv[++i]);
    else if (k === "--singles-only") a.singlesOnly = true;
    else if (k === "--pace-ms") a.paceMs = Number(argv[++i]);
  }
  return a;
}

main().catch((e) => fail(e.stack || e.message));
