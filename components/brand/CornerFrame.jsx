import React from "react";

const B = () => (typeof window !== "undefined" && window.LF_ICON_BASE) || "";

/**
 * CornerFrame — wraps content in four 鎏金 corner ornaments (角标花纹) over an
 * optional hairline border. Decorative framing for cards, modals, hero blocks.
 */
export function CornerFrame({ children, cornerSize = 30, bordered = true, pad = 18, style = {}, ...rest }) {
  const src = `${B()}assets/ui/corner.png`;
  const rot = { tl: 0, tr: 90, br: 180, bl: 270 };
  const pos = {
    tl: { top: -2, left: -2 }, tr: { top: -2, right: -2 },
    br: { bottom: -2, right: -2 }, bl: { bottom: -2, left: -2 },
  };
  return (
    <div style={{ position: "relative", padding: pad, border: bordered ? "1px solid var(--border-default)" : "none", borderRadius: "var(--radius-sm)", ...style }} {...rest}>
      {Object.keys(rot).map((k) => (
        <img key={k} src={src} alt="" aria-hidden draggable="false"
          style={{ position: "absolute", width: cornerSize, height: cornerSize, transform: `rotate(${rot[k]}deg)`, pointerEvents: "none", ...pos[k] }} />
      ))}
      {children}
    </div>
  );
}
