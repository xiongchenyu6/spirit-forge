import React from "react";

/**
 * IconButton — square icon-only control (toolbar / 工具栏).
 */
export function IconButton({ children, size = "md", variant = "ghost", active = false, label, style = {}, ...rest }) {
  const dims = { sm: 32, md: 40, lg: 48 }[size] || 40;
  const variants = {
    ghost: { background: active ? "rgba(201,163,91,0.14)" : "transparent", color: active ? "var(--gold-300)" : "var(--text-secondary)", border: "1px solid " + (active ? "var(--border-default)" : "transparent") },
    surface: { background: "var(--surface-raised)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" },
    gold: { background: "linear-gradient(135deg, var(--gold-400), var(--gold-600))", color: "var(--text-on-gold)", border: "1px solid var(--gold-600)" },
  };
  const v = variants[variant] || variants.ghost;
  return (
    <button
      aria-label={label}
      title={label}
      style={{
        width: dims, height: dims, display: "inline-flex", alignItems: "center", justifyContent: "center",
        borderRadius: "var(--radius-md)", cursor: "pointer",
        transition: "background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out), transform var(--dur-fast) var(--ease-out)",
        ...v, ...style,
      }}
      onMouseEnter={(e) => { if (variant === "ghost" && !active) { e.currentTarget.style.background = "rgba(244,241,232,0.05)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
      onMouseLeave={(e) => { if (variant === "ghost" && !active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
      onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.92)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      {...rest}
    >
      {children}
    </button>
  );
}
