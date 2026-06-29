import { cp, mkdir, rm, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public");

const entries = [
  "index.html",
  "styles.css",
  "base.css",
  "_ds_bundle.js",
  "_ds_manifest.json",
  "tokens",
  "assets",
  "ui_kits",
];

const routeAliases = [
  "generator",
  "landing",
  "library",
  "templates",
  "pricing",
  "studio",
  "onboarding",
];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (const entry of entries) {
  await cp(path.join(root, entry), path.join(out, entry), {
    recursive: true,
    force: true,
  });
}

for (const alias of routeAliases) {
  await cp(path.join(root, "ui_kits", alias), path.join(out, alias), {
    recursive: true,
    force: true,
  });
}

// 缓存击穿:HTML(no-store,始终最新)里给本地代码/样式引用追加 ?v=<build>,
// 强制早期被 immutable 缓存住的客户端重新拉取新代码(进而引用新素材 URL)。
// 仅处理本地 .js/.jsx/.mjs/.css/.json,跳过 http(s) CDN 资源。
const BUILD_ID = Date.now().toString(36);
async function listHtml(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await listHtml(p));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}
const bustRe = /(\s(?:src|href)=")(?!https?:)([^"]+?\.(?:m?jsx?|css|json))(\?[^"]*)?(")/g;
for (const file of await listHtml(out)) {
  const html = await readFile(file, "utf8");
  const next = html.replace(bustRe, (_m, pre, url, query, post) => {
    const sep = query ? `${query}&` : "?";
    return `${pre}${url}${sep}v=${BUILD_ID}${post}`;
  });
  if (next !== html) await writeFile(file, next);
}

console.log(`Built Worker assets in ${path.relative(root, out)}/ (cache-bust v=${BUILD_ID})`);
