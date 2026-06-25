import React from "react";

/**
 * Tag — selectable chip used across the parameter panel (题材 / 风格 / 视角 / 动作).
 */
export function Tag({ children, selected = false, icon = null, onClick, disabled = false, style = {}, ...rest }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        height: 30, padding: "0 12px",
        fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)",
        fontWeight: selected ? "var(--weight-medium)" : "var(--weight-regular)",
        color: selected ? "var(--gold-200)" : "var(--text-secondary)",
        background: selected ? "rgba(201,163,91,0.16)" : "var(--surface-inset)",
        border: "1px solid " + (selected ? "var(--border-strong)" : "var(--border-subtle)"),
        borderRadius: "var(--radius-pill)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        boxShadow: selected ? "var(--glow-gold)" : "none",
        transition: "all var(--dur-base) var(--ease-out)",
        ...style,
      }}
      onMouseEnter={(e) => { if (!selected && !disabled) { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
      onMouseLeave={(e) => { if (!selected && !disabled) { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
