/* Landing — SpiritModel (灵石/广告激励) + PricingTeaser + Footer */
function SpiritModel() {
  const { SectionHead } = window;
  const { Button, SpiritStone } = window.LingjiForgeDesignSystem_e6d384;
  const spiritModel = window.__lf.raw("landing.spiritModel", {
    kicker: "",
    title: "",
    sub: "",
    button: "",
    costRows: [],
  });
  return (
    <section className="lf-bg-deep" style={{ padding: "88px 40px", borderTop: "1px solid var(--border-subtle)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        <div>
          <SectionHead align="left" kicker={spiritModel.kicker} title={spiritModel.title} sub={spiritModel.sub} />
          <div style={{ display: "flex", gap: 12, marginTop: 28, alignItems: "center" }}>
            <Button variant="gold" size="lg" icon={<i data-lucide="clapperboard" style={{ width: 18, height: 18 }} />}>{spiritModel.button}</Button>
            <SpiritStone count={128} size="lg" />
          </div>
        </div>
        <div className="lf-plate" style={{ borderRadius: "var(--radius-xl)", padding: 24 }}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, letterSpacing: "var(--tracking-wide)", color: "var(--text-muted)", marginBottom: 14 }}>{spiritModel.costLabel}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {spiritModel.costRows.map(([t, c]) => (
              <div key={t} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--divider)" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-secondary)" }}>{t}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--gold-200)" }}>
                  <span style={{ width: 10, height: 10, background: "linear-gradient(135deg,var(--gold-300),var(--gold-600))", transform: "rotate(45deg)", borderRadius: 1, boxShadow: "var(--glow-spirit)" }} />{c}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingTeaser() {
  const { SectionHead } = window;
  const { Button, Badge } = window.LingjiForgeDesignSystem_e6d384;
  const pricingTeaser = window.__lf.raw("landing.pricingTeaser", {
    kicker: "",
    title: "",
    plans: [],
    cta: "",
    contact: "",
  });
  return (
    <section style={{ padding: "88px 40px", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <SectionHead kicker={pricingTeaser.kicker} title={pricingTeaser.title} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 44 }}>
          {pricingTeaser.plans.map((p) => (
            <div key={p.name} style={{
              position: "relative", padding: 24, borderRadius: "var(--radius-lg)",
              background: p.hot ? "linear-gradient(180deg, rgba(201,163,91,0.10), var(--surface-card))" : "var(--surface-card)",
              border: "1px solid " + (p.hot ? "var(--border-strong)" : "var(--border-subtle)"),
              boxShadow: p.hot ? "var(--glow-gold)" : "none",
            }}>
              {p.tag && <div style={{ position: "absolute", top: 16, right: 16 }}><Badge tone="gold" solid>{p.tag}</Badge></div>}
              <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 20, color: "var(--text-primary)" }}>{p.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "14px 0 18px" }}>
                <span style={{ fontFamily: "var(--font-serif)", fontWeight: 900, fontSize: 34, color: p.hot ? "var(--gold-200)" : "var(--text-primary)" }}>{p.price}</span>
                {p.unit && <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>{p.unit}</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
                {p.feats.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-secondary)" }}>
                    <i data-lucide="check" style={{ width: 15, height: 15, color: "var(--jade-300)", flex: "none" }} />{f}
                  </div>
                ))}
              </div>
              <Button variant={p.variant} full>{p.price === "面议" || p.price === "Custom" ? pricingTeaser.contact : pricingTeaser.cta}</Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const footer = window.__lf.raw("landing.footer", {
    cols: [],
    blurb: "",
    copyright: "",
    icp: "",
  });
  const logo = window.__lf.t("app.brandEnglish");
  return (
    <footer style={{ background: "var(--bg-deep)", borderTop: "1px solid var(--border-subtle)", padding: "56px 40px 36px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="../../assets/logo-emblem-transparent.png" alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
            <span style={{ fontFamily: "var(--font-serif)", fontWeight: 800, fontSize: 20, color: "var(--text-primary)", letterSpacing: "0.04em" }}>{window.__lf.t("app.brand")}</span>
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.7, color: "var(--text-muted)", marginTop: 14, maxWidth: 260 }}>{footer.blurb}</p>
        </div>
        {footer.cols.map(([h, items]) => (
          <div key={h}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>{h}</div>
            {items.map((it) => <a key={it} href="#" style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 10 }}>{it}</a>)}
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1180, margin: "36px auto 0", paddingTop: 20, borderTop: "1px solid var(--divider)", display: "flex", justifyContent: "space-between", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>
        <span>{footer.copyright.replace("灵机阁 Spirit Forge", logo).replace("Spirit Forge", logo)}</span>
        <span>{footer.icp}</span>
      </div>
    </footer>
  );
}
Object.assign(window, { SpiritModel, PricingTeaser, Footer });
