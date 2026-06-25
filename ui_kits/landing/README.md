# Landing Page · 首页

灵机阁 marketing landing. Entry: `index.html`.

Sections (well-factored JSX, each exports to `window`):
- `Shared.jsx` — `SectionHead`, `AssetTile` (themed game-asset preview), `LFIcon`.
- `TopNav.jsx` — sticky nav + 灵石 balance + 开始生成.
- `Hero.jsx` — 一念成图，万象皆可生成 + Prompt 示例卡 + 导出格式.
- `GenreShowcase.jsx` — **the 万象/不止仙侠 gallery** (10 题材 tiles).
- `Capabilities.jsx` — asset-type grid + HowItWorks 四步.
- `Sections.jsx` — `SpiritModel` (灵石规则), `PricingTeaser` (四档), `Footer`.

Loads `../../_ds_bundle.js` + Lucide. Composes DS components (`Button`, `SpiritStone`, `Badge`, `Card`).
