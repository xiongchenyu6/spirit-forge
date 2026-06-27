/* Landing — shared bits: icon helper, decorative emblem, section heading, AssetTile.
 * Exported to window for sibling babel scripts. */

const LFIcon = ({ name, size = 18, color, style = {} }) =>
  React.createElement("i", { "data-lucide": name, style: { width: size, height: size, color, ...style } });

const generatedAssetPath = (file) => `../../assets/generated/official/${file}`;
const OFFICIAL_SAMPLE_BY_IMAGE = {
  "monster-idle.png": sampleInfo("sample-monster-actions", "monster-actions", "creature", "pixel", "front", "一只深色甲壳怪物，清楚头部、身体、前爪、腿和尾部；像素风，正面游戏精灵，完整身体居中，纯色背景，需要 idle、move、attack、death 四帧动作"),
  "monster-move.png": sampleInfo("sample-monster-actions", "monster-actions", "creature", "pixel", "front", "一只深色甲壳怪物，清楚头部、身体、前爪、腿和尾部；像素风，正面游戏精灵，完整身体居中，纯色背景，需要 idle、move、attack、death 四帧动作"),
  "monster-attack.png": sampleInfo("sample-monster-actions", "monster-actions", "creature", "pixel", "front", "一只深色甲壳怪物，清楚头部、身体、前爪、腿和尾部；像素风，正面游戏精灵，完整身体居中，纯色背景，需要 idle、move、attack、death 四帧动作"),
  "monster-death.png": sampleInfo("sample-monster-actions", "monster-actions", "creature", "pixel", "front", "一只深色甲壳怪物，清楚头部、身体、前爪、腿和尾部；像素风，正面游戏精灵，完整身体居中，纯色背景，需要 idle、move、attack、death 四帧动作"),
  "skill-vfx-charge.png": sampleInfo("sample-skill-vfx", "skill-vfx", "vfx", "pixel", "front", "像素风雷火技能特效，蓝紫闪电缠绕金色火花；需要 charge、burst、impact、fade 四帧循环，居中，纯色背景，轮廓清晰"),
  "skill-vfx-burst.png": sampleInfo("sample-skill-vfx", "skill-vfx", "vfx", "pixel", "front", "像素风雷火技能特效，蓝紫闪电缠绕金色火花；需要 charge、burst、impact、fade 四帧循环，居中，纯色背景，轮廓清晰"),
  "skill-vfx-impact.png": sampleInfo("sample-skill-vfx", "skill-vfx", "vfx", "pixel", "front", "像素风雷火技能特效，蓝紫闪电缠绕金色火花；需要 charge、burst、impact、fade 四帧循环，居中，纯色背景，轮廓清晰"),
  "skill-vfx-fade.png": sampleInfo("sample-skill-vfx", "skill-vfx", "vfx", "pixel", "front", "像素风雷火技能特效，蓝紫闪电缠绕金色火花；需要 charge、burst、impact、fade 四帧循环，居中，纯色背景，轮廓清晰"),
  "map-grass.png": sampleInfo("sample-map-tiles", "map-tiles", "map", "pixel", "top-down", "俯视 RPG 地图 tile 表：草地、泥路、石路、水边、悬崖、沙地、森林地表、熔岩岩地；需要可平铺方块"),
  "map-stone-road.png": sampleInfo("sample-map-tiles", "map-tiles", "map", "pixel", "top-down", "俯视 RPG 地图 tile 表：草地、泥路、石路、水边、悬崖、沙地、森林地表、熔岩岩地；需要可平铺方块"),
  "map-water-edge.png": sampleInfo("sample-map-tiles", "map-tiles", "map", "pixel", "top-down", "俯视 RPG 地图 tile 表：草地、泥路、石路、水边、悬崖、沙地、森林地表、熔岩岩地；需要可平铺方块"),
  "map-forest-floor.png": sampleInfo("sample-map-tiles", "map-tiles", "map", "pixel", "top-down", "俯视 RPG 地图 tile 表：草地、泥路、石路、水边、悬崖、沙地、森林地表、熔岩岩地；需要可平铺方块"),
  "ui-kit-components-sheet.png": sampleInfo("sample-ui-kit", "ui-kit", "ui", "production", "front", "奇幻游戏 UI 套件：生命条、法力条、背包格、动作按钮、对话面板、任务面板、九宫格角件、装饰分隔线；每格一个可切图组件"),
  "ui-modern-hud.png": sampleInfo("sample-ui-kit", "ui-kit", "ui", "production", "front", "奇幻游戏 UI 套件：生命条、法力条、背包格、动作按钮、对话面板、任务面板、九宫格角件、装饰分隔线；每格一个可切图组件"),
  "item-gem.png": sampleInfo("sample-ui-icons", "ui-icons", "icon", "pixel", "front", "RPG 背包图标表：玉剑、红药水、盾、钥匙、金币、卷轴、宝石、靴子；每格一个物品"),
  "item-jade-sword.png": sampleInfo("sample-ui-icons", "ui-icons", "icon", "pixel", "front", "RPG 背包图标表：玉剑、红药水、盾、钥匙、金币、卷轴、宝石、靴子；每格一个物品"),
  "item-shield.png": sampleInfo("sample-ui-icons", "ui-icons", "icon", "pixel", "front", "RPG 背包图标表：玉剑、红药水、盾、钥匙、金币、卷轴、宝石、靴子；每格一个物品"),
  "3f0120ef.png": { generatorUrl: "/generator/?preset=sprite&assetType=creature&style=pixel&camera=front&brief=%E5%83%8F%E7%B4%A0%E9%A3%8E%E5%8F%B2%E8%8E%B1%E5%A7%86%E6%80%AA%E7%89%A9%EF%BC%8C%E5%8D%95%E5%B8%A7%E7%B2%BE%E7%81%B5%E5%9B%BE%EF%BC%8C%E9%80%8F%E6%98%8E%E8%83%8C%E6%99%AF%EF%BC%8C%E6%B8%B8%E6%88%8F%E5%8F%AF%E7%94%A8" },
  "ec601ceb.png": { generatorUrl: "/generator/?preset=icon&assetType=prop&style=pixel&camera=front&brief=%E5%83%8F%E7%B4%A0%E9%A3%8E%E7%81%B5%E7%9F%B3%E9%81%93%E5%85%B7%E5%9B%BE%E6%A0%87%EF%BC%8C%E9%80%8F%E6%98%8E%E8%83%8C%E6%99%AF%EF%BC%8C%E8%83%8C%E5%8C%85%E5%8D%95%E6%A0%BC%E5%8F%AF%E7%94%A8" },
};

