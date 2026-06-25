import React from "react";

/**
 * Badge — small status / count label.
 */
export function Badge({ children, tone = "neutral", solid = false, style = {}, ...rest }) {
  const tones = {
    neutral: { fg: "var(--text-secondary)", bg: "rgba(244,241,232,0.07)", bd: "var(--border-subtle)" },
    gold: { fg: "var(--gold-200)", bg: "rgba(201,163,91,0.14)", bd: "rgba(201,163,91,0.4)" },
    jade: { fg: "var(--jade-200)", bg: "rgba(47,110,100,0.18)", bd: "var(--border-jade)" },
    moon: { fg: "var(--moon-300)", bg: "rgba(110,146,184,0.16)", bd: "rgba(110,146,184,0.35)" },
    danger: { fg: "var(--cinnabar-400)", bg: "rgba(192,57,43,0.14)", bd: "rgba(192,57,43,0.4)" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        height: 22, padding: "0 9px",
        fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)",
        letterSpacing: "var(--tracking-wide)", lineHeight: 1,
        color: solid ? "var(--text-on-gold)" : t.fg,
        background: solid ? "var(--gold-500)" : t.bg,
        border: "1px solid " + (solid ? "transparent" : t.bd),
        borderRadius: "var(--radius-sm)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
