import React from "react";

/**
 * Dialog — centered modal with ink-fog backdrop and a 切角 plate.
 */
export function Dialog({ open = true, onClose, title, children, footer, width = 420, cut = true, style = {} }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "var(--ink-fog)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        animation: "lf-fade var(--dur-base) var(--ease-out)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: "100%", position: "relative",
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
          borderRadius: cut ? 0 : "var(--radius-xl)",
          clipPath: cut ? "var(--cut-corner)" : "none",
          boxShadow: "var(--shadow-modal), var(--glow-gold)",
          padding: 28,
          animation: "lf-rise var(--dur-slow) var(--ease-out)",
          ...style,
        }}
      >
        {title && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ width: 8, height: 8, background: "var(--gold-400)", transform: "rotate(45deg)", boxShadow: "var(--glow-spirit)" }} />
            <h3 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>{title}</h3>
          </div>
        )}
        <div style={{ color: "var(--text-secondary)", fontSize: "var(--text-base)", lineHeight: "var(--leading-normal)" }}>
          {children}
        </div>
        {footer && <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "flex-end" }}>{footer}</div>}
      </div>
      <style>{`@keyframes lf-fade{from{opacity:0}}@keyframes lf-rise{from{opacity:0;transform:translateY(12px) scale(0.98)}}`}</style>
    </div>
  );
}
