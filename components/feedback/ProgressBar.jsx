import React from "react";

/**
 * ProgressBar — generation / ad-watch progress. `tone` recolors the fill.
 */
export function ProgressBar({ value = 0, tone = "gold", height = 6, label = null, animated = false, style = {}, ...rest }) {
  const fills = {
    gold: "linear-gradient(90deg, var(--gold-500), var(--gold-300))",
    jade: "linear-gradient(90deg, var(--jade-500), var(--jade-300))",
    moon: "linear-gradient(90deg, var(--moon-500), var(--moon-300))",
  };
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", ...style }} {...rest}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
          <span>{label}</span><span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{Math.round(pct)}%</span>
        </div>
      )}
      <div style={{ width: "100%", height, background: "var(--surface-inset)", borderRadius: "var(--radius-pill)", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
        <div style={{
          width: pct + "%", height: "100%", background: fills[tone] || fills.gold,
          borderRadius: "var(--radius-pill)", boxShadow: "var(--glow-gold)",
          transition: "width var(--dur-slow) var(--ease-out)",
          backgroundSize: animated ? "200% 100%" : "auto",
          animation: animated ? "lf-flow 1.4s linear infinite" : "none",
        }} />
      </div>
      <style>{`@keyframes lf-flow{to{background-position:200% 0}}`}</style>
    </div>
  );
}
