/* Landing — TopNav */
function TopNav() {
  const { Button, SpiritStone } = window.LingjiForgeDesignSystem_e6d384;
  const t = window.__lf.t.bind(window.__lf);
  const links = t("landing.nav.links");
  const navHrefs = ["/generator/", "/templates/", "/pricing/", "/library/"];
  const currentLang = window.__lf.lang || "zh";

  const switchLang = (nextLang) => {
    const url = new URL(window.location.href);
    if (nextLang === "en") {
      url.searchParams.set("lang", "en");
    } else {
      url.searchParams.delete("lang");
    }
    window.location.href = url.toString();
  };

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50, height: "var(--topbar-h)",
      display: "flex", alignItems: "center", gap: 28, padding: "0 40px",
      background: "rgba(11,15,18,0.78)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
      borderBottom: "1px solid var(--border-subtle)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <img src="../../assets/logo-emblem-transparent.png" alt={t("app.brand")} style={{ width: 36, height: 36, objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(201,163,91,0.3))" }} />
        <span style={{ fontFamily: "var(--font-serif)", fontWeight: 800, fontSize: 22, color: "var(--text-primary)", letterSpacing: "0.04em" }}>{t("app.brand")}</span>
      </div>
      <nav style={{ display: "flex", gap: 4, marginLeft: 12 }}>
          {links.map((l, i) => (
            <a key={l} href={navHrefs[i] || "/generator/"} style={{ padding: "8px 14px", fontFamily: "var(--font-sans)", fontSize: 14, color: i === 0 ? "var(--gold-200)" : "var(--text-secondary)", textDecoration: "none", borderRadius: "var(--radius-md)", transition: "color var(--dur-base)" }}
             onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
             onMouseLeave={(e) => (e.currentTarget.style.color = i === 0 ? "var(--gold-200)" : "var(--text-secondary)")}>{l}</a>
        ))}
      </nav>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        <SpiritStone count={128} onAdd={() => {}} />
          <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-subtle)", borderRadius: 999, padding: "3px", background: "var(--bg-deep, #0b0f12)", gap: 4 }}>
          <button
            onClick={() => switchLang("zh")}
            style={{
              padding: "4px 8px",
              border: "none",
              borderRadius: 999,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              color: currentLang === "zh" ? "var(--text-primary)" : "var(--text-muted)",
              background: currentLang === "zh" ? "var(--surface-card)" : "transparent",
            }}
          >
            中文
          </button>
          <button
            onClick={() => switchLang("en")}
            style={{
              padding: "4px 8px",
              border: "none",
              borderRadius: 999,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              color: currentLang === "en" ? "var(--text-primary)" : "var(--text-muted)",
              background: currentLang === "en" ? "var(--surface-card)" : "transparent",
            }}
          >
            EN
          </button>
        </div>
        <a href="/onboarding/" style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-secondary)", textDecoration: "none" }}>{t("landing.nav.login")}</a>
        <Button variant="gold" size="sm" onClick={() => { window.location.href = "/generator/"; }} icon={<i data-lucide="sparkles" style={{ width: 15, height: 15 }} />}>{t("landing.nav.start")}</Button>
      </div>
    </header>
  );
}
Object.assign(window, { TopNav });
