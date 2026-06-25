---
name: lingji-forge-design
description: Use this skill to generate well-branded interfaces and assets for 灵机阁 Lingji Forge (面向中国创作者的 AI 游戏素材生成平台), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping. Visual style is 仙侠国风/炼器阁 (Eastern-fantasy forge), dark-first, gold + jade on ink — but content capability is 万象/all-genre, never only 仙侠.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

Key principle to never break: 灵机阁's **interface** is Eastern-fantasy 国风, but its **content capability is all-genre (万象)** — 仙侠, 武侠, 西幻, 科幻, 赛博朋克, 现代, 末日, Q版, 二次元, 像素, etc. Never present it as a 仙侠-only tool.

Foundations live in `styles.css` (a list of `@import`s). Link that one file to inherit every token, font and background-motif helper. Tokens are in `tokens/`; brand helpers (`.lf-bg-deep`, `.lf-plate`, `.lf-gold-text`, `.lf-scroll`) in `base.css`. Components are bundled in `_ds_bundle.js` under `window.LingjiForgeDesignSystem_e6d384` — see each component's `.prompt.md`. Full-screen recreations are in `ui_kits/`. Logo: `assets/logo-emblem-transparent.png` (dark-first; add a gold drop-shadow).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
