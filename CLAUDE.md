# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

灵机阁 Lingji Forge / Spirit Forge — an AI game-asset generator for Chinese creators. It is **two layers in one repo**:

1. **A static, component-driven design system** (`readme.md`, `AGENTS.md`, `SKILL.md` describe this in depth) — tokens, brand CSS, React-UMD components, and full-screen UI kits.
2. **A Cloudflare Worker application** (`src/worker.js`) that wraps Mistral (prompt planning) and a self-hosted ComfyUI backend (FLUX 2D, Hunyuan3D 3D, SAM3 layer separation, Spine rigging) behind a single-origin API, serving the UI kits as Worker static assets.

**Brand rule that must never break:** the *interface* is Eastern-fantasy 国风 (仙侠/炼器阁, dark gold + jade on ink), but the *content capability is all-genre (万象)* — 仙侠, 西幻, 科幻, 赛博朋克, 现代, Q版, 像素, etc. Never present it as a 仙侠-only tool. No emoji anywhere. See `readme.md` for the full content/visual spec.

## Commands

This repo has **no package.json / npm scripts**. Tooling is Nix + Node + Wrangler + sops, entered via direnv.

- **Enter dev env:** `direnv allow` (loads `flake.nix` devShell: node, sops, wrangler via corepack; auto-decrypts `secrets/local.env` into the environment).
- **Build Worker assets** (required before deploy and before local Worker preview — copies the static design system + UI kits into `public/`):
  `node scripts/build-worker-assets.mjs`
