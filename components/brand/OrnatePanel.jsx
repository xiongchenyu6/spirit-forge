import React from "react";

const B = () => (typeof window !== "undefined" && window.LF_ICON_BASE) || "";

/**
 * OrnatePanel — gold-rimmed plate frame (9-slice border-image from the slot art)
 * over a surface color. The 炼器台 framed container.
 */
export function OrnatePanel({ children, surface = "var(--surface-card)", padding = 22, slice = 28, glow = false, style = {}, ...rest }) {
  return (
    <div
      style={{
        borderStyle: "solid", borderWidth: slice, borderColor: "transparent",
        borderImage: `url(${B()}assets/ui/slot.png) ${slice} / ${slice}px / 0 stretch`,
        background: surface, backgroundClip: "padding-box",
        boxShadow: glow ? "var(--glow-gold)" : "none",
        ...style,
      }}
      {...rest}
    >
      <div style={{ padding: typeof padding === "number" ? padding - slice + "px" : padding, margin: 0 }}>
        {children}
      </div>
    </div>
  );
}
