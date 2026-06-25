import React from "react";

/**
 * NavItem — left-rail navigation entry (创作台 asset-type nav / 素材库 sidebar).
 */
export function NavItem({ children, icon = null, active = false, count = null, onClick, style = {}, ...rest }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 11, width: "100%",
        height: 42, padding: "0 12px", textAlign: "left",
        background: active ? "linear-gradient(90deg, rgba(201,163,91,0.16), rgba(201,163,91,0.02))" : "transparent",
        border: "1px solid " + (active ? "var(--border-default)" : "transparent"),
        borderRadius: "var(--radius-md)", cursor: "pointer", position: "relative",
        color: active ? "var(--gold-200)" : "var(--text-secondary)",
        fontFamily: "var(--font-sans)", fontSize: "var(--text-base)",
        fontWeight: active ? "var(--weight-medium)" : "var(--weight-regular)",
        transition: "all var(--dur-base) var(--ease-out)",
        ...style,
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(244,241,232,0.04)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
      {...rest}
    >
      {active && <span style={{ position: "absolute", left: -1, top: 11, bottom: 11, width: 2.5, background: "var(--gold-400)", borderRadius: 2, boxShadow: "var(--glow-gold)" }} />}
      {icon && <span style={{ display: "flex", flex: "none", width: 24, height: 24, alignItems: "center", justifyContent: "center" }}>{icon}</span>}
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{children}</span>
      {count != null && <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{count}</span>}
    </button>
  );
}