function sampleInfo(id, preset, assetType, style, camera, brief) {
  const params = new URLSearchParams({ preset, assetType, style, camera, brief });
  return {
    id,
    generatorUrl: `/generator/?${params.toString()}`,
    zipUrl: `/api/demo/official-samples/${encodeURIComponent(id)}/download.zip`,
  };
}

function officialSampleInfoForImage(image) {
  const file = String(image || "").split("/").pop();
  return OFFICIAL_SAMPLE_BY_IMAGE[file] || null;
}

function SectionHead({ kicker, title, sub, align = "center" }) {
  return (
    <div style={{ textAlign: align, maxWidth: 720, margin: align === "center" ? "0 auto" : 0 }}>
      {kicker && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ width: 6, height: 6, background: "var(--gold-400)", transform: "rotate(45deg)", boxShadow: "var(--glow-spirit)" }} />
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, letterSpacing: "var(--tracking-wider)", color: "var(--gold-300)", textTransform: "uppercase" }}>{kicker}</span>
        </div>
      )}
      <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 40, lineHeight: 1.2, color: "var(--text-primary)", margin: 0, letterSpacing: "var(--tracking-tight)" }}>{title}</h2>
      {sub && <p style={{ fontFamily: "var(--font-sans)", fontSize: 16, lineHeight: 1.7, color: "var(--text-secondary)", margin: "16px auto 0", maxWidth: 640 }}>{sub}</p>}
    </div>
  );
}

