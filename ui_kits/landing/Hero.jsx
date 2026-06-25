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
  });
  const chipIcons = ["image", "film", "layout-grid", "braces"];

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
          <OrnateButton size="lg" icon={<i data-lucide="wand-sparkles" style={{ width: 18, height: 18 }} />}>{hero.actions[0]}</OrnateButton>
          <Button variant="jade" size="lg" icon={<i data-lucide="clapperboard" style={{ width: 18, height: 18 }} />}>{hero.actions[1]}</Button>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {["sword", "wand-sparkles", "bot", "ghost"].map((ic, i) => (
            <div key={ic} style={{ aspectRatio: "1", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", background: ["radial-gradient(circle at 50% 35%, #2f6e64, #0e211f)", "radial-gradient(circle at 50% 35%, #5b4b9c, #1a1733)", "radial-gradient(circle at 50% 35%, #3f6e8f, #11212e)", "radial-gradient(circle at 50% 35%, #8f3a3a, #2a1212)"][i] }}>
              <i data-lucide={ic} style={{ width: 22, height: 22, color: "rgba(255,255,255,0.9)" }} />
            </div>
          ))}
        </div>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", margin: "12px 0 0", textAlign: "center" }}>{hero.promptMeta}</p>
      </div>
    </div>
  </section>
  );
}
Object.assign(window, { Hero });
