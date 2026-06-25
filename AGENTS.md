# Repository Guidelines

This repository is a static, component-driven design system for 灵机阁 Lingji Forge. Most output is browser-rendered HTML using shared CSS tokens and React UMD builds.

## Project Structure & Module Organization
- `components/` contains reusable UI modules, grouped by area (`core`, `brand`, `forms`, `feedback`, `navigation`) with matching `.jsx`, `.d.ts`, and `.prompt.md`/`.card.html` spec files.
- `tokens/` holds design tokens (`colors.css`, `typography.css`, `spacing.css`, `radius.css`, `motion.css`, `elevation.css`, `fonts.css`).
- `styles.css` is the single import entry for token layers; `base.css` adds global helpers.
- `assets/` stores icons, bitmap ornaments, and logos; `guidelines/` stores visual guideline cards.
- `ui_kits/` contains playable pages (`landing`, `studio`, `library`, `templates`, `pricing`, `onboarding`) each with an `index.html` entry.
- `_ds_bundle.js` exposes shared components under `window.LingjiForgeDesignSystem_e6d384`.

## Build, Test, and Development Commands
- No project-level build/test toolchain is committed in this checkout.
- Run local previews with:
  - `python3 -m http.server 4173`
  - then open `http://localhost:4173/ui_kits/landing/index.html` (or another kit path).
- Optional if Node is preferred and available:
  - `npx serve .`.
- `styles.css` should be edited first; pages pick up token changes through `../../styles.css` imports in each page entry.

## Coding Style & Naming Conventions
- Use 2-space indentation, semicolons, and double-quoted strings.
- Use PascalCase for component names and matching file names.
- Group shared primitives by folder domain (e.g., `components/core/`, `components/forms/`).
- Keep React components functional and prefer explicit props with defaults.
- CSS custom properties use kebab-case (`--ink-*`, `--gold-*`, `--space-*`).
- Keep visual naming aligned with brand language in `readme.md` and avoid adding emoji.
- Keep external CDN imports versioned and pinned.

## Testing Guidelines
- No automated test framework is currently configured.
- Validate changes by manual smoke check across pages:
  1) open each updated kit route,
  2) run browser console for errors,
  3) verify responsive behavior for narrow viewports,
  4) confirm component states (default/hover/disabled/loading) render correctly.
- Keep screenshot capture in notes if visual output is touched.

## Commit & Pull Request Guidelines
- No git history is available in this environment (`.git` not present), so commit conventions are not recoverable from repo metadata.
- Recommended convention:
  - `type(scope): imperative summary` (e.g., `feat(studio): add batch generation cost badge`, `fix(pricing): align spirit reward labels`).
- PRs should include: changed pages/components, screenshot or short recording, verification command used, and any token/asset updates.

## Security & Configuration Notes
- Treat external asset/CDN usage as dependencies: do not edit remote URLs without reason, and prefer pinning versions.
- Keep brand assets under `assets/` for offline reproducibility.
