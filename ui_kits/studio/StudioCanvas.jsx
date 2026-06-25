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

function ResultTile({ art, label, selected, onClick, loading }) {
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
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 90% at 50% 30%, ${art.from}, ${art.to} 72%)` }} />
          <div style={{ position: "absolute", top: "44%", left: "50%", transform: "translate(-50%,-50%)", color: "rgba(255,255,255,0.92)", filter: `drop-shadow(0 0 16px ${art.glow})` }}>
            <i data-lucide={art.icon} style={{ width: 52, height: 52 }} />
          </div>
          <span style={{ position: "absolute", bottom: 8, left: 9, fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{label}</span>
          {selected && <span style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", background: "var(--gold-500)", display: "flex", alignItems: "center", justifyContent: "center" }}><i data-lucide="check" style={{ width: 13, height: 13, color: "var(--ink-900)" }} /></span>}
        </>
      )}
      <style>{`@keyframes lf-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
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
              <ResultTile key={i} art={art} label={`${t.candidatePrefix} ${i + 1} · ${params.size}`} selected={done && sel === i} loading={generating} onClick={() => setSel(i)} />
            ))}
          </div>
        )}
        {tab === t.tabs[1] && (
          <div style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", background: "var(--surface-card)", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ width: 96, height: 96, borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", position: "relative", overflow: "hidden", opacity: done ? 1 : 0.4 }}>
                  <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 90% at 50% 35%, ${art.from}, ${art.to})` }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.9)" }}><i data-lucide={art.icon} style={{ width: 34, height: 34 }} /></div>
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
                <div key={i} style={{ aspectRatio: "1", borderRadius: 3, background: `radial-gradient(120% 90% at 50% 35%, ${art.from}, ${art.to})`, display: "flex", alignItems: "center", justifyContent: "center", opacity: done ? 1 : 0.35 }}>
                  <i data-lucide={art.icon} style={{ width: 16, height: 16, color: "rgba(255,255,255,0.85)" }} />
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
