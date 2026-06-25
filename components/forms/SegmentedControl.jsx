import React from "react";

/**
 * SegmentedControl — exclusive choice row (视角 / 输出格式 toggles).
 */
export function SegmentedControl({ options = [], value, onChange, size = "md", style = {}, ...rest }) {
  const h = { sm: 30, md: 36, lg: 42 }[size] || 36;
  return (
    <div
      style={{
        display: "inline-flex", padding: 3, gap: 2,
        background: "var(--surface-inset)", border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)", ...style,
      }}
      {...rest}
    >
      {options.map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const active = val === value;
        return (
          <button
            key={val}
            onClick={() => onChange && onChange(val)}
            style={{
              height: h, padding: "0 14px", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer",
              fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)",
              fontWeight: active ? "var(--weight-medium)" : "var(--weight-regular)",
              color: active ? "var(--text-on-gold)" : "var(--text-secondary)",
              background: active ? "linear-gradient(135deg, var(--gold-400), var(--gold-600))" : "transparent",
              boxShadow: active ? "var(--shadow-xs)" : "none",
              transition: "all var(--dur-fast) var(--ease-out)",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
