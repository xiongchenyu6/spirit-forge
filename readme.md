# 灵机阁 Lingji Forge — Design System

> 面向中国创作者的 AI 游戏素材生成平台。
> **一念成图，万象皆可生成。**

灵机阁是一款以 **东方美学（仙侠国风 / 机关阁 / 炼器台）** 为界面风格、以 **「万象生成」** 为核心能力的 AI 游戏素材工具。视觉是高阶造物台，功能是专业生产力工具。

**关键定位（必须牢记）：** 网页视觉是仙侠国风，但**内容能力包罗万象**——支持仙侠、武侠、西幻、科幻、赛博朋克、现代都市、末日生存、Q版、二次元、像素、卡通等所有题材。它**不是只做仙侠素材的工具**。任何界面与文案都要传达"万象"，避免让用户误解。

用户用中文描述需求，即可生成角色、怪物、NPC、地图、道具、装备、技能特效、UI 组件、图标、头像、Sprite Sheet、4/8 方向动画等资产，并导出透明 PNG、GIF、Sprite Sheet、JSON Metadata。商业模式以激励广告为主（看广告领「灵石」生成额度），会员订阅为补充。

**目标用户：** 中国独立游戏开发者、微信/抖音小游戏团队、Cocos Creator / Unity / Godot / RPG Maker 开发者、AIGC 互动内容创作者。

## 来源与素材
- 品牌徽记原图：`uploads/ChatGPT Image 2026年6月24日 15_38_47.png`（已复制为 `assets/logo-emblem.png`，并抠出透明版 `assets/logo-emblem-transparent.png`）。
- 无外部 codebase / Figma；本设计系统依据产品 brief 从零构建，以徽记为视觉锚点。
- **字体替换说明：** 暂用 Google Fonts 的 **Noto Serif SC / Noto Sans SC / Ma Shan Zheng / JetBrains Mono**（经 `@import` 引入，见 `tokens/fonts.css`）。若有授权品牌字体，请替换该文件中的 `@import` 目标即可。

---

## CONTENT FUNDAMENTALS · 文案规范

**语气：** 东方幻想感 + 专业清晰。有"造物/炼器"的意象点缀，但**不中二、不堆砌**；产品能力表达永远直接、可信、可商用。一千个"不"换一个"是"——少即是多。

**人称：** 对用户用"你"，平台自称"灵机阁"。简体中文为主，技术名词（Sprite Sheet、JSON、PNG、API、Unity、Godot）保留英文原样。

**大小写与排版：** 中文不使用句号堆砌口号；标题用四字/短句（"一念成图""万象皆可生成""开始造物"）。英文与数字用 `JetBrains Mono`（尺寸 64×64、帧数、灵石数）。中英之间留 1 空格。

**品牌动词表（统一使用）：**
| 场景 | 用语 |
|---|---|
| 生成 | 开始生成 / 开始造物 |
| 重新生成 | 重新推演 |
| 导出 | 导出素材 |
| 素材库 | 我的素材库 |
| 模板市场 | 万象模板 |
| 额度 | 灵石 |
| 额度不足 | 灵石不足，可观看广告补充 |

**示例文案：**
- Hero 标题：`一念成图，万象皆可生成`
- Hero 副标题：`角色、怪物、地图、道具、技能特效、UI 组件……输入中文描述，即可生成适用于多种游戏题材的可用素材。`
- 广告弹窗：标题`看广告领取灵石` / 说明`完整观看一条广告，可获得 5 灵石，用于素材生成、动画生成和高清导出。` / 主按钮`观看广告` / 次按钮`暂不领取` / 完成`灵石 +5，今日还可领取 3 次`

**Emoji：** 不使用。强调用鎏金菱形「灵石」符号、细金描边与发光，而非 emoji。

---

## VISUAL FOUNDATIONS · 视觉基础

**整体气质：** 仙侠国风 + 现代 AI 工具。深色优先（墨黑虚空），由鎏金与玄青的"灵光"点亮。克制、高级、清晰，绝不廉价页游风。

**色彩（五色 + 玉白）：** 见 `tokens/colors.css`。
- **墨黑** `--ink-*`：界面虚空与表面层级（底→卡→抬升控件，靠明度区分）。
- **玄青** `--jade-*`：品牌副色，灵气/玉石；次级操作、成功态、青色光晕。
- **鎏金** `--gold-*`：主操作、灵石、发光强调——深色界面的主"灵光"来源。
- **月光蓝** `--moon-*`：信息态、冷光点缀。
- **朱砂** `--cinnabar-*`：少量点缀与危险/警示，**克制使用**。
- **玉白 / 玉简竹简** `--jade-white` `--paper-*`：文字与浅色值。

