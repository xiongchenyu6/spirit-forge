import React from "react";

const B = () => (typeof window !== "undefined" && window.LF_ICON_BASE) || "";

/**
 * CloudDivider — 云纹分隔线 ornament for section breaks.
 */
export function CloudDivider({ maxWidth = 380, style = {}, ...rest }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%", ...style }} {...rest}>
      <img src={`${B()}assets/ui/divider-cloud.png`} alt="" aria-hidden draggable="false"
        style={{ width: "100%", maxWidth, height: "auto", opacity: 0.92 }} />
    </div>
  );
}

/**
 * OrnatePlate — cloud + pagoda topped parchment title plate (玉简/匾额).
 * Aspect ~2.63:1; text sits in the lower parchment area.
 */
export function OrnatePlate({ children, width = 320, color = "#3a2f1a", fontSize = 22, style = {} }) {
  const h = width / 2.63;
  return (
    <div style={{ width, height: h, background: `url(${B()}assets/ui/plate.png) center/contain no-repeat`, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>
      <span style={{ fontFamily: "var(--font-serif)", fontWeight: "var(--weight-bold)", fontSize, color, marginTop: h * 0.13, letterSpacing: "0.04em" }}>{children}</span>
    </div>
  );
}

/**
 * RewardBurst — 宝箱 reward art for ad / onboarding 灵石 grants.
 */
export function RewardBurst({ size = 150, style = {} }) {
  return <img src={`${B()}assets/ui/reward-box.png`} alt="reward" draggable="false"
    style={{ width: size, height: "auto", filter: "drop-shadow(0 0 22px rgba(201,163,91,0.4))", ...style }} />;
}
