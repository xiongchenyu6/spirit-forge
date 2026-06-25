# Creation Studio · 创作台

The core product screen. Entry: `index.html` (holds shared state: 灵石余额, 参数, 生成阶段).

- `StudioTopBar.jsx` — logo, project switcher, 看广告领取灵石, 灵石余额, avatar.
- `StudioNav.jsx` — left asset-type nav (角色/怪物/道具/技能/地图/建筑/UI/图标/动画 + 素材库/模板) + 升级月卡 promo.
- `StudioCanvas.jsx` — Prompt 输入框 + 透明背景开关 + result tabs (候选结果 / 动画预览 / Sprite Sheet) + 放大/重新推演/导出 toolbar. Candidate grid shows checkerboard transparency + per-genre themed art.
- `ParamPanel.jsx` — right panel: 题材/风格/视角/动作/尺寸/用途/输出格式 + 风格锁定/批量 + sticky 生成 footer with 灵石 cost.
- `AdModal.jsx` — `AdRewardModal`: 广告激励弹窗 (prompt → playing → done). Also the 灵石不足 variant.

**Interactive flow:** 开始生成 deducts 灵石 (`calcCost`), runs a progress推演, shows results. If 灵石 < cost → opens 灵石不足 ad modal. Watching the ad credits +5.
