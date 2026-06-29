/* Landing — Hero */
function Hero() {
  const { Button, Badge, OrnateButton } = window.LingjiForgeDesignSystem_e6d384;
  const t = window.__lf.t.bind(window.__lf);
  const hero = window.__lf.raw("landing.hero", {
    kicker: "",
    title: "",
    titleAccent: "",
    description: "",
    promptLabel: "",
    promptBadge: "",
    promptText: "",
    promptMeta: "",
    chips: [],
    actions: ["", ""],
    videoDemo: {
      badge: "真实视频样本",
      title: "WEBM 视频自动抽帧成 Sprite Sheet",
      loading: "正在加载视频样本",
      unavailable: "视频样本暂不可用，显示静态抽帧结果",
      frameLabel: "抽帧结果",
      metrics: ["质量分", "透明帧", "中心偏移", "ZIP 文件"],
    },
  });
  const [demo, setDemo] = React.useState(null);
  const [demoError, setDemoError] = React.useState(null);
  // 默认展示 walk(index 1)。各 clip 本身是循环 GIF(自播放),无需 flipbook 定时器。
  const [activeFrame, setActiveFrame] = React.useState(1);
  // 有真实视频样本时默认显示视频;点击骨骼 clip 缩略图则切到骨骼动画(picked=true)。
  const [picked, setPicked] = React.useState(false);
  const chipIcons = ["image", "film", "layout-grid", "braces"];
  // Spine 骨骼绑定真实输出(SAM3 分层→绑骨→关节驱动循环),非逐帧换图。
  const outputFrames = [
    ["rig-monster-idle.gif", "Idle"],
    ["rig-monster-walk.gif", "Walk"],
    ["rig-monster-attack.gif", "Attack"],
    ["rig-monster-hurt.gif", "Hurt"],
    ["rig-monster-death.gif", "Death"],
  ];
  const videoDemo = hero.videoDemo || {};
  const quality = demo?.quality || {};
  const demoUrl = demo?.url || "";
  const showRig = !demoUrl || picked; // 显示骨骼动画(而非视频)时
  const metricValues = [
    quality.score != null ? String(quality.score) : "--",
    demo?.frames != null ? String(demo.frames) : "--",
    quality.maxCenterOffset != null ? `${Math.round(quality.maxCenterOffset * 100)}%` : "--",
    demo?.zipFiles != null ? String(demo.zipFiles) : "--",
  ];

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/demo/video-sprite")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(String(response.status))))
      .then((data) => {
        if (!cancelled) setDemo(data.demo || null);
      })
      .catch((error) => {
        if (!cancelled) setDemoError(error.message || "failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="lf-bg-deep" style={{ position: "relative", overflow: "hidden", padding: "84px 40px 72px" }}>
    {/* faint array ring + emblem watermark */}
    <div className="lf-bg-array" style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.5 }} />
    <img src="../../assets/logo-emblem-transparent.png" alt="" aria-hidden
      style={{ position: "absolute", right: -120, top: 40, width: 620, opacity: 0.10, pointerEvents: "none", filter: "blur(1px)" }} />

    <div style={{ position: "relative", zIndex: 2, maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 56, alignItems: "center" }}>
      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: "var(--radius-pill)", background: "rgba(201,163,91,0.1)", border: "1px solid var(--border-default)", marginBottom: 26 }}>
          <span style={{ width: 7, height: 7, background: "var(--gold-400)", transform: "rotate(45deg)", boxShadow: "var(--glow-spirit)" }} />
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--gold-200)" }}>{hero.kicker}</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 900, fontSize: 68, lineHeight: 1.12, margin: 0, color: "var(--text-primary)", letterSpacing: "0.01em" }}>
          {hero.title}
          <br />
          <span className="lf-gold-text">{hero.titleAccent}</span>
        </h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 18, lineHeight: 1.75, color: "var(--text-secondary)", margin: "26px 0 0", maxWidth: 520 }}>
          {hero.description}
        </p>
        <div style={{ display: "flex", gap: 14, marginTop: 34, alignItems: "center" }}>
          <OrnateButton size="lg" onClick={() => { window.location.href = "/generator/?demo=video-sprite"; }} icon={<i data-lucide="wand-sparkles" style={{ width: 18, height: 18 }} />}>{hero.actions[0]}</OrnateButton>
          <Button variant="jade" size="lg" onClick={() => { window.location.href = "/studio/"; }} icon={<i data-lucide="clapperboard" style={{ width: 18, height: 18 }} />}>{hero.actions[1]}</Button>
        </div>
        <div style={{ display: "flex", gap: 22, marginTop: 30, flexWrap: "wrap" }}>
          {hero.chips.map((label, i) => (
            <span key={`${label}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>
              <i data-lucide={chipIcons[i] || "sparkles"} style={{ width: 14, height: 14, color: "var(--jade-300)" }} />{label}
            </span>
          ))}
        </div>
      </div>

      {/* prompt example card */}
      <div className="lf-plate" style={{ borderRadius: "var(--radius-xl)", padding: 22, boxShadow: "var(--shadow-panel), var(--glow-gold)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <i data-lucide="terminal" style={{ width: 15, height: 15, color: "var(--gold-300)" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>{hero.promptLabel}</span>
          <Badge tone="jade" style={{ marginLeft: "auto" }}>{hero.promptBadge}</Badge>
        </div>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.8, color: "var(--text-primary)", margin: 0 }}
          dangerouslySetInnerHTML={{ __html: hero.promptText }}
        />
        <div style={{ height: 1, background: "var(--divider)", margin: "18px 0" }} />
        <div style={{
          position: "relative",
          minHeight: 244,
          overflow: "hidden",
          borderRadius: "var(--radius-lg)",
          border: "1px solid rgba(74,206,178,0.28)",
          background: "linear-gradient(45deg, rgba(255,255,255,0.045) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.045) 25%, transparent 25%), rgba(2,6,10,0.86)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 0 8px",
          display: "grid",
          placeItems: "center",
        }}>
          {!showRig ? (
            <video src={demoUrl} controls loop muted playsInline autoPlay style={{ width: "100%", height: "100%", maxHeight: 280, objectFit: "contain", display: "block" }} />
          ) : (
            <img key={outputFrames[activeFrame][0]} src={window.generatedAssetPath(outputFrames[activeFrame][0])} alt={outputFrames[activeFrame][1]} style={{ width: "78%", height: "100%", maxHeight: 248, objectFit: "contain", imageRendering: "pixelated", filter: "drop-shadow(0 10px 16px rgba(0,0,0,0.45))" }} />
          )}
          <div style={{ position: "absolute", left: 12, top: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Badge tone="jade">{showRig ? "Spine 骨骼" : videoDemo.badge}</Badge>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(244,241,232,0.78)", background: "rgba(7,9,11,0.62)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-sm)", padding: "3px 7px" }}>{showRig ? "SAM3 分层 · 关节驱动循环" : videoDemo.title}</span>
          </div>
          {showRig && (
            <span style={{ position: "absolute", right: 12, bottom: 12, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(244,241,232,0.85)", background: "rgba(7,9,11,0.66)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-pill)", padding: "3px 10px" }}>
              <i data-lucide="play" style={{ width: 11, height: 11, color: "var(--jade-300)" }} />
              {outputFrames[activeFrame][1]}
            </span>
          )}
        </div>
        {(demoError || (demo && !demoUrl)) && (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--gold-200)", margin: "8px 0 0" }}>{videoDemo.unavailable}</p>
        )}
        {!demo && !demoError && (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", margin: "8px 0 0" }}>{videoDemo.loading}</p>
        )}
        {!showRig && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 10 }}>
          {metricValues.map((value, index) => (
            <div key={videoDemo.metrics[index]} style={{ minHeight: 48, padding: "7px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.035)" }}>
              <strong style={{ display: "block", fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontSize: 15 }}>{value}</strong>
              <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{videoDemo.metrics[index]}</span>
            </div>
          ))}
        </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "12px 0 8px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--jade-300)" }}>{showRig ? "骨骼动画 · 点击切换动作" : videoDemo.frameLabel}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>{showRig ? "sam3-spine-rig-v1" : "alpha-bounds-bottom-anchor-v1"}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
          {outputFrames.map(([file, label], i) => {
            const selected = showRig && i === activeFrame;
            return (
            <button key={file} type="button" title={label}
              onClick={() => { setActiveFrame(i); setPicked(true); }}
              style={{
              position: "relative",
              aspectRatio: "1",
              borderRadius: "var(--radius-md)",
              border: selected ? "1px solid var(--gold-400)" : "1px solid var(--border-subtle)",
              boxShadow: selected ? "0 0 0 1px var(--gold-400), var(--glow-gold)" : "none",
              padding: 0,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              transition: "border-color .15s ease, box-shadow .15s ease",
              background: "linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%), rgba(2,6,10,0.82)",
              backgroundSize: "14px 14px",
              backgroundPosition: "0 0, 0 7px",
            }}>
              <img src={window.generatedAssetPath(file)} alt={label} loading="lazy" style={{ width: "92%", height: "92%", objectFit: "contain", imageRendering: "pixelated", filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.35))" }} />
              <span style={{ position: "absolute", left: 5, bottom: 4, fontFamily: "var(--font-mono)", fontSize: 9, color: selected ? "var(--gold-200)" : "rgba(244,241,232,0.72)", background: "rgba(7,9,11,0.68)", borderRadius: "var(--radius-sm)", padding: "1px 4px" }}>{label}</span>
            </button>
            );
          })}
        </div>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", margin: "12px 0 0", textAlign: "center" }}>{hero.promptMeta}</p>
      </div>
    </div>
  </section>
  );
}
Object.assign(window, { Hero });
