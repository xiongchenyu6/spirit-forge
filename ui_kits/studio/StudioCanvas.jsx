/* Studio — center canvas: prompt, result tabs, candidate grid */
const GENRE_ART = {
  "仙侠": { from: "#2f6e64", to: "#0e211f", glow: "rgba(201,163,91,0.7)", icon: "sword" },
  "武侠": { from: "#6a5a3a", to: "#1f1a10", glow: "rgba(218,185,120,0.7)", icon: "swords" },
  "西幻": { from: "#5b4b9c", to: "#181333", glow: "rgba(150,130,230,0.8)", icon: "wand-sparkles" },
  "科幻": { from: "#3f6e8f", to: "#0f1d28", glow: "rgba(120,180,230,0.8)", icon: "bot" },
  "赛博朋克": { from: "#a8327f", to: "#1a0f24", glow: "rgba(255,80,200,0.8)", icon: "skull" },
  "现代": { from: "#3a5a78", to: "#101a24", glow: "rgba(140,176,204,0.8)", icon: "building-2" },
  "末日": { from: "#7a5a3a", to: "#1c140c", glow: "rgba(220,150,80,0.7)", icon: "radiation" },
  "Q版": { from: "#5a9a4e", to: "#1d2e16", glow: "rgba(180,230,140,0.8)", icon: "sprout" },
  "像素": { from: "#7a6a4a", to: "#211a12", glow: "rgba(230,170,90,0.8)", icon: "grid-2x2" },
  "二次元": { from: "#9c5a7a", to: "#241018", glow: "rgba(240,150,190,0.8)", icon: "heart" },
};

const GENERATED_ASSET_BASE = "../../assets/generated/official/";
const GENERATED_PREVIEWS = [
  { action: "Idle", image: "monster-idle.png" },
  { action: "Move", image: "monster-move.png" },
  { action: "Attack", image: "monster-attack.png" },
  { action: "Death", image: "monster-death.png" },
];
function generatedAssetSrc(file) {
  return file && file.includes("/") ? file : GENERATED_ASSET_BASE + file;
}

