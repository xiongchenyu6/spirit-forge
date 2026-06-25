import React from "react";

/**
 * Button — 灵机阁 primary action control.
 * Variants: gold (primary 造物), jade (secondary), ghost, outline, danger.
 */
export function Button({
  children,
  variant = "gold",
  size = "md",
  icon = null,
  iconRight = null,
  loading = false,
  disabled = false,
  full = false,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: { height: "var(--control-h-sm)", padding: "0 14px", font: "var(--text-sm)", gap: "6px" },
    md: { height: "var(--control-h)", padding: "0 20px", font: "var(--text-base)", gap: "8px" },
    lg: { height: "var(--control-h-lg)", padding: "0 28px", font: "var(--text-md)", gap: "10px" },
  };
  const s = sizes[size] || sizes.md;

  const variants = {
    gold: {
      background: "linear-gradient(135deg, var(--gold-300), var(--gold-500) 55%, var(--gold-600))",
      color: "var(--text-on-gold)",
      border: "1px solid var(--gold-600)",
      fontWeight: "var(--weight-semibold)",
      boxShadow: "var(--shadow-xs)",
    },
    jade: {
      background: "rgba(47, 110, 100, 0.16)",
      color: "var(--jade-200)",
      border: "1px solid var(--border-jade)",
      fontWeight: "var(--weight-medium)",
    },
    outline: {
      background: "transparent",
      color: "var(--gold-300)",
      border: "1px solid var(--border-strong)",
      fontWeight: "var(--weight-medium)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-secondary)",
      border: "1px solid transparent",
      fontWeight: "var(--weight-medium)",
    },
    danger: {
      background: "rgba(192, 57, 43, 0.14)",
      color: "var(--cinnabar-400)",
      border: "1px solid rgba(192, 57, 43, 0.4)",
      fontWeight: "var(--weight-medium)",
    },
  };
  const v = variants[variant] || variants.gold;

  return (
    <button
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: s.gap,
        height: s.height,
        padding: s.padding,
        width: full ? "100%" : "auto",
        fontFamily: "var(--font-sans)",
        fontSize: s.font,
        lineHeight: 1,
        letterSpacing: "var(--tracking-wide)",
        borderRadius: "var(--radius-md)",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        whiteSpace: "nowrap",
        transition: "transform var(--dur-fast) var(--ease-out), filter var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)",
        ...v,
        ...style,
      }}
      onMouseDown={(e) => { if (!disabled && !loading) e.currentTarget.style.transform = "scale(var(--press-scale))"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onMouseEnter={(e) => {
        if (disabled || loading) return;
        if (variant === "gold") { e.currentTarget.style.filter = "brightness(1.06)"; e.currentTarget.style.boxShadow = "var(--glow-gold)"; }
        else { e.currentTarget.style.filter = "brightness(1.12)"; }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.filter = "none";
        if (variant === "gold") e.currentTarget.style.boxShadow = "var(--shadow-xs)";
      }}
      {...rest}
    >
      {loading ? (
        <span style={{
          width: 14, height: 14, borderRadius: "50%",
          border: "2px solid currentColor", borderTopColor: "transparent",
          display: "inline-block", animation: "lf-spin 0.7s linear infinite",
        }} />
      ) : icon}
      {children}
      {iconRight}
      <style>{`@keyframes lf-spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  );
}
