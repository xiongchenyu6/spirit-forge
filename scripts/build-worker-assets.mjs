import { cp, mkdir, rm } from "node:fs/promises";
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

console.log(`Built Worker assets in ${path.relative(root, out)}/`);