function AssetTile({ genre, sub, icon, from, to, glow, tags = [], size, large = false, image }) {
  const imageSrc = image
    ? image.includes("/") ? image : generatedAssetPath(image)
    : "";
  const sample = officialSampleInfoForImage(image);
  const isEnglish = window.__lf?.lang === "en";
  const primaryLabel = isEnglish ? "Use prompt" : "套用模板";
  const secondaryLabel = isEnglish ? "Download ZIP" : "下载 ZIP";
  const stopLinkClick = (event) => event.stopPropagation();
  const openPrimary = () => {
    if (sample?.generatorUrl) window.location.href = sample.generatorUrl;
  };
  return (
    <div style={{
      position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden",
      border: "1px solid var(--border-subtle)", background: "var(--surface-card)",
      aspectRatio: large ? "16 / 10" : "3 / 4", minHeight: large ? 220 : 0,
      cursor: sample?.generatorUrl ? "pointer" : "default", transition: "transform var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
    }}
      role={sample?.generatorUrl ? "link" : undefined}
      tabIndex={sample?.generatorUrl ? 0 : undefined}
      data-sample-id={sample?.id || undefined}
      data-generator-url={sample?.generatorUrl || undefined}
      onClick={openPrimary}
      onKeyDown={(event) => {
        if (sample?.generatorUrl && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          openPrimary();
        }
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.boxShadow = "var(--shadow-panel)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {imageSrc ? (
        <>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%), rgba(2,6,10,0.82)",
            backgroundSize: "18px 18px",
            backgroundPosition: "0 0, 0 9px",
          }} />
          <img src={imageSrc} alt={genre} loading="lazy" style={{
            position: "absolute", inset: large ? "14px 18px 104px" : sample?.generatorUrl ? "12px 12px 116px" : "12px 12px 72px",
            width: `calc(100% - ${large ? 36 : 24}px)`,
            height: `calc(100% - ${large ? 118 : sample?.generatorUrl ? 128 : 84}px)`,
            objectFit: "contain",
            imageRendering: "pixelated",
            filter: "drop-shadow(0 14px 22px rgba(0,0,0,0.38))",
          }} />
          <span style={{ position: "absolute", top: 8, left: 8, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--jade-200)", background: "rgba(7,9,11,0.74)", border: "1px solid rgba(90,218,178,0.28)", borderRadius: "var(--radius-sm)", padding: "2px 7px" }}>AI TEST OUTPUT</span>
        </>
      ) : (
        <>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 90% at 50% 18%, ${from}, ${to} 70%)` }} />
          <div style={{ position: "absolute", inset: 0, background: "repeating-radial-gradient(circle at 50% 35%, transparent 0 26px, rgba(255,255,255,0.03) 26px 27px)", opacity: 0.5 }} />
          <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", color: "rgba(255,255,255,0.92)", filter: `drop-shadow(0 0 18px ${glow})` }}>
            <i data-lucide={icon} style={{ width: large ? 64 : 46, height: large ? 64 : 46 }} />
          </div>
          <span style={{ position: "absolute", top: 8, left: 8, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", background: "rgba(7,9,11,0.74)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "2px 7px" }}>NEXT TEST</span>
        </>
      )}
      {/* bottom plate */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: large ? 18 : 13, background: "linear-gradient(to top, rgba(7,9,11,0.92), rgba(7,9,11,0.55) 60%, transparent)" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: large ? 20 : 15, color: "#fff", letterSpacing: "var(--tracking-tight)" }}>{genre}</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: large ? 13 : 11, color: "rgba(244,241,232,0.7)", marginTop: 3 }}>{sub}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 9 }}>
          {tags.map((t) => (
            <span key={t} style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--gold-200)", background: "rgba(201,163,91,0.16)", border: "1px solid rgba(201,163,91,0.3)", borderRadius: "var(--radius-sm)", padding: "2px 7px" }}>{t}</span>
          ))}
          {size && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(244,241,232,0.55)", padding: "2px 0", marginLeft: "auto" }}>{size}</span>}
        </div>
        {sample?.generatorUrl && (
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <a href={sample.generatorUrl} onClick={stopLinkClick} style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 26, padding: "0 8px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(90,218,178,0.36)", background: "rgba(90,218,178,0.12)", color: "var(--jade-200)", fontFamily: "var(--font-sans)", fontSize: 11, textDecoration: "none" }}>
              <i data-lucide="wand-sparkles" style={{ width: 12, height: 12 }} />{primaryLabel}
            </a>
            {sample.zipUrl && (
              <a href={sample.zipUrl} onClick={stopLinkClick} style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 26, padding: "0 8px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(201,163,91,0.32)", background: "rgba(201,163,91,0.12)", color: "var(--gold-200)", fontFamily: "var(--font-sans)", fontSize: 11, textDecoration: "none" }}>
                <i data-lucide="package-open" style={{ width: 12, height: 12 }} />{secondaryLabel}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { LFIcon, SectionHead, AssetTile, generatedAssetPath, officialSampleInfoForImage });
