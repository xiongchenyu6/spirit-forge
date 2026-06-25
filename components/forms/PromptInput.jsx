import React from "react";

/**
 * PromptInput — the 创作台 Prompt 输入框. Multi-line, with a send action and helper row.
 */
export function PromptInput({ value, onChange, placeholder = "用中文描述你想要的素材…", onGenerate, cost = 1, footer = null, style = {}, ...rest }) {
  return (
    <div
      style={{
        background: "var(--surface-inset)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--inset-top)",
        padding: 16,
        display: "flex", flexDirection: "column", gap: 12,
        ...style,
      }}
      {...rest}
    >
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className="lf-scroll"
        style={{
          width: "100%", resize: "none", background: "transparent", border: "none", outline: "none",
          color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "var(--text-md)",
          lineHeight: "var(--leading-normal)",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
          {footer}
        </div>
        <button
          onClick={onGenerate}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8, height: "var(--control-h)", padding: "0 22px",
            background: "linear-gradient(135deg, var(--gold-300), var(--gold-500) 55%, var(--gold-600))",
            color: "var(--text-on-gold)", border: "1px solid var(--gold-600)", borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-sans)", fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)",
            letterSpacing: "var(--tracking-wide)", cursor: "pointer",
            transition: "filter var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.06)"; e.currentTarget.style.boxShadow = "var(--glow-gold)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; e.currentTarget.style.boxShadow = "none"; }}
        >
          开始生成
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", opacity: 0.8 }}>
            <span style={{ width: 9, height: 9, background: "currentColor", transform: "rotate(45deg)", borderRadius: 1, display: "inline-block" }} />
            {cost}
          </span>
        </button>
      </div>
    </div>
  );
}
