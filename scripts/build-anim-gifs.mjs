#!/usr/bin/env node
// 把多帧素材组(怪物动作 / 技能特效等)合成为循环动画 GIF,供展示页预览动起来。
// 复用浏览器端 GIF89a 编码器(gif-encoder.js)+ binary.js 的 PNG 解码。
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
import { decodePngRgba } from "../src/lib/binary.js";

const encSrc = readFileSync(new URL("../ui_kits/generator/gif-encoder.js", import.meta.url), "utf8");
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(encSrc, sandbox);
const enc = sandbox.window.LingjiGifEncoder;

async function buildGif(files, outPath, { delay = 220 } = {}) {
  const frames = [];
  for (const f of files) {
    const img = await decodePngRgba(readFileSync(new URL(`../${f}`, import.meta.url)));
    frames.push({ imageData: { data: img.data, width: img.width, height: img.height } });
  }
  const gif = enc.encodeAnimatedGif(frames, { delay, loop: 0, transparent: false });
  writeFileSync(new URL(`../${outPath}`, import.meta.url), Buffer.from(gif));
  console.log(`✓ ${outPath} (${frames.length} 帧, ${Math.round(gif.length / 1024)}KB)`);
}

const O = "assets/generated/official";
await buildGif(
  [`${O}/monster-idle.png`, `${O}/monster-move.png`, `${O}/monster-attack.png`, `${O}/monster-death.png`],
  `${O}/showcase-monster-anim.gif`,
);
await buildGif(
  [`${O}/skill-vfx-charge.png`, `${O}/skill-vfx-burst.png`, `${O}/skill-vfx-impact.png`, `${O}/skill-vfx-fade.png`],
  `${O}/showcase-vfx-anim.gif`,
  { delay: 160 },
);
