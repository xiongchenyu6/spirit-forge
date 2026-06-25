import React from "react";

/**
 * Select — native dropdown styled as a 灵机阁 control.
 */
export function Select({ children, size = "md", style = {}, wrapStyle = {}, ...rest }) {
  const h = { sm: "var(--control-h-sm)", md: "var(--control-h)", lg: "var(--control-h-lg)" }[size] || "var(--control-h)";
  return (
    <div style={{ position: "relative", display: "inline-flex", width: "100%", ...wrapStyle }}>
      <select
        style={{
          appearance: "none", width: "100%", height: h, padding: "0 34px 0 12px",
          background: "var(--surface-inset)", color: "var(--text-primary)",
          border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)",
          fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", cursor: "pointer", outline: "none",
          transition: "border-color var(--dur-base) var(--ease-out)",
          ...style,
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
        {...rest}
      >
        {children}
      </select>
      <span aria-hidden style={{
        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
        pointerEvents: "none", color: "var(--text-muted)", fontSize: 10,
      }}>▾</span>
    </div>
  );
}
