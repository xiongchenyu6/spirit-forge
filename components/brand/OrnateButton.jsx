import React from "react";

const B = () => (typeof window !== "undefined" && window.LF_ICON_BASE) || "";

/**
 * OrnateButton — painterly 鎏金 bitmap button (厚涂 teal/paper plate stretched to size).
 * For hero / feature CTAs. For dense UI use the crisp <Button> instead.
 */
export function OrnateButton({ children, variant = "teal", size = "md", icon = null, full = false, disabled = false, onClick, style = {}, ...rest }) {
  const h = { sm: 40, md: 50, lg: 60 }[size] || 50;
  const paper = variant === "paper";
  const img = paper ? "btn-paper" : "btn-teal";
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        height: h, minWidth: 132, width: full ? "100%" : "auto",
        padding: `0 ${Math.round(h * 0.62)}px`,
        background: `url(${B()}assets/ui/${img}.png) center/100% 100% no-repeat`,
        color: paper ? "#3a2f1a" : "#eafffb",
        fontFamily: "var(--font-serif)", fontWeight: "var(--weight-semibold)", fontSize: size === "lg" ? 18 : 16,
        letterSpacing: "0.04em", border: "none", cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, whiteSpace: "nowrap",
        textShadow: paper ? "none" : "0 1px 4px rgba(0,0,0,0.55)",
        opacity: disabled ? 0.5 : 1,
        transition: "filter var(--dur-base) var(--ease-out), transform var(--dur-fast) var(--ease-out)",
        ...style,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(1.12) drop-shadow(0 0 10px rgba(201,163,91,0.35))"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "scale(1)"; }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      {...rest}
    >
      {icon}{children}
    </button>
  );
}
