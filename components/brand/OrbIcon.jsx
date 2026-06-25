import React from "react";

/**
 * OrbIcon — painterly 仙侠 circular orb icon (sliced from the brand icon set).
 * Renders one of the PNG art icons in assets/icons/.
 *
 * Path resolution: src = (window.LF_ICON_BASE || "") + "assets/icons/<name>.png".
 * Pages set window.LF_ICON_BASE to the relative prefix to the project root
 * (e.g. "../../" inside ui_kits/<x>/). Defaults to "" (project root).
 */
export const ORB_ICONS = [
  "emblem", "crystal", "scroll", "censer", "gourd",
  "pagoda", "sword", "portal", "scroll-bamboo", "book",
  "meditation", "mountain", "taiji", "crane", "starchart",
  "pouch", "talisman", "gem", "beast", "shrine", "brush", "chest",
];

export function OrbIcon({ name = "crystal", size = 44, active = false, framed = false, glow = false, onClick, style = {}, ...rest }) {
  const base = (typeof window !== "undefined" && window.LF_ICON_BASE) || "";
  const src = `${base}assets/icons/${name}.png`;
  const interactive = !!onClick;
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: size, height: size, flex: "none", borderRadius: "50%", position: "relative",
        background: framed ? "radial-gradient(circle at 50% 38%, rgba(47,110,100,0.18), var(--surface-inset))" : "transparent",
        border: framed ? "1px solid " + (active ? "var(--border-strong)" : "var(--border-subtle)") : "none",
        boxShadow: (glow || active) ? "var(--glow-gold)" : "none",
        cursor: interactive ? "pointer" : "default",
        transition: "transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)",
        ...style,
      }}
      onMouseEnter={interactive ? (e) => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "var(--glow-gold)"; } : undefined}
      onMouseLeave={interactive ? (e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = (glow || active) ? "var(--glow-gold)" : "none"; } : undefined}
      {...rest}
    >
      <img src={src} alt={name} draggable="false" style={{ width: framed ? "82%" : "100%", height: framed ? "82%" : "100%", objectFit: "contain", filter: active ? "saturate(1.15) brightness(1.08)" : "none", transition: "filter var(--dur-base)" }} />
    </span>
  );
}