**字体：** 标题/品牌用 `--font-serif`（Noto Serif SC，宋明体气质，字重可达 900）；界面/正文用 `--font-sans`（Noto Sans SC）；参数/Metadata 用 `--font-mono`（JetBrains Mono）；品牌点缀用 `--font-script`（Ma Shan Zheng，手写，**极克制**）。中文行高偏舒展（正文 1.6），标题字距收紧。

**间距：** 4px 基准网格（`--space-*`）。创作台三栏：左导航 248、右参数 320、顶栏 64。

**圆角与切角：** 偏锐利。常规圆角 `--radius-sm/md/lg`（5/8/12）；特殊"机关阁/炼器台"面板用**切角** `--cut-corner`（clip-path 斜切左上右下角）——用于弹窗、引导卡等高规格表面。

**背景母题：** 低透明度的水墨/云雾/阵法/星盘。提供工具类：`.lf-bg-deep`（虚空 + 微弱鎏金/玄青径向灵光）、`.lf-bg-array`（阵法/星盘同心环纹理）、`.lf-bg-mist`（底部云雾水汽带）。徽记常作低透明度水印（opacity 0.06–0.12）。

**阴影与灵光：** 深色 UI 的层次来自"深阴影 + 发光"。`--shadow-card/panel/pop/modal` 投入墨色；`--glow-gold/jade/moon/spirit` 为发光（灵石 `--glow-spirit` 为双层金光）。卡片 = 表面色 + 细金描边（`--border-subtle`）+ `--shadow-card` + 顶部内高光（`--inset-top`）。

**边框：** 全部为**金调发丝线**（`--border-subtle/default/strong`，rgba 鎏金不同透明度）；分隔线用 `--divider`（极淡玉白）。

**动效：** 克制、顺滑、有"灵气流动"感。时长偏短（`--dur-fast/base/slow`），缓动偏 out（`--ease-out`）。Hover：卡片上浮 2–4px + 描边变亮 + 发光；金色按钮提亮 + 金光。Press：轻微缩小（`--press-scale` 0.97），**绝不弹跳**。进度/推演用流光 shimmer。`prefers-reduced-motion` 下全部降级。

**透明与模糊：** 顶栏、弹窗遮罩用 `backdrop-filter: blur`。遮罩为 `--ink-fog`（深墨半透明）。

**图像色调：** 题材预览以"中心径向渐变 + 大号图标 + 发光"表达，色调随题材而变（仙侠青金、赛博霓虹、科幻钢蓝、Q版暖绿…），整体偏冷、克制、有玉石/灵气质感。透明素材底用棋盘格表示。

---

## ICONOGRAPHY · 图标

灵机阁 使用**两层图标体系**：

**1. 仙侠 Orb Icons（主图标 · 品牌资产）** — 来自上传的国风图标集，已切片为透明圆形 PNG 存于 `assets/icons/`（22 枚：emblem / crystal / scroll / censer / gourd / pagoda / sword / portal / scroll-bamboo / book / meditation / mountain / taiji / crane / starchart / pouch / talisman / gem / beast / shrine / brush / chest）。这些是厚涂玻璃宝珠 + 鎏金描边 + 青色灵光的高质感画面图标，**用于品类 / 资产类型 / 导航 / 货币等大图标位**。组件 `OrbIcon` 封装其用法：
```jsx
window.LF_ICON_BASE = "../../";   // 页面相对项目根的前缀，设一次
<OrbIcon name="meditation" size={40} />        // 角色
<OrbIcon name="beast" framed active />         // 怪物（选中）
```
产品语义映射：角色=meditation · 怪物=beast · 道具/装备=gem · 技能特效=portal · 地图=mountain · 建筑=pagoda · UI=starchart · 图标=talisman · 头像=taiji · 动画=crane · 素材库=chest · 模板=book · 灵石=crystal/gem。

**2. Lucide 线性图标（功能 UI）** — CDN `https://unpkg.com/lucide@0.468.0`，用于**小尺寸功能性图标**（工具栏 放大/导出/重新推演、搜索、勾选、箭头、播放等）。`<i data-lucide="…">` + `lucide.createIcons()`。这与参考图中"画面宝珠图标 + 细线功能图标"并存的体系一致。

**用法边界：** 大品类用 Orb，小功能用 Lucide。**多题材内容**（仙侠/西幻/科幻/赛博朋克…）的题材预览**不用 Orb**（Orb 为仙侠画风），而用"渐变 + Lucide + 发光"瓦片表达，以免把"万象"误传成"只做仙侠"。

