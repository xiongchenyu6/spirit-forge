#!/usr/bin/env node
// 资产包端到端验证：提交 2d-pack → 轮询所有帧完成 → 下载 ZIP（含 sprite sheet）
// → 可选触发 SAM3 分层并拉取 preview。用于验证 8 方向行走、怪物动作 + SAM3 部位提取。
//
// 用法:
//   node scripts/validate-pack.mjs --preset character-walk-8dir --asset character --style pixel \
//     --brief "像素风女剑修，银甲红披风，行走循环" --base https://lingji-forge.xiongchenyu6.workers.dev --out assets/generated/packs
//   ...加 --layers 触发 SAM3 分层(怪物用)
// 读取 GENERATOR_ACCESS_TOKEN：--token 优先,否则 .dev.vars。

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const a = parseArgs(process.argv.slice(2));
const BASE = (a.base || "https://lingji-forge.xiongchenyu6.workers.dev").replace(/\/$/, "");
const OUT = a.out || "assets/generated/packs";
const TOKEN = a.token || readToken(a.envFile || ".dev.vars");
const PACE = Number.isFinite(a.paceMs) ? a.paceMs : 1500;

async function main() {
  if (!TOKEN) fail("缺少 GENERATOR_ACCESS_TOKEN");
  mkdirSync(OUT, { recursive: true });
  const input = {
    mode: "2d",
    brief: a.brief || "测试资产包",
    assetType: a.asset || "character",
    style: a.style || "production",
    camera: a.camera || "front",
    preset: a.preset || "character-actions",
    actionStrength: "balanced",
    animationRoute: "frames",
    requestId: `validate-${a.preset || "pack"}-${OUT.length}`,
  };
  let packId = a.packId;
  if (!packId) {
    console.log(`提交 pack: preset=${input.preset} asset=${input.assetType} style=${input.style}`);
    const sub = await api("/api/generate/2d-pack", { method: "POST", body: JSON.stringify(input) });
    const pk = sub?.pack || sub;
    packId = sub?.packId || pk?.packId;
    if (!packId) return fail(`提交失败: ${sub?.message || JSON.stringify(sub).slice(0, 200)}`);
    console.log(`packId=${packId} 总帧=${(pk?.frames || []).length}`);
  } else {
    console.log(`轮询既有 packId=${packId}`);
  }

  // 轮询所有帧完成（pack 嵌在 .pack 下）
  let last = "";
  for (let i = 0; i < 600; i++) {
    await sleep(4000);
    const r = await api(`/api/packs/${packId}`, { method: "GET" });
    const p = r?.pack || r;
    const frames = p?.frames || [];
    const done = frames.filter((f) => f.status === "completed" || f.result).length;
    const failed = frames.filter((f) => f.status === "error" || f.status === "failed").length;
    const line = `  ${done}/${frames.length} 完成${failed ? ` (${failed} 失败)` : ""} status=${p?.status} rows=${p?.metadata?.rows ?? "?"} cols=${p?.metadata?.columns ?? "?"}`;
    if (line !== last) { console.log(line); last = line; }
    if (p?.status === "completed" || p?.status === "ready" || (frames.length && done + failed >= frames.length)) {
      console.log(`帧生成结束: ${done} 成功 / ${failed} 失败`);
      break;
    }
  }

  // 下载 ZIP（含 sheet）
  try {
    const res = await fetch(`${BASE}/api/packs/${packId}/download.zip`, { headers: authHeaders() });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      const zipPath = join(OUT, `${a.preset || "pack"}-${packId.slice(0, 8)}.zip`);
      writeFileSync(zipPath, buf);
      console.log(`↓ ZIP ${zipPath} (${Math.round(buf.length / 1024)}KB)`);
    } else console.log(`ZIP 下载 HTTP ${res.status}`);
  } catch (e) { console.log("ZIP 下载异常:", e.message); }

  // 可选 SAM3 分层
  if (a.layers) {
    console.log("触发 SAM3 分层...");
    const lj = await api(`/api/packs/${packId}/layers/generate`, { method: "POST", body: JSON.stringify({ requestId: `layers-${packId.slice(0,8)}` }) });
    console.log("  layers 提交:", lj?.ok ?? lj?.status ?? JSON.stringify(lj).slice(0, 120));
    for (let i = 0; i < 200; i++) {
      await sleep(4000);
      const pv = await api(`/api/packs/${packId}/spine-sam3/preview.json`, { method: "GET" });
      if (pv && !pv.error && (pv.parts || pv.variants || pv.jobId)) {
        const qa = pv.quality || pv.qa || {};
        console.log("  SAM3 preview 就绪:", JSON.stringify({ score: qa.score, semanticWarnings: qa.semanticWarnings, parts: (pv.parts || []).length || pv.partCount }).slice(0, 200));
        writeFileSync(join(OUT, `${packId.slice(0,8)}-sam3-preview.json`), JSON.stringify(pv, null, 2));
        break;
      }
      if (pv?.error && pv.error !== "preview_pending" && i > 3) { console.log("  SAM3 preview:", pv.error); break; }
    }
  }
  console.log("完成。");
}

async function api(path, opts = {}, attempt = 0) {
  await sleep(PACE);
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: { "content-type": "application/json", ...authHeaders(), ...(opts.headers || {}) } });
  if (res.status === 429 && attempt < 12) {
    const retry = Number(res.headers.get("retry-after")) || 60;
    console.log(`  [429] 限流，${retry}s 后重试`);
    await sleep(retry * 1000);
    return api(path, opts, attempt + 1);
  }
  try { return await res.json(); } catch { return { ok: res.ok, status: res.status }; }
}

function authHeaders() { return { "x-lingji-access-token": TOKEN }; }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function fail(m) { console.error("错误:", m); process.exit(1); }
function readToken(f) { if (!existsSync(f)) return process.env.GENERATOR_ACCESS_TOKEN || ""; const m = readFileSync(f, "utf8").match(/GENERATOR_ACCESS_TOKEN\s*=\s*"?([^"\n]+)"?/); return m ? m[1].trim() : ""; }
function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--layers") o.layers = true;
    else if (k.startsWith("--")) o[k.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = argv[++i];
  }
  return o;
}

main().catch((e) => fail(e.stack || e.message));