function ResultTile({ art, preview, label, selected, onClick, loading }) {
  return (
    <div onClick={onClick} style={{
      position: "relative", aspectRatio: "1", borderRadius: "var(--radius-md)", overflow: "hidden", cursor: "pointer",
      border: "1.5px solid " + (selected ? "var(--gold-500)" : "var(--border-subtle)"),
      boxShadow: selected ? "var(--glow-gold)" : "none",
      background: "var(--surface-inset)",
      transition: "border-color var(--dur-base), box-shadow var(--dur-base)",
    }}>
      {/* checkerboard for transparency */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(45deg,#1a2227 25%,transparent 25%),linear-gradient(-45deg,#1a2227 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1a2227 75%),linear-gradient(-45deg,transparent 75%,#1a2227 75%)", backgroundSize: "16px 16px", backgroundPosition: "0 0,0 8px,8px -8px,-8px 0", opacity: 0.5 }} />
      {loading ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-card)" }}>
          <span style={{ width: 24, height: 24, borderRadius: "50%", border: "2.5px solid var(--gold-500)", borderTopColor: "transparent", animation: "lf-spin 0.7s linear infinite" }} />
        </div>
      ) : (
        <>
          {preview ? (
            <img src={generatedAssetSrc(preview.image)} alt={preview.action} loading="lazy" style={{ position: "absolute", inset: "8%", width: "84%", height: "74%", objectFit: "contain", imageRendering: "pixelated", filter: "drop-shadow(0 12px 18px rgba(0,0,0,0.4))" }} />
          ) : (
            <>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 90% at 50% 30%, ${art.from}, ${art.to} 72%)` }} />
              <div style={{ position: "absolute", top: "44%", left: "50%", transform: "translate(-50%,-50%)", color: "rgba(255,255,255,0.92)", filter: `drop-shadow(0 0 16px ${art.glow})` }}>
                <i data-lucide={art.icon} style={{ width: 52, height: 52 }} />
              </div>
            </>
          )}
          <span style={{ position: "absolute", bottom: 8, left: 9, fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{label}</span>
          {selected && <span style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", background: "var(--gold-500)", display: "flex", alignItems: "center", justifyContent: "center" }}><i data-lucide="check" style={{ width: 13, height: 13, color: "var(--ink-900)" }} /></span>}
        </>
      )}
      <style>{`@keyframes lf-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function VideoSpriteDemoCard() {
  const { Badge, Button } = window.LingjiForgeDesignSystem_e6d384;
  const t = window.__lf.raw("studio.canvas.videoDemo", {
    kicker: "真实 Video-to-Sprite 样本",
    title: "纯色背景视频 · 自动抽帧成精灵图",
    sub: "Wan2.2 先生成 WEBM，再由浏览器抽 4 帧、抠背景、脚底对齐并导出 Sprite Sheet / Metadata / ZIP。",
    loading: "正在加载视频样本",
    unavailable: "视频样本暂不可用，已保留静态帧预览。",
    metrics: ["质量分", "透明帧", "中心偏移", "ZIP 文件"],
    cta: "打开生成器",
  });
  const [demo, setDemo] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/demo/video-sprite")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(String(response.status))))
      .then((data) => {
        if (!cancelled) setDemo(data.demo || null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const available = Boolean(demo?.url);
  const quality = demo?.quality || {};
  const metricValues = [
    quality.score != null ? String(quality.score) : "--",
    demo?.frames != null ? String(demo.frames) : "--",
    quality.maxCenterOffset != null ? `${Math.round(quality.maxCenterOffset * 100)}%` : "--",
    demo?.zipFiles != null ? String(demo.zipFiles) : "--",
  ];

  return (
    <section style={{
      marginTop: 16,
      border: "1px solid rgba(74,206,178,0.28)",
      borderRadius: "var(--radius-lg)",
      background: "linear-gradient(135deg, rgba(74,206,178,0.08), rgba(4,9,13,0.78) 48%, rgba(201,163,91,0.08))",
      boxShadow: "var(--shadow-panel)",
      overflow: "hidden",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 0.92fr) 1fr", gap: 0 }}>
        <div style={{
          position: "relative",
          minHeight: 220,
          background:
            "linear-gradient(45deg, rgba(255,255,255,0.045) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.045) 25%, transparent 25%), rgba(2,6,10,0.84)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 0 8px",
          display: "grid",
          placeItems: "center",
          borderRight: "1px solid var(--border-subtle)",
        }}>
          {available ? (
            <video src={demo.url} controls loop muted playsInline autoPlay style={{ width: "100%", height: "100%", maxHeight: 280, objectFit: "contain", display: "block" }} />
          ) : (
            <div style={{ width: "100%", padding: 20, display: "grid", gridTemplateColumns: "repeat(2, minmax(72px, 1fr))", gap: 8 }}>
              {GENERATED_PREVIEWS.map((preview) => (
                <div key={preview.action} style={{ aspectRatio: "1", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", display: "grid", placeItems: "center", background: "rgba(255,255,255,0.035)" }}>
                  <img src={generatedAssetSrc(preview.image)} alt={preview.action} loading="lazy" style={{ width: "88%", height: "88%", objectFit: "contain", imageRendering: "pixelated" }} />
                </div>
              ))}
            </div>
          )}
          <span style={{ position: "absolute", left: 12, top: 12 }}>
            <Badge tone={available ? "jade" : "gold"}>{available ? "WEBM" : "PNG"}</Badge>
          </span>
        </div>

        <div style={{ padding: 18, display: "grid", gap: 14, alignContent: "center" }}>
          <div style={{ display: "grid", gap: 5 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--jade-300)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t.kicker}</span>
            <strong style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)", fontSize: 20, lineHeight: 1.25 }}>{t.title}</strong>
            <span style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.55 }}>{demo ? t.sub : t.loading}</span>
            {(error || (demo && !available)) && (
              <span style={{ color: "var(--gold-200)", fontSize: 12 }}>{t.unavailable}</span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(58px, 1fr))", gap: 8 }}>
            {metricValues.map((value, index) => (
              <div key={t.metrics[index]} style={{ minHeight: 54, padding: "8px 10px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.035)" }}>
                <strong style={{ display: "block", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: 16 }}>{value}</strong>
                <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{t.metrics[index]}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Badge tone="jade">alpha-bounds-bottom-anchor-v1</Badge>
            <Badge tone="gold">{demo?.dimensions ? `${demo.dimensions.width}×${demo.dimensions.height}` : "512×512"}</Badge>
            <Button variant="outline" size="sm" onClick={() => { window.location.href = "/generator/?demo=video-sprite"; }} icon={<i data-lucide="wand-sparkles" style={{ width: 15, height: 15 }} />}>
              {t.cta}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function StudioCanvas({ params, setParam, phase, progress, onGenerate, prompt, setPrompt, cost }) {
  const { IconButton, Switch, SegmentedControl, ProgressBar, Button, Badge, OrnateBar } = window.LingjiForgeDesignSystem_e6d384;
  const t = window.__lf.raw("studio.canvas");
  const isEn = window.__lf.lang === "en";
  const directions = t.previewDirections || (isEn ? ["Down", "Left", "Right", "Up"] : ["下", "左", "右", "上"]);
  const [tab, setTab] = React.useState(t.tabs ? t.tabs[0] : "候选结果");
  const [sel, setSel] = React.useState(0);
  const art = GENRE_ART[params.genre] || GENRE_ART["仙侠"];
  const generating = phase === "generating";
  const done = phase === "done";

  return (
    <main className="lf-scroll lf-bg-deep" style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: 22 }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* prompt */}
        <div style={{ background: "var(--surface-inset)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", boxShadow: "var(--inset-top)", padding: 16 }}>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} className="lf-scroll"
            placeholder={t.placeholder}
            style={{ width: "100%", resize: "none", background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: 16, lineHeight: 1.7 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <button style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 10px", borderRadius: "var(--radius-md)", background: "transparent", border: "1px dashed var(--border-default)", color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
              <i data-lucide="image-plus" style={{ width: 14, height: 14 }} />{t.upload}
            </button>
            <Switch checked={params.alpha} onChange={(v) => setParam("alpha", v)} label={t.transparent} />
            <Button variant="gold" size="md" style={{ marginLeft: "auto" }} loading={generating} onClick={onGenerate}
              icon={!generating && <i data-lucide="wand-sparkles" style={{ width: 16, height: 16 }} />}>
              {generating ? t.generating : t.start}
              {!generating && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "var(--font-mono)", fontSize: 12, opacity: 0.85 }}><span style={{ width: 8, height: 8, background: "currentColor", transform: "rotate(45deg)", borderRadius: 1 }} />{cost}</span>}
            </Button>
          </div>
        </div>

        <VideoSpriteDemoCard />

        {/* result tabs + tools */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "22px 0 14px" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {t.tabs.map((name) => (
              <button key={name} onClick={() => setTab(name)} style={{ height: 32, padding: "0 14px", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: tab === name ? 500 : 400, color: tab === name ? "var(--gold-200)" : "var(--text-secondary)", background: tab === name ? "rgba(201,163,91,0.14)" : "transparent" }}>{name}</button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <IconButton label={t.maximize} variant="surface"><i data-lucide="maximize-2" style={{ width: 16, height: 16 }} /></IconButton>
            <IconButton label={t.reRoll} variant="surface" onClick={onGenerate}><i data-lucide="rotate-cw" style={{ width: 16, height: 16 }} /></IconButton>
            <Button variant="outline" size="sm" icon={<i data-lucide="download" style={{ width: 15, height: 15 }} />}>{t.export}</Button>
          </div>
        </div>

        {generating && <div style={{ marginBottom: 16 }}><OrnateBar value={progress} tone="teal" height={22} label={window.__lf.t("studio.canvas.generatingPrefix", { genre: params.genre, style: params.style })} /></div>}

        {/* content by tab */}
        {tab === t.tabs[0] && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            {[0, 1, 2, 3].map((i) => (
              <ResultTile key={i} art={art} preview={GENERATED_PREVIEWS[i]} label={`${t.candidatePrefix} ${i + 1} · ${params.size}`} selected={done && sel === i} loading={generating} onClick={() => setSel(i)} />
            ))}
          </div>
        )}
        {tab === t.tabs[1] && (
          <div style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", background: "var(--surface-card)", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ width: 96, height: 96, borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", position: "relative", overflow: "hidden", opacity: done ? 1 : 0.4 }}>
                  <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 90% at 50% 35%, ${art.from}, ${art.to})` }} />
                  <img src={generatedAssetSrc(GENERATED_PREVIEWS[i].image)} alt={GENERATED_PREVIEWS[i].action} loading="lazy" style={{ position: "absolute", inset: 7, width: "calc(100% - 14px)", height: "calc(100% - 14px)", objectFit: "contain", imageRendering: "pixelated", filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.38))" }} />
                  <span style={{ position: "absolute", bottom: 4, left: 6, fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.7)" }}>{directions[i]}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Badge tone="jade">{t.animationBadge}</Badge>
              <Badge tone="gold">12 FPS</Badge>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{t.panelTitle}</span>
            </div>
          </div>
        )}
        {tab === t.tabs[2] && (
          <div style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", background: "var(--surface-card)", padding: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 4 }}>
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: "1", borderRadius: 3, background: `radial-gradient(120% 90% at 50% 35%, ${art.from}, ${art.to})`, display: "flex", alignItems: "center", justifyContent: "center", opacity: done ? 1 : 0.35, overflow: "hidden" }}>
                  <img src={generatedAssetSrc(GENERATED_PREVIEWS[i % GENERATED_PREVIEWS.length].image)} alt={GENERATED_PREVIEWS[i % GENERATED_PREVIEWS.length].action} loading="lazy" style={{ width: "88%", height: "88%", objectFit: "contain", imageRendering: "pixelated" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
              <span>{window.__lf.t("studio.canvas.spriteGrid", { cols: 8, rows: 4 })}</span><span>{window.__lf.t("studio.canvas.spriteFrames", { size: params.size })}</span><span>{window.__lf.t("studio.canvas.spriteAtlas", { size: parseInt(params.size) * 8 + "×" + parseInt(params.size) * 4 })}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
Object.assign(window, { StudioCanvas, GENRE_ART });
