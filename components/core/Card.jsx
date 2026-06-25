import React from "react";

/**
 * Card — 炼器台 plate surface. `cut` enables the 切角 corner motif.
 */
export function Card({ children, cut = false, glow = "none", interactive = false, padding = 20, style = {}, ...rest }) {
  const glows = { none: "var(--shadow-card)", gold: "var(--shadow-card), var(--glow-gold)", jade: "var(--shadow-card), var(--glow-jade)" };
  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: cut ? 0 : "var(--radius-lg)",
        clipPath: cut ? "var(--cut-corner)" : "none",
        boxShadow: glows[glow] || glows.none,
        padding: typeof padding === "number" ? padding + "px" : padding,
        position: "relative",
        transition: "border-color var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
        cursor: interactive ? "pointer" : "default",
        ...style,
      }}
      onMouseEnter={interactive ? (e) => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-panel), var(--glow-gold)"; } : undefined}
      onMouseLeave={interactive ? (e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = glows[glow] || glows.none; } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}
