import React from "react";

/**
 * Input — single-line text field with optional leading icon / suffix.
 */
export function Input({ icon = null, suffix = null, size = "md", invalid = false, style = {}, wrapStyle = {}, ...rest }) {
  const h = { sm: "var(--control-h-sm)", md: "var(--control-h)", lg: "var(--control-h-lg)" }[size] || "var(--control-h)";
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 8, height: h, padding: "0 12px",
        background: "var(--surface-inset)",
        border: "1px solid " + (invalid ? "rgba(192,57,43,0.5)" : "var(--border-subtle)"),
        borderRadius: "var(--radius-md)",
        transition: "border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
        ...wrapStyle,
      }}
      onFocusCapture={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.boxShadow = "var(--ring-focus)"; }}
      onBlurCapture={(e) => { e.currentTarget.style.borderColor = invalid ? "rgba(192,57,43,0.5)" : "var(--border-subtle)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {icon && <span style={{ color: "var(--text-muted)", display: "flex", flex: "none" }}>{icon}</span>}
      <input
        style={{
          flex: 1, minWidth: 0, height: "100%", background: "transparent", border: "none", outline: "none",
          color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "var(--text-base)",
          ...style,
        }}
        {...rest}
      />
      {suffix && <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", flex: "none" }}>{suffix}</span>}
    </div>
  );
}
