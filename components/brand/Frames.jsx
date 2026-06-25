import React from "react";

const B = () => (typeof window !== "undefined" && window.LF_ICON_BASE) || "";

/**
 * OrnateBar — 鎏金 resource/progress bar (血条/进度条). Trough art + glowing fill.
 */
export function OrnateBar({ value = 0, tone = "teal", height = 20, label = null, style = {}, ...rest }) {
  const pct = Math.max(0, Math.min(100, value));
  const fills = {
    teal: "linear-gradient(90deg, var(--jade-600), var(--jade-300))",
    gold: "linear-gradient(90deg, var(--gold-600), var(--gold-300))",
    moon: "linear-gradient(90deg, var(--moon-700), var(--moon-300))",
    cinnabar: "linear-gradient(90deg, var(--cinnabar-600), var(--cinnabar-400))",
  };
  return (
    <div style={{ width: "100%", ...style }} {...rest}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", color: "var(--text-secondary)", marginBottom: 6 }}>
          <span>{label}</span><span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{Math.round(pct)}%</span>
        </div>
      )}
      <div style={{ position: "relative", height, background: `url(${B()}assets/ui/bar-frame.png) center/100% 100% no-repeat` }}>
        <div style={{
          position: "absolute", left: "5.5%", top: "30%", height: "40%",
          width: `calc((100% - 11%) * ${pct / 100})`,
          background: fills[tone] || fills.teal, borderRadius: 999,
          boxShadow: "0 0 8px rgba(116,176,164,0.5)", transition: "width var(--dur-slow) var(--ease-out)",
        }} />
      </div>
    </div>
  );
}

/**
 * Banner — hanging 旗幡 crest banner with a short label/number in its body.
 */
export function Banner({ variant = "teal", children, size = 64, style = {} }) {
  const img = variant === "paper" ? "banner-paper" : "banner-teal";
  const h = (size * 120) / 70;
  const paper = variant === "paper";
  return (
    <div style={{ width: size, height: h, background: `url(${B()}assets/ui/${img}.png) center/contain no-repeat`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", ...style }}>
      <span style={{ marginTop: -h * 0.08, fontFamily: "var(--font-serif)", fontWeight: "var(--weight-bold)", fontSize: size * 0.26, color: paper ? "#3a2f1a" : "#eafffb", textShadow: paper ? "none" : "0 1px 3px rgba(0,0,0,0.5)", letterSpacing: "0.02em" }}>{children}</span>
    </div>
  );
}

/**
 * FeaturePanel — pagoda-roof framed scene panel (卷轴/匾额 弹窗) with content
 * overlaid on the misty interior. For hero blocks, empty states, feature dialogs.
 */
export function FeaturePanel({ children, style = {}, bodyStyle = {} }) {
  return (
    <div style={{ position: "relative", aspectRatio: "456 / 318", background: `url(${B()}assets/ui/feature-frame.png) center/100% 100% no-repeat`, ...style }}>
      <div style={{ position: "absolute", top: "21%", left: "9%", right: "9%", bottom: "13%", display: "flex", flexDirection: "column", justifyContent: "center", ...bodyStyle }}>
        {children}
      </div>
    </div>
  );
}
