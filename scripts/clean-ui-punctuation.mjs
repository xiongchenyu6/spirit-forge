#!/usr/bin/env node
// 清理 UI 微文案里"露出来"的标点：去掉短文案/标题/标签/提示末尾的句号(。)，
// 软化感叹号(！)。遵循品牌规范"中文不使用句号堆砌口号"、克制标点、无 emoji。
//
// 只动可见文案字符串里的终结性标点，不碰代码、URL、数字、内部分隔符(，；、)。
// 规则：
//   1. 句号 。 紧邻字符串/标签结束符（" ' ` 或 <）时删除——即"行尾/句尾露出的句号"。
//   2. 感叹号 ！ 后接中日韩字符时替换为逗号 ，；后接结束符时删除。
//   3. 省略号 …。 这类组合不动（… 是设计用语）。
//
// 用法:
//   node scripts/clean-ui-punctuation.mjs --dry           # 只打印将改动的行
//   node scripts/clean-ui-punctuation.mjs --write FILE...  # 原地清理指定文件
//   node scripts/clean-ui-punctuation.mjs --write-ui       # 清理默认 UI 文件集

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const DEFAULT_FILES = [
  "ui_kits/generator/index.html",
  "ui_kits/generator/app.js",
  "ui_kits/i18n.js",
  "ui_kits/library/index.html",
  "ui_kits/library/app.js",
];

const argv = process.argv.slice(2);
const dry = argv.includes("--dry");
const writeUi = argv.includes("--write-ui");
const explicit = argv.filter((a) => !a.startsWith("--"));
const files = explicit.length ? explicit : DEFAULT_FILES;

function clean(text) {
  const changes = [];
  const lines = text.split("\n");
  const out = lines.map((line, i) => {
    let next = line;
    // 1) 句号紧邻结束符 → 删除
    next = next.replace(/。(?=["'`<])/g, "");
    // 2) 感叹号：后接 CJK → 逗号；后接结束符 → 删除
    next = next.replace(/！(?=[一-鿿぀-ヿ])/g, "，");
    next = next.replace(/！(?=["'`<])/g, "");
    if (next !== line) changes.push({ line: i + 1, before: line.trim(), after: next.trim() });
    return next;
  });
  return { text: out.join("\n"), changes };
}

let total = 0;
for (const f of files) {
  if (!existsSync(f)) { console.log(`跳过(不存在): ${f}`); continue; }
  const src = readFileSync(f, "utf8");
  const { text, changes } = clean(src);
  if (!changes.length) { console.log(`无改动: ${f}`); continue; }
  total += changes.length;
  console.log(`\n=== ${f} (${changes.length} 处) ===`);
  for (const c of changes.slice(0, 40)) {
    console.log(`  L${c.line}`);
    console.log(`    - ${c.before.slice(0, 110)}`);
    console.log(`    + ${c.after.slice(0, 110)}`);
  }
  if (changes.length > 40) console.log(`  …还有 ${changes.length - 40} 处`);
  if (!dry && (writeUi || explicit.length)) { writeFileSync(f, text); console.log(`  ✓ 已写入`); }
}
console.log(`\n合计 ${total} 处标点清理。${dry ? "(dry-run，未写入)" : ""}`);
