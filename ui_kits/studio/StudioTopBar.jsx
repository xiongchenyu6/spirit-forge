/* Studio — TopBar */
function StudioTopBar({ spirit, onAd }) {
  const { SpiritStone, IconButton, Avatar, Button } = window.LingjiForgeDesignSystem_e6d384;
  const t = window.__lf.raw("studio.topbar", {
    brand: "",
    label: "",
    project: "",
    adLabel: "",
    dailyTask: "",
    settings: "",
  });
  return (
    <header style={{
      height: "var(--studio-header-h)", display: "flex", alignItems: "center", gap: 16, padding: "0 18px",
      borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", flex: "none", zIndex: 30,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <img src="../../assets/logo-emblem-transparent.png" alt={t.brand} style={{ width: 30, height: 30, objectFit: "contain", filter: "drop-shadow(0 0 8px rgba(201,163,91,0.3))" }} />
        <span style={{ fontFamily: "var(--font-serif)", fontWeight: 800, fontSize: 19, color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>{t.brand}</span>
        <span style={{ width: 1, height: 20, background: "var(--divider)", margin: "0 4px" }} />
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-secondary)" }}>{t.label}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 14, padding: "5px 12px", borderRadius: "var(--radius-md)", background: "var(--surface-inset)", border: "1px solid var(--border-subtle)" }}>
        <i data-lucide="folder" style={{ width: 14, height: 14, color: "var(--text-muted)" }} />
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-secondary)" }}>{t.project}</span>
        <i data-lucide="chevron-down" style={{ width: 13, height: 13, color: "var(--text-muted)" }} />
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onAd} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 32, padding: "0 12px", borderRadius: "var(--radius-pill)", background: "rgba(47,110,100,0.16)", border: "1px solid var(--border-jade)", color: "var(--jade-200)", fontFamily: "var(--font-sans)", fontSize: 13, cursor: "pointer" }}>
          <i data-lucide="clapperboard" style={{ width: 15, height: 15 }} />{t.adLabel}
        </button>
        <SpiritStone count={spirit} onAdd={onAd} />
        <IconButton label={t.dailyTask}><i data-lucide="scroll-text" style={{ width: 18, height: 18 }} /></IconButton>
        <IconButton label={t.settings}><i data-lucide="settings" style={{ width: 18, height: 18 }} /></IconButton>
        <Avatar name="青" size={32} />
      </div>
    </header>
  );
}
Object.assign(window, { StudioTopBar });
