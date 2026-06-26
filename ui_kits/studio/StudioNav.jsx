/* Studio — left asset-type nav */
function StudioNav({ active, setActive }) {
  const { NavItem, OrbIcon } = window.LingjiForgeDesignSystem_e6d384;
  const cfg = window.__lf.raw("studio.nav", {
    groups: [],
    upgradeTitle: "",
    upgradeText: "",
  });
  const isEn = window.__lf.lang === "en";
  const groups = (cfg.groups || []).map((group) => Array.isArray(group)
    ? { title: group[0], items: group[1] || [] }
    : { title: group.title, items: group.items || [] });
  return (
    <nav className="lf-scroll" style={{
      width: "var(--studio-nav-w)", flex: "none", borderRight: "1px solid var(--border-subtle)",
      background: "var(--bg-base)", padding: "14px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 18,
    }}>
      {groups.map((group) => (
        <div key={group.title}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "var(--tracking-wider)", color: "var(--text-faint)", textTransform: "uppercase", padding: "0 10px 8px" }}>{group.title}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {group.items.map(([key, ic, enLabel]) => {
              const label = isEn && enLabel ? enLabel : key;
              const isMonster = key === "monster" || key.includes("怪物");
              const isLibrary = key === "assetLibrary" || key.includes("素材库");
              return (
              <NavItem key={key} icon={<OrbIcon name={ic} size={26} active={key === active} />} active={key === active}
                count={(isMonster || isLibrary) ? (isMonster ? 42 : 318) : null}
                onClick={() => setActive(key)}>{label}</NavItem>
            );
            })}
          </div>
        </div>
      ))}
      <div style={{ marginTop: "auto", padding: 14, borderRadius: "var(--radius-lg)", background: "linear-gradient(160deg, rgba(201,163,91,0.12), var(--surface-card))", border: "1px solid var(--border-default)" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 14, color: "var(--gold-200)" }}>{cfg.upgradeTitle}</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-secondary)", marginTop: 5, lineHeight: 1.6 }}>{cfg.upgradeText}</div>
      </div>
    </nav>
  );
}
Object.assign(window, { StudioNav });
