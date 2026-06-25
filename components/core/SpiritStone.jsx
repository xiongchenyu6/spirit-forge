import React from "react";

/**
 * SpiritStone — 灵石 currency display. The glowing gold gem + balance.
 * Drop `onAdd` to show a "+" entry that opens the 看广告领取灵石 flow.
 */
export function SpiritStone({ count = 0, size = "md", onAdd, low = false, art = "crystal", style = {}, ...rest }) {
  const scale = { sm: 0.85, md: 1, lg: 1.2 }[size] || 1;
  const gem = Math.round(art === "crystal" ? 18 * scale : 14 * scale);
  const base = (typeof window !== "undefined" && window.LF_ICON_BASE) || "";
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: Math.round(8 * scale),
        height: size === "lg" ? "var(--control-h)" : "var(--control-h-sm)",
        padding: `0 ${Math.round(10 * scale)}px`,
        background: low ? "rgba(192,57,43,0.12)" : "var(--surface-raised)",
        border: "1px solid " + (low ? "rgba(192,57,43,0.4)" : "var(--border-default)"),
        borderRadius: "var(--radius-pill)",
        boxShadow: "var(--inset-top)",
        ...style,
      }}
      {...rest}
    >
      {art === "crystal" ? (
        <img src={`${base}assets/ui/coin-crystal.png`} alt="" aria-hidden draggable="false"
          style={{ width: gem, height: gem, objectFit: "contain", flex: "none", filter: "drop-shadow(0 0 5px rgba(140,200,240,0.5))" }} />
      ) : (
        <span aria-hidden style={{
          width: gem, height: gem,
          background: "linear-gradient(135deg, var(--gold-200), var(--gold-400) 50%, var(--gold-600))",
          transform: "rotate(45deg)",
          borderRadius: "2px",
          boxShadow: "var(--glow-spirit)",
          flex: "none",
        }} />
      )}
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: `${13 * scale}px`, fontWeight: "var(--weight-medium)",
        color: low ? "var(--cinnabar-400)" : "var(--gold-200)", lineHeight: 1, letterSpacing: "0.02em",
      }}>
        {count.toLocaleString("zh-CN")}
      </span>
      {onAdd && (
        <button
          onClick={onAdd}
          aria-label="领取灵石"
          style={{
            marginLeft: 2, width: gem + 6, height: gem + 6, borderRadius: "50%",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: "var(--gold-500)", color: "var(--text-on-gold)", border: "none",
            fontSize: `${14 * scale}px`, lineHeight: 1, cursor: "pointer", fontWeight: "var(--weight-bold)",
            transition: "filter var(--dur-base) var(--ease-out)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
        >+</button>
      )}
    </div>
  );
}