**品牌符号「灵石」：** 旋转 45° 的鎏金菱形（gradient + `--glow-spirit`），用于余额/消耗/奖励（`SpiritStone` 组件）；大尺寸场景可用 `OrbIcon name="crystal"`。

**徽记 Logo：** `assets/logo-emblem.png`（黑底原图）/ `assets/logo-emblem-transparent.png`（透明）。深色界面首选透明版 + 金色 drop-shadow。

**已切片 UI 部件（`assets/ui/`）：** `btn-teal` / `btn-paper`（厚涂按钮 → `OrnateButton`）· `slot`（金边方框 → `OrnatePanel` 的 9-slice 源）· `corner`（角标花纹 → `CornerFrame`）· `divider-cloud`（云纹分隔 → `CloudDivider`）· `plate`（匾额 → `OrnatePlate`）· `reward-box`（宝箱 → `RewardBurst`）· `bar-frame`（血条槽 → `OrnateBar`）· `banner-teal` / `banner-paper`（旗幡 → `Banner`）· `feature-frame`（楼阁画框 → `FeaturePanel`）· `coin-crystal`（蓝水晶，灵石货币）/ `coin-gold` / `coin-jade` · `compass`（罗盘）· `ring-cloud` / `ring-timer`（灵环/计时环）· `bar-hp` / `bar-mp`（资源条示意）。**所有 brand 组件用 `window.LF_ICON_BASE`（相对项目根的前缀，页面里设一次）解析图片路径。**

**原始素材大图：** `assets/_sheet-icons.png`（圆形图标）、`assets/_sheet-ui1.png`、`assets/_sheet-ui2.png`，可继续切片提取更多部件（血条满帧、技能格、银两面板、卷轴弹窗、悬挂旗幡等）。

**Emoji / Unicode：** 不作为图标使用。

---

## INDEX · 文件清单

**基础（consumers 引入 `styles.css` 一个文件即可）**
- `styles.css` — 入口，仅 `@import`。
- `tokens/` — `fonts.css` `colors.css` `typography.css` `spacing.css` `radius.css` `elevation.css` `motion.css`
- `base.css` — reset + 背景母题工具类（`.lf-bg-*` `.lf-plate` `.lf-gold-text` `.lf-scroll` 等）
- `assets/` — `logo-emblem.png` `logo-emblem-transparent.png`

**组件**（`window.LingjiForgeDesignSystem_e6d384.*`，见各 `.prompt.md`）
- core：`Button` `IconButton` `SpiritStone`（灵石，默认真水晶画面）`Badge` `Card` `Avatar`
- brand：`OrbIcon`（22 枚仙侠宝珠图标）· `OrnateButton`（厚涂鎏金按钮）· `OrnatePanel`（金边描框 9-slice）· `CornerFrame`（角标花纹）· `CloudDivider`（云纹分隔）· `OrnatePlate`（匾额）· `RewardBurst`（宝箱奖励）· `OrnateBar`（血条/进度）· `Banner`（旗幡）· `FeaturePanel`（卷轴/匾额弹窗）
- forms：`PromptInput` `Tag` `Input` `Select` `Switch` `SegmentedControl`
- feedback：`ProgressBar` `Dialog`
- navigation：`NavItem`

**UI Kits**（`ui_kits/<product>/index.html`）
- `landing/` — 首页 Landing（Hero · 万象题材 · 资产类型 · 灵石 · 定价）
- `studio/` — 创作台（左导航 · Prompt · 候选/动画/Sprite · 参数面板 · 广告弹窗）
- `pricing/` — 会员定价页（四档 · 灵石规则 · 激励说明）
- `library/` — 我的素材库（集合 · 筛选 · 资产网格）
- `templates/` — 万象模板市场（精选 · 多题材 · 套用）
- `onboarding/` — 新用户引导（欢迎 · 偏好 · 领取灵石 · 完成）

**规范卡片** — `guidelines/*.card.html`（Colors / Type / Spacing / Brand），在 Design System 标签页展示。

**前端实现说明（布局速查）**
- 创作台为三栏 flex：左 `--studio-nav-w`(248) · 中 flex:1 可滚动 · 右 `--studio-param-w`(320)，顶栏 `--studio-header-h`(64)。右栏底部为 sticky 生成 footer，显示本次灵石消耗与余额。
- 灵石消耗规则（计费）：普通 1 / 高清导出 3 / 4方向 4 / 8方向 6 / 动画 Sprite Sheet 8 / 批量 +10 / 风格锁定 +15（取 max 后叠加批量与锁定，见 `ui_kits/studio/index.html` 的 `calcCost`）。
- 广告**绝不强制弹窗**：入口在顶栏灵石旁、灵石不足时、每日任务、免费用户生成前提示。