- **Local Worker dev:** `wrangler dev` (reads secrets from `.dev.vars`: `MISTRAL_API_KEY`, `COMFY_API_TOKEN`, `GENERATOR_ACCESS_TOKEN`).
- **Deploy:** `node scripts/build-worker-assets.mjs && wrangler deploy`. Set production secrets via `wrangler secret put …` (sourced from `sops -d --extract … secrets/local.env`; see `wrangler.toml` comments).
- **Static-only preview** (design system without the Worker API): `python3 -m http.server 4173` then open `http://localhost:4173/ui_kits/<kit>/index.html`. (`scripts/serve-with-router.py` mimics the Worker's route-alias behavior.)
- **Regression test** (live-Worker — verifies the SAM3 layer-separation / Spine pack pipeline):
  `node scripts/verify-spine-sam3-regression.mjs [--pack <id>] [--worker-url <url>] [--min-score 75] [--fail-on-drift]`
  Reads `GENERATOR_ACCESS_TOKEN` from `.dev.vars`. Run `--help` for all flags (report/html-report/baseline drift options).
- **i18n key check** (offline, no Worker — catches the white-screen-on-missing-key class of bug):
  `node scripts/check-i18n-keys.mjs` — for every UI kit using `__lf`, verifies the i18n keys it references (`__lf.t("a.b")`, `setPageTitle`, and `t.<prop>` under each `raw("section")`) exist in BOTH zh and en dicts. Non-zero exit on any missing key.

## Architecture

### Worker (`src/worker.js`, ~7800 lines, single file)

Entry is `export default { fetch }` (line ~664). Requests routed in two branches:

- `handleApi(request, env, url)` — all `/api/*` endpoints (dispatched by `url.pathname` string/regex matching, no router lib). Covers: capabilities/usage/queue, prompt planning (`/api/prompt` → Mistral), 2D/3D/video-sprite/2D-pack generation (→ ComfyUI), job polling (`/api/jobs/:id`), asset packs (`/api/packs/...`), the SAM3/Spine layer pipeline (`/api/packs/:id/spine-sam3/...`, `/api/packs/:id/layers/generate`), library, and ComfyUI proxying (`/api/comfy/view`). Full endpoint list in `docs/ai-generator-mvp.md`.
- `handleAssets(request, env, url)` — serves static UI from the `ASSETS` binding (the built `public/`), with clean-URL route aliases (`/`, `/landing`, `/studio`, …) and a generator-index fallback.

**Bindings (`wrangler.toml`):**
- `ASSETS` — Worker static assets from `public/` (built by `build-worker-assets.mjs`), `run_worker_first = true`.
- `ASSET_BUCKET` — R2 bucket `lingji-forge-assets`; persists job records, pack manifests, generated files, and ZIP/preview caches under `library/jobs/`, `library/packs/` key prefixes. Most persistence helpers no-op gracefully when this is absent.
- `USAGE_LIMITER` — Durable Object (`class UsageLimiter`, SQLite-backed) metering the shared access token (hourly/daily credit limits) before any Mistral/Comfy work is submitted.

**External services (config in `[vars]` + secrets):** Mistral (`MISTRAL_API_KEY`, `MISTRAL_MODEL`, `MISTRAL_BASE_URL`) for prompt planning only; ComfyUI (`COMFY_*` vars + `COMFY_API_TOKEN`) for generation — capabilities/models are detected at runtime via Comfy's object-info (see `selectVideoToSprite`, `selectLayerSeparation`, `getCapabilities`). Keys never reach the browser.

### Static design system (consumed by both UI kits and the SKILL)

- `styles.css` — single `@import` entry; pulls all `tokens/*.css` + `base.css`. Edit tokens here, every page inherits.
- `tokens/` — design tokens (colors, typography, spacing, radius, motion, elevation, fonts). CSS custom props are kebab-case (`--ink-*`, `--gold-*`, `--jade-*`, `--space-*`).
- `base.css` — reset + brand background-motif helpers (`.lf-bg-deep`, `.lf-plate`, `.lf-gold-text`, `.lf-scroll`).
- `components/` — reusable React components grouped by domain (`core`, `brand`, `forms`, `feedback`, `navigation`); each has `.jsx` + `.d.ts` + `.prompt.md`/`.card.html` spec.
- `_ds_bundle.js` — bundled components exposed at `window.LingjiForgeDesignSystem_e6d384`.
- `assets/` — brand icons/logos; `OrbIcon`/brand components resolve image paths via `window.LF_ICON_BASE` (set once per page, relative to project root).
- `ui_kits/` — full-screen pages (`generator`, `landing`, `studio`, `library`, `templates`, `pricing`, `onboarding`), each with an `index.html`. `generator/` (the app's first screen) and `library/` are the live, Worker-backed kits; the rest are largely static demos. `ui_kits/i18n.js` provides a zh/en dictionary (`?lang=` or `/en/` prefix).

## Conventions

- 2-space indent, semicolons, double-quoted strings. PascalCase component + file names. Functional React with explicit defaulted props.
- Pin/version external CDN imports (React UMD, Lucide `@0.468.0`, Google Fonts in `tokens/fonts.css`).
- Brand verbs are standardized (生成→开始生成/开始造物, 重新生成→重新推演, 额度→灵石…); see the table in `readme.md`. Icons: large category positions use `OrbIcon` (仙侠 orb art), small functional UI uses Lucide lines — but multi-genre previews must NOT use Orb (it reads as 仙侠-only).

## Secrets

`secrets/local.env` is committed **sops-encrypted** (age recipients in `.sops.yaml`, mirrored from the storyos infra). `.envrc` decrypts it into the shell. New machine: add its age key to `.sops.yaml` then `sops updatekeys secrets/*`. `.dev.vars` (gitignored) holds plaintext local Worker secrets. Never commit plaintext secrets; `secrets/*.dec|*.plain|decrypted-*` are gitignored.

## Notes

- `public/` is **build output** — never edit it directly; edit sources and re-run `build-worker-assets.mjs`.
- `docs/ai-generator-mvp.md` is the authoritative spec for the generator API surface, ComfyUI model/node requirements, and the current ComfyUI deployment state (worldsmith account, RTX 4090, FLUX + Hunyuan3D checkpoints).
