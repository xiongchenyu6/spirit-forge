import React from "react";

/**
 * Switch — toggle (透明背景开关 / 风格锁定 / 批量生成).
 */
export function Switch({ checked = false, onChange, label, disabled = false, style = {}, ...rest }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange && onChange(!checked)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 10, background: "none", border: "none",
        cursor: disabled ? "not-allowed" : "pointer", padding: 0, opacity: disabled ? 0.45 : 1, ...style,
      }}
      {...rest}
    >
      <span style={{
        width: 38, height: 22, borderRadius: "var(--radius-pill)", flex: "none", position: "relative",
        background: checked ? "linear-gradient(135deg, var(--gold-400), var(--gold-600))" : "var(--surface-raised)",
        border: "1px solid " + (checked ? "var(--gold-600)" : "var(--border-default)"),
        boxShadow: checked ? "var(--glow-gold)" : "var(--inset-top)",
        transition: "all var(--dur-base) var(--ease-out)",
      }}>
        <span style={{
          position: "absolute", top: 2, left: checked ? 18 : 2, width: 16, height: 16, borderRadius: "50%",
          background: checked ? "var(--ink-900)" : "var(--text-secondary)",
          transition: "left var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)",
        }} />
      </span>
      {label && <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{label}</span>}
    </button>
  );
}
