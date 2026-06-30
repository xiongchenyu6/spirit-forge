#!/usr/bin/env node
// 校验 UI kit 里引用的 i18n 键是否在字典(zh & en)中存在,防止键名错配导致整页白屏。
// 检测两类引用:
//   1) 字面键:__lf.t("a.b.c") / setPageTitle("a.b")
//   2) t.<prop>:在该文件用到的 raw("段") 上下文里,t.<prop> 必须在某个段下存在
// 有问题 → 非零退出码(可接入回归/CI)。
//
// 用法: node scripts/check-i18n-keys.mjs
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const I18N = join(ROOT, "ui_kits/i18n.js");
const src = readFileSync(I18N, "utf8");

function loadDict(lang) {
  const sandbox = {
    window: { location: { search: lang === "en" ? "?lang=en" : "", pathname: "/" } },
    document: { documentElement: {} },
    URLSearchParams,
  };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window.__lf;
}
const zh = loadDict("zh");
const en = loadDict("en");
const has = (lf, path) => lf.raw(path, "\0M\0") !== "\0M\0" && lf.raw(path) !== undefined;

// 自动发现使用 __lf 的 kit 文件(index.html + *.js),新 kit 无需改脚本。
function discoverFiles() {
  const base = join(ROOT, "ui_kits");
  const files = [];
  for (const entry of readdirSync(base)) {
    const dir = join(base, entry);
    if (!statSync(dir).isDirectory()) continue;
    for (const f of readdirSync(dir)) {
      if (!/\.(html|js)$/.test(f)) continue;
      const p = join(dir, f);
      if (readFileSync(p, "utf8").includes("__lf")) files.push(p.slice(ROOT.length + 1));
    }
  }
  return files.sort();
}

let problems = 0;
for (const rel of discoverFiles()) {
  const code = readFileSync(join(ROOT, rel), "utf8");
  const sections = [...code.matchAll(/raw\(\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
  const literalKeys = [...new Set([...code.matchAll(/(?:__lf\.t|setPageTitle)\(\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]))];
  const props = [...new Set([...code.matchAll(/\bt\.([a-zA-Z_$][\w$]*)/g)].map((m) => m[1]))];

  const issues = [];
  for (const key of literalKeys) {
    if (!has(zh, key)) issues.push(`字面键缺失(zh): "${key}"`);
    else if (!has(en, key)) issues.push(`字面键缺失(en): "${key}"`);
  }
  if (sections.length) {
    for (const p of props) {
      if (!sections.some((s) => has(zh, `${s}.${p}`))) {
        issues.push(`t.${p} 在 [${sections.join(", ")}] 段中均不存在(zh)`);
      } else if (!sections.some((s) => has(en, `${s}.${p}`))) {
        issues.push(`t.${p} 在 en 段中缺失`);
      }
    }
  }
  if (issues.length) {
    problems += issues.length;
    console.log(`\n✗ ${rel}  (sections: ${sections.join(", ") || "无"})`);
    for (const i of issues) console.log(`   - ${i}`);
  } else {
    console.log(`✓ ${rel}`);
  }
}
console.log(problems ? `\n共 ${problems} 处可疑 i18n 键引用` : "\n全部通过");
process.exit(problems ? 1 : 0);
