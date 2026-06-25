/* Landing — Capabilities (asset types) + HowItWorks */
function Capabilities() {
  const { SectionHead } = window;
  const { Card, OrbIcon } = window.LingjiForgeDesignSystem_e6d384 || {};
  const cfg = window.__lf.raw("landing.capabilities", {
    kicker: "",
    title: "",
    sub: "",
    items: [],
    process: {
      kicker: "",
      title: "",
      steps: [],
    },
  });

  return (
    <section className="lf-bg-deep" style={{ padding: "88px 40px", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <SectionHead kicker={cfg.kicker} title={cfg.title} sub={cfg.sub} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginTop: 44 }}>
          {cfg.items.map(([t, ic, d]) => (
            <Card key={t} interactive padding={18} style={{ background: "var(--surface-card)" }}>
              <div style={{ marginBottom: 12 }}>
                <OrbIcon name={ic} size={54} />
              </div>
              <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 17, color: "var(--text-primary)" }}>{t}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 5 }}>{d}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { SectionHead } = window;
  const steps = window.__lf.raw("landing.capabilities.process.steps", []);
  const process = window.__lf.raw("landing.capabilities.process", { kicker: "", title: "" });

  return (
    <section style={{ padding: "88px 40px", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <SectionHead kicker={process.kicker} title={process.title} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginTop: 44 }}>
          {steps.map(([t, ic, d], i) => (
            <div key={t} style={{ position: "relative", padding: "26px 22px", borderRadius: "var(--radius-lg)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
              <span style={{ position: "absolute", top: 18, right: 20, fontFamily: "var(--font-serif)", fontWeight: 900, fontSize: 40, color: "rgba(201,163,91,0.14)" }}>{i + 1}</span>
              <i data-lucide={ic} style={{ width: 26, height: 26, color: "var(--gold-300)" }} />
              <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 18, color: "var(--text-primary)", marginTop: 16 }}>{t}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)", marginTop: 8 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
Object.assign(window, { Capabilities, HowItWorks });
