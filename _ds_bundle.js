/* @ds-bundle: {"format":3,"namespace":"LingjiForgeDesignSystem_e6d384","components":[{"name":"CornerFrame","sourcePath":"components/brand/CornerFrame.jsx"},{"name":"OrnateBar","sourcePath":"components/brand/Frames.jsx"},{"name":"Banner","sourcePath":"components/brand/Frames.jsx"},{"name":"FeaturePanel","sourcePath":"components/brand/Frames.jsx"},{"name":"ORB_ICONS","sourcePath":"components/brand/OrbIcon.jsx"},{"name":"OrbIcon","sourcePath":"components/brand/OrbIcon.jsx"},{"name":"CloudDivider","sourcePath":"components/brand/Ornaments.jsx"},{"name":"OrnatePlate","sourcePath":"components/brand/Ornaments.jsx"},{"name":"RewardBurst","sourcePath":"components/brand/Ornaments.jsx"},{"name":"OrnateButton","sourcePath":"components/brand/OrnateButton.jsx"},{"name":"OrnatePanel","sourcePath":"components/brand/OrnatePanel.jsx"},{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"SpiritStone","sourcePath":"components/core/SpiritStone.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"ProgressBar","sourcePath":"components/feedback/ProgressBar.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"PromptInput","sourcePath":"components/forms/PromptInput.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Tag","sourcePath":"components/forms/Tag.jsx"},{"name":"NavItem","sourcePath":"components/navigation/NavItem.jsx"}],"sourceHashes":{"components/brand/CornerFrame.jsx":"f1c0092de7c2","components/brand/Frames.jsx":"09603e5c1f14","components/brand/OrbIcon.jsx":"f2c5ac15bdc4","components/brand/Ornaments.jsx":"74b565eafe48","components/brand/OrnateButton.jsx":"a329661b567c","components/brand/OrnatePanel.jsx":"473f6f2fc186","components/core/Avatar.jsx":"957d6b64fc87","components/core/Badge.jsx":"521df21d7a3a","components/core/Button.jsx":"5d9daf3ec097","components/core/Card.jsx":"38ba1eee4a5d","components/core/IconButton.jsx":"e4186689c88a","components/core/SpiritStone.jsx":"87e6e6311177","components/feedback/Dialog.jsx":"848026934b02","components/feedback/ProgressBar.jsx":"092a490bc9df","components/forms/Input.jsx":"1db0c8b2bbf7","components/forms/PromptInput.jsx":"170b068c225b","components/forms/SegmentedControl.jsx":"07147bd56320","components/forms/Select.jsx":"778aa7dff4c0","components/forms/Switch.jsx":"a2ebab164d34","components/forms/Tag.jsx":"9f8665c03eaa","components/navigation/NavItem.jsx":"8122803b7f22","ui_kits/landing/Capabilities.jsx":"6c0a9a3b8755","ui_kits/landing/GenreShowcase.jsx":"54051d7e57ca","ui_kits/landing/Hero.jsx":"c15e030a24d8","ui_kits/landing/Sections.jsx":"289532a59799","ui_kits/landing/Shared.jsx":"15b374924bf2","ui_kits/landing/TopNav.jsx":"ac079bb66e3c","ui_kits/studio/AdModal.jsx":"daa07f0f09c1","ui_kits/studio/ParamPanel.jsx":"c283292e096b","ui_kits/studio/StudioCanvas.jsx":"931875ad00d0","ui_kits/studio/StudioNav.jsx":"71b474bebcd9","ui_kits/studio/StudioTopBar.jsx":"ced4295d63d8"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LingjiForgeDesignSystem_e6d384 = window.LingjiForgeDesignSystem_e6d384 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/CornerFrame.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const B = () => typeof window !== "undefined" && window.LF_ICON_BASE || "";

/**
 * CornerFrame — wraps content in four 鎏金 corner ornaments (角标花纹) over an
 * optional hairline border. Decorative framing for cards, modals, hero blocks.
 */
function CornerFrame({
  children,
  cornerSize = 30,
  bordered = true,
  pad = 18,
  style = {},
  ...rest
}) {
  const src = `${B()}assets/ui/corner.png`;
  const rot = {
    tl: 0,
    tr: 90,
    br: 180,
    bl: 270
  };
  const pos = {
    tl: {
      top: -2,
      left: -2
    },
    tr: {
      top: -2,
      right: -2
    },
    br: {
      bottom: -2,
      right: -2
    },
    bl: {
      bottom: -2,
      left: -2
    }
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: "relative",
      padding: pad,
      border: bordered ? "1px solid var(--border-default)" : "none",
      borderRadius: "var(--radius-sm)",
      ...style
    }
  }, rest), Object.keys(rot).map(k => /*#__PURE__*/React.createElement("img", {
    key: k,
    src: src,
    alt: "",
    "aria-hidden": true,
    draggable: "false",
    style: {
      position: "absolute",
      width: cornerSize,
      height: cornerSize,
      transform: `rotate(${rot[k]}deg)`,
      pointerEvents: "none",
      ...pos[k]
    }
  })), children);
}
Object.assign(__ds_scope, { CornerFrame });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/CornerFrame.jsx", error: String((e && e.message) || e) }); }

// components/brand/Frames.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const B = () => typeof window !== "undefined" && window.LF_ICON_BASE || "";

/**
 * OrnateBar — 鎏金 resource/progress bar (血条/进度条). Trough art + glowing fill.
 */
function OrnateBar({
  value = 0,
  tone = "teal",
  height = 20,
  label = null,
  style = {},
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value));
  const fills = {
    teal: "linear-gradient(90deg, var(--jade-600), var(--jade-300))",
    gold: "linear-gradient(90deg, var(--gold-600), var(--gold-300))",
    moon: "linear-gradient(90deg, var(--moon-700), var(--moon-300))",
    cinnabar: "linear-gradient(90deg, var(--cinnabar-600), var(--cinnabar-400))"
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: "100%",
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "var(--text-xs)",
      color: "var(--text-secondary)",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      color: "var(--text-muted)"
    }
  }, Math.round(pct), "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height,
      background: `url(${B()}assets/ui/bar-frame.png) center/100% 100% no-repeat`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "5.5%",
      top: "30%",
      height: "40%",
      width: `calc((100% - 11%) * ${pct / 100})`,
      background: fills[tone] || fills.teal,
      borderRadius: 999,
      boxShadow: "0 0 8px rgba(116,176,164,0.5)",
      transition: "width var(--dur-slow) var(--ease-out)"
    }
  })));
}

/**
 * Banner — hanging 旗幡 crest banner with a short label/number in its body.
 */
function Banner({
  variant = "teal",
  children,
  size = 64,
  style = {}
}) {
  const img = variant === "paper" ? "banner-paper" : "banner-teal";
  const h = size * 120 / 70;
  const paper = variant === "paper";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: h,
      background: `url(${B()}assets/ui/${img}.png) center/contain no-repeat`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: -h * 0.08,
      fontFamily: "var(--font-serif)",
      fontWeight: "var(--weight-bold)",
      fontSize: size * 0.26,
      color: paper ? "#3a2f1a" : "#eafffb",
      textShadow: paper ? "none" : "0 1px 3px rgba(0,0,0,0.5)",
      letterSpacing: "0.02em"
    }
  }, children));
}

/**
 * FeaturePanel — pagoda-roof framed scene panel (卷轴/匾额 弹窗) with content
 * overlaid on the misty interior. For hero blocks, empty states, feature dialogs.
 */
function FeaturePanel({
  children,
  style = {},
  bodyStyle = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      aspectRatio: "456 / 318",
      background: `url(${B()}assets/ui/feature-frame.png) center/100% 100% no-repeat`,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "21%",
      left: "9%",
      right: "9%",
      bottom: "13%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      ...bodyStyle
    }
  }, children));
}
Object.assign(__ds_scope, { OrnateBar, Banner, FeaturePanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Frames.jsx", error: String((e && e.message) || e) }); }

// components/brand/OrbIcon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * OrbIcon — painterly 仙侠 circular orb icon (sliced from the brand icon set).
 * Renders one of the PNG art icons in assets/icons/.
 *
 * Path resolution: src = (window.LF_ICON_BASE || "") + "assets/icons/<name>.png".
 * Pages set window.LF_ICON_BASE to the relative prefix to the project root
 * (e.g. "../../" inside ui_kits/<x>/). Defaults to "" (project root).
 */
const ORB_ICONS = ["emblem", "crystal", "scroll", "censer", "gourd", "pagoda", "sword", "portal", "scroll-bamboo", "book", "meditation", "mountain", "taiji", "crane", "starchart", "pouch", "talisman", "gem", "beast", "shrine", "brush", "chest"];
function OrbIcon({
  name = "crystal",
  size = 44,
  active = false,
  framed = false,
  glow = false,
  onClick,
  style = {},
  ...rest
}) {
  const base = typeof window !== "undefined" && window.LF_ICON_BASE || "";
  const src = `${base}assets/icons/${name}.png`;
  const interactive = !!onClick;
  return /*#__PURE__*/React.createElement("span", _extends({
    onClick: onClick,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
      flex: "none",
      borderRadius: "50%",
      position: "relative",
      background: framed ? "radial-gradient(circle at 50% 38%, rgba(47,110,100,0.18), var(--surface-inset))" : "transparent",
      border: framed ? "1px solid " + (active ? "var(--border-strong)" : "var(--border-subtle)") : "none",
      boxShadow: glow || active ? "var(--glow-gold)" : "none",
      cursor: interactive ? "pointer" : "default",
      transition: "transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)",
      ...style
    },
    onMouseEnter: interactive ? e => {
      e.currentTarget.style.transform = "scale(1.08)";
      e.currentTarget.style.boxShadow = "var(--glow-gold)";
    } : undefined,
    onMouseLeave: interactive ? e => {
      e.currentTarget.style.transform = "scale(1)";
      e.currentTarget.style.boxShadow = glow || active ? "var(--glow-gold)" : "none";
    } : undefined
  }, rest), /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    draggable: "false",
    style: {
      width: framed ? "82%" : "100%",
      height: framed ? "82%" : "100%",
      objectFit: "contain",
      filter: active ? "saturate(1.15) brightness(1.08)" : "none",
      transition: "filter var(--dur-base)"
    }
  }));
}
Object.assign(__ds_scope, { ORB_ICONS, OrbIcon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/OrbIcon.jsx", error: String((e && e.message) || e) }); }

// components/brand/Ornaments.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const B = () => typeof window !== "undefined" && window.LF_ICON_BASE || "";

/**
 * CloudDivider — 云纹分隔线 ornament for section breaks.
 */
function CloudDivider({
  maxWidth = 380,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      justifyContent: "center",
      width: "100%",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("img", {
    src: `${B()}assets/ui/divider-cloud.png`,
    alt: "",
    "aria-hidden": true,
    draggable: "false",
    style: {
      width: "100%",
      maxWidth,
      height: "auto",
      opacity: 0.92
    }
  }));
}

/**
 * OrnatePlate — cloud + pagoda topped parchment title plate (玉简/匾额).
 * Aspect ~2.63:1; text sits in the lower parchment area.
 */
function OrnatePlate({
  children,
  width = 320,
  color = "#3a2f1a",
  fontSize = 22,
  style = {}
}) {
  const h = width / 2.63;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height: h,
      background: `url(${B()}assets/ui/plate.png) center/contain no-repeat`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-serif)",
      fontWeight: "var(--weight-bold)",
      fontSize,
      color,
      marginTop: h * 0.13,
      letterSpacing: "0.04em"
    }
  }, children));
}

/**
 * RewardBurst — 宝箱 reward art for ad / onboarding 灵石 grants.
 */
function RewardBurst({
  size = 150,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("img", {
    src: `${B()}assets/ui/reward-box.png`,
    alt: "reward",
    draggable: "false",
    style: {
      width: size,
      height: "auto",
      filter: "drop-shadow(0 0 22px rgba(201,163,91,0.4))",
      ...style
    }
  });
}
Object.assign(__ds_scope, { CloudDivider, OrnatePlate, RewardBurst });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Ornaments.jsx", error: String((e && e.message) || e) }); }

// components/brand/OrnateButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const B = () => typeof window !== "undefined" && window.LF_ICON_BASE || "";

/**
 * OrnateButton — painterly 鎏金 bitmap button (厚涂 teal/paper plate stretched to size).
 * For hero / feature CTAs. For dense UI use the crisp <Button> instead.
 */
function OrnateButton({
  children,
  variant = "teal",
  size = "md",
  icon = null,
  full = false,
  disabled = false,
  onClick,
  style = {},
  ...rest
}) {
  const h = {
    sm: 40,
    md: 50,
    lg: 60
  }[size] || 50;
  const paper = variant === "paper";
  const img = paper ? "btn-paper" : "btn-teal";
  return /*#__PURE__*/React.createElement("button", _extends({
    onClick: disabled ? undefined : onClick,
    disabled: disabled,
    style: {
      height: h,
      minWidth: 132,
      width: full ? "100%" : "auto",
      padding: `0 ${Math.round(h * 0.62)}px`,
      background: `url(${B()}assets/ui/${img}.png) center/100% 100% no-repeat`,
      color: paper ? "#3a2f1a" : "#eafffb",
      fontFamily: "var(--font-serif)",
      fontWeight: "var(--weight-semibold)",
      fontSize: size === "lg" ? 18 : 16,
      letterSpacing: "0.04em",
      border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      whiteSpace: "nowrap",
      textShadow: paper ? "none" : "0 1px 4px rgba(0,0,0,0.55)",
      opacity: disabled ? 0.5 : 1,
      transition: "filter var(--dur-base) var(--ease-out), transform var(--dur-fast) var(--ease-out)",
      ...style
    },
    onMouseEnter: e => {
      if (!disabled) e.currentTarget.style.filter = "brightness(1.12) drop-shadow(0 0 10px rgba(201,163,91,0.35))";
    },
    onMouseLeave: e => {
      e.currentTarget.style.filter = "none";
      e.currentTarget.style.transform = "scale(1)";
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = "scale(0.97)";
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = "scale(1)";
    }
  }, rest), icon, children);
}
Object.assign(__ds_scope, { OrnateButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/OrnateButton.jsx", error: String((e && e.message) || e) }); }

// components/brand/OrnatePanel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const B = () => typeof window !== "undefined" && window.LF_ICON_BASE || "";

/**
 * OrnatePanel — gold-rimmed plate frame (9-slice border-image from the slot art)
 * over a surface color. The 炼器台 framed container.
 */
function OrnatePanel({
  children,
  surface = "var(--surface-card)",
  padding = 22,
  slice = 28,
  glow = false,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      borderStyle: "solid",
      borderWidth: slice,
      borderColor: "transparent",
      borderImage: `url(${B()}assets/ui/slot.png) ${slice} / ${slice}px / 0 stretch`,
      background: surface,
      backgroundClip: "padding-box",
      boxShadow: glow ? "var(--glow-gold)" : "none",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: typeof padding === "number" ? padding - slice + "px" : padding,
      margin: 0
    }
  }, children));
}
Object.assign(__ds_scope, { OrnatePanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/OrnatePanel.jsx", error: String((e && e.message) || e) }); }

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Avatar — user or asset thumbnail with a gold hairline ring.
 */
function Avatar({
  src,
  name = "",
  size = 36,
  ring = true,
  square = false,
  style = {},
  ...rest
}) {
  const initials = name ? name.trim().slice(0, 2) : "灵";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: size,
      height: size,
      flex: "none",
      borderRadius: square ? "var(--radius-md)" : "50%",
      background: src ? `center/cover no-repeat url(${src})` : "linear-gradient(135deg, var(--jade-600), var(--jade-900))",
      border: ring ? "1px solid var(--border-strong)" : "none",
      boxShadow: ring ? "var(--inset-top)" : "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--jade-200)",
      fontFamily: "var(--font-serif)",
      fontWeight: "var(--weight-semibold)",
      fontSize: size * 0.4,
      overflow: "hidden",
      ...style
    }
  }, rest), !src && initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge — small status / count label.
 */
function Badge({
  children,
  tone = "neutral",
  solid = false,
  style = {},
  ...rest
}) {
  const tones = {
    neutral: {
      fg: "var(--text-secondary)",
      bg: "rgba(244,241,232,0.07)",
      bd: "var(--border-subtle)"
    },
    gold: {
      fg: "var(--gold-200)",
      bg: "rgba(201,163,91,0.14)",
      bd: "rgba(201,163,91,0.4)"
    },
    jade: {
      fg: "var(--jade-200)",
      bg: "rgba(47,110,100,0.18)",
      bd: "var(--border-jade)"
    },
    moon: {
      fg: "var(--moon-300)",
      bg: "rgba(110,146,184,0.16)",
      bd: "rgba(110,146,184,0.35)"
    },
    danger: {
      fg: "var(--cinnabar-400)",
      bg: "rgba(192,57,43,0.14)",
      bd: "rgba(192,57,43,0.4)"
    }
  };
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      height: 22,
      padding: "0 9px",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      fontWeight: "var(--weight-medium)",
      letterSpacing: "var(--tracking-wide)",
      lineHeight: 1,
      color: solid ? "var(--text-on-gold)" : t.fg,
      background: solid ? "var(--gold-500)" : t.bg,
      border: "1px solid " + (solid ? "transparent" : t.bd),
      borderRadius: "var(--radius-sm)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — 灵机阁 primary action control.
 * Variants: gold (primary 造物), jade (secondary), ghost, outline, danger.
 */
function Button({
  children,
  variant = "gold",
  size = "md",
  icon = null,
  iconRight = null,
  loading = false,
  disabled = false,
  full = false,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      height: "var(--control-h-sm)",
      padding: "0 14px",
      font: "var(--text-sm)",
      gap: "6px"
    },
    md: {
      height: "var(--control-h)",
      padding: "0 20px",
      font: "var(--text-base)",
      gap: "8px"
    },
    lg: {
      height: "var(--control-h-lg)",
      padding: "0 28px",
      font: "var(--text-md)",
      gap: "10px"
    }
  };
  const s = sizes[size] || sizes.md;
  const variants = {
    gold: {
      background: "linear-gradient(135deg, var(--gold-300), var(--gold-500) 55%, var(--gold-600))",
      color: "var(--text-on-gold)",
      border: "1px solid var(--gold-600)",
      fontWeight: "var(--weight-semibold)",
      boxShadow: "var(--shadow-xs)"
    },
    jade: {
      background: "rgba(47, 110, 100, 0.16)",
      color: "var(--jade-200)",
      border: "1px solid var(--border-jade)",
      fontWeight: "var(--weight-medium)"
    },
    outline: {
      background: "transparent",
      color: "var(--gold-300)",
      border: "1px solid var(--border-strong)",
      fontWeight: "var(--weight-medium)"
    },
    ghost: {
      background: "transparent",
      color: "var(--text-secondary)",
      border: "1px solid transparent",
      fontWeight: "var(--weight-medium)"
    },
    danger: {
      background: "rgba(192, 57, 43, 0.14)",
      color: "var(--cinnabar-400)",
      border: "1px solid rgba(192, 57, 43, 0.4)",
      fontWeight: "var(--weight-medium)"
    }
  };
  const v = variants[variant] || variants.gold;
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled || loading,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      width: full ? "100%" : "auto",
      fontFamily: "var(--font-sans)",
      fontSize: s.font,
      lineHeight: 1,
      letterSpacing: "var(--tracking-wide)",
      borderRadius: "var(--radius-md)",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      whiteSpace: "nowrap",
      transition: "transform var(--dur-fast) var(--ease-out), filter var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)",
      ...v,
      ...style
    },
    onMouseDown: e => {
      if (!disabled && !loading) e.currentTarget.style.transform = "scale(var(--press-scale))";
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = "scale(1)";
    },
    onMouseEnter: e => {
      if (disabled || loading) return;
      if (variant === "gold") {
        e.currentTarget.style.filter = "brightness(1.06)";
        e.currentTarget.style.boxShadow = "var(--glow-gold)";
      } else {
        e.currentTarget.style.filter = "brightness(1.12)";
      }
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = "scale(1)";
      e.currentTarget.style.filter = "none";
      if (variant === "gold") e.currentTarget.style.boxShadow = "var(--shadow-xs)";
    }
  }, rest), loading ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      height: 14,
      borderRadius: "50%",
      border: "2px solid currentColor",
      borderTopColor: "transparent",
      display: "inline-block",
      animation: "lf-spin 0.7s linear infinite"
    }
  }) : icon, children, iconRight, /*#__PURE__*/React.createElement("style", null, `@keyframes lf-spin{to{transform:rotate(360deg)}}`));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card — 炼器台 plate surface. `cut` enables the 切角 corner motif.
 */
function Card({
  children,
  cut = false,
  glow = "none",
  interactive = false,
  padding = 20,
  style = {},
  ...rest
}) {
  const glows = {
    none: "var(--shadow-card)",
    gold: "var(--shadow-card), var(--glow-gold)",
    jade: "var(--shadow-card), var(--glow-jade)"
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: cut ? 0 : "var(--radius-lg)",
      clipPath: cut ? "var(--cut-corner)" : "none",
      boxShadow: glows[glow] || glows.none,
      padding: typeof padding === "number" ? padding + "px" : padding,
      position: "relative",
      transition: "border-color var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
      cursor: interactive ? "pointer" : "default",
      ...style
    },
    onMouseEnter: interactive ? e => {
      e.currentTarget.style.borderColor = "var(--border-default)";
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "var(--shadow-panel), var(--glow-gold)";
    } : undefined,
    onMouseLeave: interactive ? e => {
      e.currentTarget.style.borderColor = "var(--border-subtle)";
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = glows[glow] || glows.none;
    } : undefined
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * IconButton — square icon-only control (toolbar / 工具栏).
 */
function IconButton({
  children,
  size = "md",
  variant = "ghost",
  active = false,
  label,
  style = {},
  ...rest
}) {
  const dims = {
    sm: 32,
    md: 40,
    lg: 48
  }[size] || 40;
  const variants = {
    ghost: {
      background: active ? "rgba(201,163,91,0.14)" : "transparent",
      color: active ? "var(--gold-300)" : "var(--text-secondary)",
      border: "1px solid " + (active ? "var(--border-default)" : "transparent")
    },
    surface: {
      background: "var(--surface-raised)",
      color: "var(--text-secondary)",
      border: "1px solid var(--border-subtle)"
    },
    gold: {
      background: "linear-gradient(135deg, var(--gold-400), var(--gold-600))",
      color: "var(--text-on-gold)",
      border: "1px solid var(--gold-600)"
    }
  };
  const v = variants[variant] || variants.ghost;
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    title: label,
    style: {
      width: dims,
      height: dims,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-md)",
      cursor: "pointer",
      transition: "background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out), transform var(--dur-fast) var(--ease-out)",
      ...v,
      ...style
    },
    onMouseEnter: e => {
      if (variant === "ghost" && !active) {
        e.currentTarget.style.background = "rgba(244,241,232,0.05)";
        e.currentTarget.style.color = "var(--text-primary)";
      }
    },
    onMouseLeave: e => {
      if (variant === "ghost" && !active) {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--text-secondary)";
      }
    },
    onMouseDown: e => {
      e.currentTarget.style.transform = "scale(0.92)";
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = "scale(1)";
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/SpiritStone.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SpiritStone — 灵石 currency display. The glowing gold gem + balance.
 * Drop `onAdd` to show a "+" entry that opens the 看广告领取灵石 flow.
 */
function SpiritStone({
  count = 0,
  size = "md",
  onAdd,
  low = false,
  art = "crystal",
  style = {},
  ...rest
}) {
  const scale = {
    sm: 0.85,
    md: 1,
    lg: 1.2
  }[size] || 1;
  const gem = Math.round(art === "crystal" ? 18 * scale : 14 * scale);
  const base = typeof window !== "undefined" && window.LF_ICON_BASE || "";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: Math.round(8 * scale),
      height: size === "lg" ? "var(--control-h)" : "var(--control-h-sm)",
      padding: `0 ${Math.round(10 * scale)}px`,
      background: low ? "rgba(192,57,43,0.12)" : "var(--surface-raised)",
      border: "1px solid " + (low ? "rgba(192,57,43,0.4)" : "var(--border-default)"),
      borderRadius: "var(--radius-pill)",
      boxShadow: "var(--inset-top)",
      ...style
    }
  }, rest), art === "crystal" ? /*#__PURE__*/React.createElement("img", {
    src: `${base}assets/ui/coin-crystal.png`,
    alt: "",
    "aria-hidden": true,
    draggable: "false",
    style: {
      width: gem,
      height: gem,
      objectFit: "contain",
      flex: "none",
      filter: "drop-shadow(0 0 5px rgba(140,200,240,0.5))"
    }
  }) : /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      width: gem,
      height: gem,
      background: "linear-gradient(135deg, var(--gold-200), var(--gold-400) 50%, var(--gold-600))",
      transform: "rotate(45deg)",
      borderRadius: "2px",
      boxShadow: "var(--glow-spirit)",
      flex: "none"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: `${13 * scale}px`,
      fontWeight: "var(--weight-medium)",
      color: low ? "var(--cinnabar-400)" : "var(--gold-200)",
      lineHeight: 1,
      letterSpacing: "0.02em"
    }
  }, count.toLocaleString("zh-CN")), onAdd && /*#__PURE__*/React.createElement("button", {
    onClick: onAdd,
    "aria-label": "\u9886\u53D6\u7075\u77F3",
    style: {
      marginLeft: 2,
      width: gem + 6,
      height: gem + 6,
      borderRadius: "50%",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--gold-500)",
      color: "var(--text-on-gold)",
      border: "none",
      fontSize: `${14 * scale}px`,
      lineHeight: 1,
      cursor: "pointer",
      fontWeight: "var(--weight-bold)",
      transition: "filter var(--dur-base) var(--ease-out)"
    },
    onMouseEnter: e => e.currentTarget.style.filter = "brightness(1.1)",
    onMouseLeave: e => e.currentTarget.style.filter = "none"
  }, "+"));
}
Object.assign(__ds_scope, { SpiritStone });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SpiritStone.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
/**
 * Dialog — centered modal with ink-fog backdrop and a 切角 plate.
 */
function Dialog({
  open = true,
  onClose,
  title,
  children,
  footer,
  width = 420,
  cut = true,
  style = {}
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "var(--ink-fog)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      animation: "lf-fade var(--dur-base) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width,
      maxWidth: "100%",
      position: "relative",
      background: "var(--surface-card)",
      border: "1px solid var(--border-default)",
      borderRadius: cut ? 0 : "var(--radius-xl)",
      clipPath: cut ? "var(--cut-corner)" : "none",
      boxShadow: "var(--shadow-modal), var(--glow-gold)",
      padding: 28,
      animation: "lf-rise var(--dur-slow) var(--ease-out)",
      ...style
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      background: "var(--gold-400)",
      transform: "rotate(45deg)",
      boxShadow: "var(--glow-spirit)"
    }
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: "var(--font-serif)",
      fontSize: "var(--text-xl)",
      fontWeight: "var(--weight-semibold)",
      color: "var(--text-primary)",
      letterSpacing: "var(--tracking-tight)"
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-secondary)",
      fontSize: "var(--text-base)",
      lineHeight: "var(--leading-normal)"
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      display: "flex",
      gap: 10,
      justifyContent: "flex-end"
    }
  }, footer)), /*#__PURE__*/React.createElement("style", null, `@keyframes lf-fade{from{opacity:0}}@keyframes lf-rise{from{opacity:0;transform:translateY(12px) scale(0.98)}}`));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ProgressBar — generation / ad-watch progress. `tone` recolors the fill.
 */
function ProgressBar({
  value = 0,
  tone = "gold",
  height = 6,
  label = null,
  animated = false,
  style = {},
  ...rest
}) {
  const fills = {
    gold: "linear-gradient(90deg, var(--gold-500), var(--gold-300))",
    jade: "linear-gradient(90deg, var(--jade-500), var(--jade-300))",
    moon: "linear-gradient(90deg, var(--moon-500), var(--moon-300))"
  };
  const pct = Math.max(0, Math.min(100, value));
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      width: "100%",
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "var(--text-xs)",
      color: "var(--text-secondary)"
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      color: "var(--text-muted)"
    }
  }, Math.round(pct), "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      height,
      background: "var(--surface-inset)",
      borderRadius: "var(--radius-pill)",
      overflow: "hidden",
      border: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + "%",
      height: "100%",
      background: fills[tone] || fills.gold,
      borderRadius: "var(--radius-pill)",
      boxShadow: "var(--glow-gold)",
      transition: "width var(--dur-slow) var(--ease-out)",
      backgroundSize: animated ? "200% 100%" : "auto",
      animation: animated ? "lf-flow 1.4s linear infinite" : "none"
    }
  })), /*#__PURE__*/React.createElement("style", null, `@keyframes lf-flow{to{background-position:200% 0}}`));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — single-line text field with optional leading icon / suffix.
 */
function Input({
  icon = null,
  suffix = null,
  size = "md",
  invalid = false,
  style = {},
  wrapStyle = {},
  ...rest
}) {
  const h = {
    sm: "var(--control-h-sm)",
    md: "var(--control-h)",
    lg: "var(--control-h-lg)"
  }[size] || "var(--control-h)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: h,
      padding: "0 12px",
      background: "var(--surface-inset)",
      border: "1px solid " + (invalid ? "rgba(192,57,43,0.5)" : "var(--border-subtle)"),
      borderRadius: "var(--radius-md)",
      transition: "border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
      ...wrapStyle
    },
    onFocusCapture: e => {
      e.currentTarget.style.borderColor = "var(--border-strong)";
      e.currentTarget.style.boxShadow = "var(--ring-focus)";
    },
    onBlurCapture: e => {
      e.currentTarget.style.borderColor = invalid ? "rgba(192,57,43,0.5)" : "var(--border-subtle)";
      e.currentTarget.style.boxShadow = "none";
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)",
      display: "flex",
      flex: "none"
    }
  }, icon), /*#__PURE__*/React.createElement("input", _extends({
    style: {
      flex: 1,
      minWidth: 0,
      height: "100%",
      background: "transparent",
      border: "none",
      outline: "none",
      color: "var(--text-primary)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-base)",
      ...style
    }
  }, rest)), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-xs)",
      flex: "none"
    }
  }, suffix));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/PromptInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * PromptInput — the 创作台 Prompt 输入框. Multi-line, with a send action and helper row.
 */
function PromptInput({
  value,
  onChange,
  placeholder = "用中文描述你想要的素材…",
  onGenerate,
  cost = 1,
  footer = null,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: "var(--surface-inset)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--inset-top)",
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("textarea", {
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    rows: 3,
    className: "lf-scroll",
    style: {
      width: "100%",
      resize: "none",
      background: "transparent",
      border: "none",
      outline: "none",
      color: "var(--text-primary)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-md)",
      lineHeight: "var(--leading-normal)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      color: "var(--text-muted)",
      fontSize: "var(--text-xs)"
    }
  }, footer), /*#__PURE__*/React.createElement("button", {
    onClick: onGenerate,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      height: "var(--control-h)",
      padding: "0 22px",
      background: "linear-gradient(135deg, var(--gold-300), var(--gold-500) 55%, var(--gold-600))",
      color: "var(--text-on-gold)",
      border: "1px solid var(--gold-600)",
      borderRadius: "var(--radius-md)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-base)",
      fontWeight: "var(--weight-semibold)",
      letterSpacing: "var(--tracking-wide)",
      cursor: "pointer",
      transition: "filter var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)"
    },
    onMouseEnter: e => {
      e.currentTarget.style.filter = "brightness(1.06)";
      e.currentTarget.style.boxShadow = "var(--glow-gold)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.filter = "none";
      e.currentTarget.style.boxShadow = "none";
    }
  }, "\u5F00\u59CB\u751F\u6210", /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-xs)",
      opacity: 0.8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      background: "currentColor",
      transform: "rotate(45deg)",
      borderRadius: 1,
      display: "inline-block"
    }
  }), cost))));
}
Object.assign(__ds_scope, { PromptInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/PromptInput.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SegmentedControl — exclusive choice row (视角 / 输出格式 toggles).
 */
function SegmentedControl({
  options = [],
  value,
  onChange,
  size = "md",
  style = {},
  ...rest
}) {
  const h = {
    sm: 30,
    md: 36,
    lg: 42
  }[size] || 36;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "inline-flex",
      padding: 3,
      gap: 2,
      background: "var(--surface-inset)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      ...style
    }
  }, rest), options.map(opt => {
    const val = typeof opt === "string" ? opt : opt.value;
    const label = typeof opt === "string" ? opt : opt.label;
    const active = val === value;
    return /*#__PURE__*/React.createElement("button", {
      key: val,
      onClick: () => onChange && onChange(val),
      style: {
        height: h,
        padding: "0 14px",
        border: "none",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-sm)",
        fontWeight: active ? "var(--weight-medium)" : "var(--weight-regular)",
        color: active ? "var(--text-on-gold)" : "var(--text-secondary)",
        background: active ? "linear-gradient(135deg, var(--gold-400), var(--gold-600))" : "transparent",
        boxShadow: active ? "var(--shadow-xs)" : "none",
        transition: "all var(--dur-fast) var(--ease-out)"
      }
    }, label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Select — native dropdown styled as a 灵机阁 control.
 */
function Select({
  children,
  size = "md",
  style = {},
  wrapStyle = {},
  ...rest
}) {
  const h = {
    sm: "var(--control-h-sm)",
    md: "var(--control-h)",
    lg: "var(--control-h-lg)"
  }[size] || "var(--control-h)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "inline-flex",
      width: "100%",
      ...wrapStyle
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    style: {
      appearance: "none",
      width: "100%",
      height: h,
      padding: "0 34px 0 12px",
      background: "var(--surface-inset)",
      color: "var(--text-primary)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      cursor: "pointer",
      outline: "none",
      transition: "border-color var(--dur-base) var(--ease-out)",
      ...style
    },
    onFocus: e => e.currentTarget.style.borderColor = "var(--border-strong)",
    onBlur: e => e.currentTarget.style.borderColor = "var(--border-subtle)"
  }, rest), children), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      right: 12,
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
      color: "var(--text-muted)",
      fontSize: 10
    }
  }, "\u25BE"));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Switch — toggle (透明背景开关 / 风格锁定 / 批量生成).
 */
function Switch({
  checked = false,
  onChange,
  label,
  disabled = false,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    role: "switch",
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      background: "none",
      border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      padding: 0,
      opacity: disabled ? 0.45 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 22,
      borderRadius: "var(--radius-pill)",
      flex: "none",
      position: "relative",
      background: checked ? "linear-gradient(135deg, var(--gold-400), var(--gold-600))" : "var(--surface-raised)",
      border: "1px solid " + (checked ? "var(--gold-600)" : "var(--border-default)"),
      boxShadow: checked ? "var(--glow-gold)" : "var(--inset-top)",
      transition: "all var(--dur-base) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 2,
      left: checked ? 18 : 2,
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: checked ? "var(--ink-900)" : "var(--text-secondary)",
      transition: "left var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)"
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      color: "var(--text-secondary)"
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tag — selectable chip used across the parameter panel (题材 / 风格 / 视角 / 动作).
 */
function Tag({
  children,
  selected = false,
  icon = null,
  onClick,
  disabled = false,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    onClick: disabled ? undefined : onClick,
    disabled: disabled,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 30,
      padding: "0 12px",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-sm)",
      fontWeight: selected ? "var(--weight-medium)" : "var(--weight-regular)",
      color: selected ? "var(--gold-200)" : "var(--text-secondary)",
      background: selected ? "rgba(201,163,91,0.16)" : "var(--surface-inset)",
      border: "1px solid " + (selected ? "var(--border-strong)" : "var(--border-subtle)"),
      borderRadius: "var(--radius-pill)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      boxShadow: selected ? "var(--glow-gold)" : "none",
      transition: "all var(--dur-base) var(--ease-out)",
      ...style
    },
    onMouseEnter: e => {
      if (!selected && !disabled) {
        e.currentTarget.style.borderColor = "var(--border-default)";
        e.currentTarget.style.color = "var(--text-primary)";
      }
    },
    onMouseLeave: e => {
      if (!selected && !disabled) {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.color = "var(--text-secondary)";
      }
    }
  }, rest), icon, children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Tag.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavItem.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * NavItem — left-rail navigation entry (创作台 asset-type nav / 素材库 sidebar).
 */
function NavItem({
  children,
  icon = null,
  active = false,
  count = null,
  onClick,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    onClick: onClick,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      width: "100%",
      height: 42,
      padding: "0 12px",
      textAlign: "left",
      background: active ? "linear-gradient(90deg, rgba(201,163,91,0.16), rgba(201,163,91,0.02))" : "transparent",
      border: "1px solid " + (active ? "var(--border-default)" : "transparent"),
      borderRadius: "var(--radius-md)",
      cursor: "pointer",
      position: "relative",
      color: active ? "var(--gold-200)" : "var(--text-secondary)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-base)",
      fontWeight: active ? "var(--weight-medium)" : "var(--weight-regular)",
      transition: "all var(--dur-base) var(--ease-out)",
      ...style
    },
    onMouseEnter: e => {
      if (!active) {
        e.currentTarget.style.background = "rgba(244,241,232,0.04)";
        e.currentTarget.style.color = "var(--text-primary)";
      }
    },
    onMouseLeave: e => {
      if (!active) {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--text-secondary)";
      }
    }
  }, rest), active && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: -1,
      top: 11,
      bottom: 11,
      width: 2.5,
      background: "var(--gold-400)",
      borderRadius: 2,
      boxShadow: "var(--glow-gold)"
    }
  }), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      flex: "none",
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center"
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, children), count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-xs)",
      color: "var(--text-muted)"
    }
  }, count));
}
Object.assign(__ds_scope, { NavItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavItem.jsx", error: String((e && e.message) || e) }); }

// ui_kits/landing/Capabilities.jsx
try { (() => {
/* Landing — Capabilities (asset types) + HowItWorks */
function Capabilities() {
  const {
    SectionHead,
    AssetTile
  } = window;
  const {
    Card,
    OrbIcon
  } = window.LingjiForgeDesignSystem_e6d384;
  const items = [["角色", "meditation", "主角、配角、立绘"], ["怪物 / NPC", "beast", "敌人、村民、Boss"], ["道具 / 装备", "gem", "武器、护甲、消耗品"], ["技能特效", "portal", "序列帧、粒子、光效"], ["地图 / Tileset", "mountain", "地形、地牢、场景拼块"], ["建筑 / 场景", "pagoda", "城镇、关卡、背景"], ["UI 组件", "starchart", "按钮、面板、HUD"], ["图标", "talisman", "技能、物品、状态"], ["头像", "taiji", "用户、角色头像"], ["动画", "crane", "4方向 / 8方向行走"]];
  return /*#__PURE__*/React.createElement("section", {
    className: "lf-bg-deep",
    style: {
      padding: "88px 40px",
      borderTop: "1px solid var(--border-subtle)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1180,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    kicker: "\u8D44\u4EA7\u7C7B\u578B",
    title: "\u4ECE\u4E00\u4E2A\u89D2\u8272\uFF0C\u5230\u6574\u5957\u6E38\u620F\u7D20\u6750",
    sub: "\u8986\u76D6\u6E38\u620F\u5F00\u53D1\u6240\u9700\u7684\u5168\u90E8\u8D44\u4EA7\u7C7B\u578B\uFF0C\u6309\u9700\u751F\u6210\uFF0C\u76F4\u63A5\u53EF\u7528\u3002"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(5,1fr)",
      gap: 14,
      marginTop: 44
    }
  }, items.map(([t, ic, d]) => /*#__PURE__*/React.createElement(Card, {
    key: t,
    interactive: true,
    padding: 18,
    style: {
      background: "var(--surface-card)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(OrbIcon, {
    name: ic,
    size: 54
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-serif)",
      fontWeight: 600,
      fontSize: 17,
      color: "var(--text-primary)"
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      color: "var(--text-muted)",
      marginTop: 5
    }
  }, d))))));
}
function HowItWorks() {
  const {
    SectionHead
  } = window;
  const steps = [["输入中文描述", "type", "用自然语言说出你要的素材，无需懂提示词。"], ["设定题材与参数", "sliders-horizontal", "选择题材、风格、视角、尺寸、用途与输出格式。"], ["开始生成 · 推演", "wand-sparkles", "多张候选结果、动画预览与 Sprite Sheet 即时呈现。"], ["导出可用素材", "download", "透明 PNG、GIF、Sprite Sheet、JSON，直接进引擎。"]];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: "88px 40px",
      background: "var(--bg-base)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1180,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    kicker: "\u5982\u4F55\u9020\u7269",
    title: "\u56DB\u6B65\uFF0C\u4ECE\u4E00\u5FF5\u5230\u6210\u56FE"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 18,
      marginTop: 44
    }
  }, steps.map(([t, ic, d], i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      position: "relative",
      padding: "26px 22px",
      borderRadius: "var(--radius-lg)",
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 18,
      right: 20,
      fontFamily: "var(--font-serif)",
      fontWeight: 900,
      fontSize: 40,
      color: "rgba(201,163,91,0.14)"
    }
  }, i + 1), /*#__PURE__*/React.createElement("i", {
    "data-lucide": ic,
    style: {
      width: 26,
      height: 26,
      color: "var(--gold-300)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-serif)",
      fontWeight: 600,
      fontSize: 18,
      color: "var(--text-primary)",
      marginTop: 16
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      lineHeight: 1.7,
      color: "var(--text-secondary)",
      marginTop: 8
    }
  }, d))))));
}
Object.assign(window, {
  Capabilities,
  HowItWorks
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/landing/Capabilities.jsx", error: String((e && e.message) || e) }); }

// ui_kits/landing/GenreShowcase.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Landing — GenreShowcase: the critical "万象/不止仙侠" diversity gallery */
function GenreShowcase() {
  const {
    SectionHead,
    AssetTile
  } = window;
  const tiles = [{
    genre: "仙侠剑修",
    sub: "御剑·青金光效",
    icon: "sword",
    from: "#2f6e64",
    to: "#0e211f",
    glow: "rgba(201,163,91,0.7)",
    tags: ["国风", "厚涂"],
    size: "128×128"
  }, {
    genre: "西幻法师",
    sub: "奥术·法杖",
    icon: "wand-sparkles",
    from: "#5b4b9c",
    to: "#181333",
    glow: "rgba(150,130,230,0.8)",
    tags: ["西幻", "插画"],
    size: "128×128"
  }, {
    genre: "科幻机甲",
    sub: "重装·能量核心",
    icon: "bot",
    from: "#3f6e8f",
    to: "#0f1d28",
    glow: "rgba(120,180,230,0.8)",
    tags: ["科幻", "低多边形"],
    size: "256×256"
  }, {
    genre: "赛博朋克敌人",
    sub: "义体·霓虹",
    icon: "skull",
    from: "#a8327f",
    to: "#1a0f24",
    glow: "rgba(255,80,200,0.8)",
    tags: ["赛博朋克", "暗黑"],
    size: "128×128"
  }, {
    genre: "Q版农场 NPC",
    sub: "村民·萌系",
    icon: "sprout",
    from: "#5a9a4e",
    to: "#1d2e16",
    glow: "rgba(180,230,140,0.8)",
    tags: ["Q版", "卡通"],
    size: "64×64"
  }, {
    genre: "像素地牢地图",
    sub: "石室·火把",
    icon: "map",
    from: "#7a6a4a",
    to: "#211a12",
    glow: "rgba(230,170,90,0.8)",
    tags: ["像素", "Tileset"],
    size: "32×32"
  }, {
    genre: "现代都市 UI",
    sub: "HUD·按钮组",
    icon: "layout-panel-top",
    from: "#3a5a78",
    to: "#101a24",
    glow: "rgba(140,176,204,0.8)",
    tags: ["现代", "扁平"],
    size: "矢量"
  }, {
    genre: "怪物 Boss",
    sub: "巨兽·多形态",
    icon: "ghost",
    from: "#8f3a3a",
    to: "#220f0f",
    glow: "rgba(230,90,90,0.8)",
    tags: ["暗黑", "厚涂"],
    size: "512×512"
  }, {
    genre: "武器装备",
    sub: "刀剑·铠甲",
    icon: "shield",
    from: "#9c7a36",
    to: "#241a0c",
    glow: "rgba(218,185,120,0.85)",
    tags: ["道具", "图标"],
    size: "128×128"
  }, {
    genre: "技能特效",
    sub: "雷火·灵气",
    icon: "sparkles",
    from: "#3f7e9c",
    to: "#0f1f28",
    glow: "rgba(150,210,240,0.85)",
    tags: ["特效", "序列帧"],
    size: "GIF"
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: "88px 40px",
      background: "var(--bg-base)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1180,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    kicker: "\u4E07\u8C61 \xB7 \u4E0D\u6B62\u4ED9\u4FA0",
    title: "\u4E00\u4E2A\u5E73\u53F0\uFF0C\u751F\u6210\u6240\u6709\u9898\u6750",
    sub: "\u4ED9\u4FA0\u3001\u6B66\u4FA0\u3001\u897F\u5E7B\u3001\u79D1\u5E7B\u3001\u8D5B\u535A\u670B\u514B\u3001\u73B0\u4EE3\u90FD\u5E02\u3001\u672B\u65E5\u751F\u5B58\u3001Q\u7248\u3001\u4E8C\u6B21\u5143\u3001\u50CF\u7D20\u2026\u2026\u754C\u9762\u662F\u56FD\u98CE\u70BC\u5668\u9601\uFF0C\u5185\u5BB9\u80FD\u529B\u5305\u7F57\u4E07\u8C61\u3002"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: 16,
      marginTop: 44
    }
  }, tiles.map(t => /*#__PURE__*/React.createElement(AssetTile, _extends({
    key: t.genre
  }, t)))), /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: "center",
      marginTop: 26,
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: "var(--text-muted)"
    }
  }, "\u4EE5\u4E0A\u4E3A\u9898\u6750\u793A\u610F\u9884\u89C8 \xB7 \u5B9E\u9645\u751F\u6210\u5185\u5BB9\u7531\u4F60\u7684\u4E2D\u6587\u63CF\u8FF0\u51B3\u5B9A")));
}
Object.assign(window, {
  GenreShowcase
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/landing/GenreShowcase.jsx", error: String((e && e.message) || e) }); }

// ui_kits/landing/Hero.jsx
try { (() => {
/* Landing — Hero */
function Hero() {
  const {
    Button,
    Badge,
    OrnateButton
  } = window.LingjiForgeDesignSystem_e6d384;
  return /*#__PURE__*/React.createElement("section", {
    className: "lf-bg-deep",
    style: {
      position: "relative",
      overflow: "hidden",
      padding: "84px 40px 72px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lf-bg-array",
    style: {
      position: "absolute",
      inset: 0,
      zIndex: 0,
      opacity: 0.5
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-emblem-transparent.png",
    alt: "",
    "aria-hidden": true,
    style: {
      position: "absolute",
      right: -120,
      top: 40,
      width: 620,
      opacity: 0.10,
      pointerEvents: "none",
      filter: "blur(1px)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 2,
      maxWidth: 1180,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "1.1fr 0.9fr",
      gap: 56,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 14px",
      borderRadius: "var(--radius-pill)",
      background: "rgba(201,163,91,0.1)",
      border: "1px solid var(--border-default)",
      marginBottom: 26
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      background: "var(--gold-400)",
      transform: "rotate(45deg)",
      boxShadow: "var(--glow-spirit)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: "var(--gold-200)"
    }
  }, "\u4E07\u8C61\u6E38\u620F\u7D20\u6750\u751F\u6210\u5E73\u53F0 \xB7 \u4E0D\u6B62\u4ED9\u4FA0")), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-serif)",
      fontWeight: 900,
      fontSize: 68,
      lineHeight: 1.12,
      margin: 0,
      color: "var(--text-primary)",
      letterSpacing: "0.01em"
    }
  }, "\u4E00\u5FF5\u6210\u56FE", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    className: "lf-gold-text"
  }, "\u4E07\u8C61\u7686\u53EF\u751F\u6210")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 18,
      lineHeight: 1.75,
      color: "var(--text-secondary)",
      margin: "26px 0 0",
      maxWidth: 520
    }
  }, "\u89D2\u8272\u3001\u602A\u7269\u3001\u5730\u56FE\u3001\u9053\u5177\u3001\u6280\u80FD\u7279\u6548\u3001UI \u7EC4\u4EF6\u2026\u2026\u8F93\u5165\u4E2D\u6587\u63CF\u8FF0\uFF0C\u5373\u53EF\u751F\u6210\u9002\u7528\u4E8E\u591A\u79CD\u6E38\u620F\u9898\u6750\u7684\u53EF\u7528\u7D20\u6750\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      marginTop: 34,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(OrnateButton, {
    size: "lg",
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "wand-sparkles",
      style: {
        width: 18,
        height: 18
      }
    })
  }, "\u5F00\u59CB\u751F\u6210"), /*#__PURE__*/React.createElement(Button, {
    variant: "jade",
    size: "lg",
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "clapperboard",
      style: {
        width: 18,
        height: 18
      }
    })
  }, "\u770B\u5E7F\u544A\u9886\u53D6\u7075\u77F3")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 22,
      marginTop: 30,
      flexWrap: "wrap"
    }
  }, [["透明 PNG", "image"], ["GIF 动画", "film"], ["Sprite Sheet", "layout-grid"], ["JSON Metadata", "braces"]].map(([t, ic]) => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": ic,
    style: {
      width: 14,
      height: 14,
      color: "var(--jade-300)"
    }
  }), t)))), /*#__PURE__*/React.createElement("div", {
    className: "lf-plate",
    style: {
      borderRadius: "var(--radius-xl)",
      padding: 22,
      boxShadow: "var(--shadow-panel), var(--glow-gold)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "terminal",
    style: {
      width: 15,
      height: 15,
      color: "var(--gold-300)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12,
      color: "var(--text-muted)"
    }
  }, "Prompt \u793A\u4F8B"), /*#__PURE__*/React.createElement(Badge, {
    tone: "jade",
    style: {
      marginLeft: "auto"
    }
  }, "\u4FEF\u89C6\u89D2 RPG")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 15,
      lineHeight: 1.8,
      color: "var(--text-primary)",
      margin: 0
    }
  }, "\u751F\u6210\u4E00\u4E2A\u9002\u5408\u4FEF\u89C6\u89D2 RPG \u7684\u4E3B\u89D2\u89D2\u8272\uFF0C", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--gold-200)"
    }
  }, "\u56FD\u98CE\u50CF\u7D20\u98CE"), "\uFF0C", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--gold-200)"
    }
  }, "8\u65B9\u5411\u884C\u8D70\u52A8\u753B"), "\uFF0C\u900F\u660E\u80CC\u666F\uFF0C\u53EF\u5BFC\u51FA Sprite Sheet\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--divider)",
      margin: "18px 0"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 8
    }
  }, ["sword", "wand-sparkles", "bot", "ghost"].map((ic, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      aspectRatio: "1",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-subtle)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: ["radial-gradient(circle at 50% 35%, #2f6e64, #0e211f)", "radial-gradient(circle at 50% 35%, #5b4b9c, #1a1733)", "radial-gradient(circle at 50% 35%, #3f6e8f, #11212e)", "radial-gradient(circle at 50% 35%, #8f3a3a, #2a1212)"][i]
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": ic,
    style: {
      width: 22,
      height: 22,
      color: "rgba(255,255,255,0.9)"
    }
  })))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      color: "var(--text-muted)",
      margin: "12px 0 0",
      textAlign: "center"
    }
  }, "4 \u5F20\u5019\u9009 \xB7 1 \u7075\u77F3/\u5F20 \xB7 \u53EF\u91CD\u65B0\u63A8\u6F14"))));
}
Object.assign(window, {
  Hero
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/landing/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/landing/Sections.jsx
try { (() => {
/* Landing — SpiritModel (灵石/广告激励) + PricingTeaser + Footer */
function SpiritModel() {
  const {
    SectionHead
  } = window;
  const {
    Button,
    SpiritStone
  } = window.LingjiForgeDesignSystem_e6d384;
  const costs = [["普通素材生成", 1], ["高清导出", 3], ["4方向角色", 4], ["8方向角色", 6], ["动画 Sprite Sheet", 8], ["批量生成", 10], ["风格锁定", 15]];
  return /*#__PURE__*/React.createElement("section", {
    className: "lf-bg-deep",
    style: {
      padding: "88px 40px",
      borderTop: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1180,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 48,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    align: "left",
    kicker: "\u7075\u77F3 \xB7 \u6FC0\u52B1\u6A21\u5F0F",
    title: "\u770B\u5E7F\u544A\u9886\u53D6\u7075\u77F3\uFF0C\u81EA\u7531\u9020\u7269",
    sub: "\u7075\u77F3\u662F\u751F\u6210\u989D\u5EA6\u3002\u770B\u4E00\u6761\u5E7F\u544A\u5373\u53EF\u9886\u53D6\uFF0C\u7EDD\u4E0D\u5F3A\u5236\u5F39\u7A97\u3002\u4E5F\u53EF\u8BA2\u9605\u4F1A\u5458\uFF0C\u4EAB\u514D\u5E7F\u544A\u4E0E\u6BCF\u65E5\u7075\u77F3\u3002"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      marginTop: 28,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    size: "lg",
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "clapperboard",
      style: {
        width: 18,
        height: 18
      }
    })
  }, "\u770B\u5E7F\u544A\u9886\u53D6\u7075\u77F3"), /*#__PURE__*/React.createElement(SpiritStone, {
    count: 128,
    size: "lg"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "lf-plate",
    style: {
      borderRadius: "var(--radius-xl)",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      letterSpacing: "var(--tracking-wide)",
      color: "var(--text-muted)",
      marginBottom: 14
    }
  }, "\u7075\u77F3\u6D88\u8017\u89C4\u5219"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, costs.map(([t, c]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 0",
      borderBottom: "1px solid var(--divider)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      color: "var(--text-secondary)"
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontFamily: "var(--font-mono)",
      fontSize: 14,
      color: "var(--gold-200)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      background: "linear-gradient(135deg,var(--gold-300),var(--gold-600))",
      transform: "rotate(45deg)",
      borderRadius: 1,
      boxShadow: "var(--glow-spirit)"
    }
  }), c)))))));
}
function PricingTeaser() {
  const {
    SectionHead
  } = window;
  const {
    Button,
    Badge
  } = window.LingjiForgeDesignSystem_e6d384;
  const plans = [{
    name: "免费版",
    price: "¥0",
    tag: null,
    feats: ["看广告获得灵石", "基础生成", "普通队列"],
    variant: "outline"
  }, {
    name: "月卡版",
    price: "¥28",
    tag: "热门",
    feats: ["免广告", "每日灵石", "快速队列", "高清导出"],
    variant: "gold",
    hot: true
  }, {
    name: "团队版",
    price: "¥98",
    tag: null,
    feats: ["商用授权", "团队素材库", "批量生成", "项目管理"],
    variant: "outline"
  }, {
    name: "企业版",
    price: "面议",
    tag: null,
    feats: ["私有模型", "API 接入", "IP 风格锁定", "专属算力"],
    variant: "outline"
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: "88px 40px",
      background: "var(--bg-base)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1180,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    kicker: "\u4F1A\u5458\u4F53\u7CFB",
    title: "\u6309\u9700\u9009\u62E9\uFF0C\u4ECE\u4E2A\u4EBA\u5230\u4F01\u4E1A"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 16,
      marginTop: 44
    }
  }, plans.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.name,
    style: {
      position: "relative",
      padding: 24,
      borderRadius: "var(--radius-lg)",
      background: p.hot ? "linear-gradient(180deg, rgba(201,163,91,0.10), var(--surface-card))" : "var(--surface-card)",
      border: "1px solid " + (p.hot ? "var(--border-strong)" : "var(--border-subtle)"),
      boxShadow: p.hot ? "var(--glow-gold)" : "none"
    }
  }, p.tag && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 16,
      right: 16
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "gold",
    solid: true
  }, p.tag)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-serif)",
      fontWeight: 600,
      fontSize: 20,
      color: "var(--text-primary)"
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 4,
      margin: "14px 0 18px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-serif)",
      fontWeight: 900,
      fontSize: 34,
      color: p.hot ? "var(--gold-200)" : "var(--text-primary)"
    }
  }, p.price), p.price !== "面议" && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: "var(--text-muted)"
    }
  }, "/\u6708")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      marginBottom: 22
    }
  }, p.feats.map(f => /*#__PURE__*/React.createElement("div", {
    key: f,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: "var(--text-secondary)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check",
    style: {
      width: 15,
      height: 15,
      color: "var(--jade-300)",
      flex: "none"
    }
  }), f))), /*#__PURE__*/React.createElement(Button, {
    variant: p.variant,
    full: true
  }, p.price === "面议" ? "联系我们" : "选择"))))));
}
function Footer() {
  const cols = [["产品", ["万象生成", "万象模板", "我的素材库", "定价"]], ["资源", ["新手引导", "导出格式", "引擎集成", "API 文档"]], ["关于", ["关于灵机阁", "商用授权", "联系我们", "加入我们"]]];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--bg-deep)",
      borderTop: "1px solid var(--border-subtle)",
      padding: "56px 40px 36px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1180,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-emblem-transparent.png",
    alt: "",
    style: {
      width: 32,
      height: 32,
      objectFit: "contain"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-serif)",
      fontWeight: 800,
      fontSize: 20,
      color: "var(--text-primary)",
      letterSpacing: "0.04em"
    }
  }, "\u7075\u673A\u9601")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      lineHeight: 1.7,
      color: "var(--text-muted)",
      marginTop: 14,
      maxWidth: 260
    }
  }, "\u9762\u5411\u4E2D\u56FD\u521B\u4F5C\u8005\u7684 AI \u6E38\u620F\u7D20\u6750\u751F\u6210\u5E73\u53F0\u3002\u4E00\u5FF5\u6210\u56FE\uFF0C\u4E07\u8C61\u7686\u53EF\u751F\u6210\u3002")), cols.map(([h, items]) => /*#__PURE__*/React.createElement("div", {
    key: h
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-primary)",
      marginBottom: 14
    }
  }, h), items.map(it => /*#__PURE__*/React.createElement("a", {
    key: it,
    href: "#",
    style: {
      display: "block",
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: "var(--text-muted)",
      textDecoration: "none",
      marginBottom: 10
    }
  }, it))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1180,
      margin: "36px auto 0",
      paddingTop: 20,
      borderTop: "1px solid var(--divider)",
      display: "flex",
      justifyContent: "space-between",
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      color: "var(--text-faint)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 \u7075\u673A\u9601 Lingji Forge"), /*#__PURE__*/React.createElement("span", null, "\u4EACICP\u5907 0000000 \u53F7 \xB7 \u5185\u5BB9\u7531 AI \u751F\u6210\uFF0C\u8BF7\u9075\u5B88\u76F8\u5173\u6CD5\u89C4")));
}
Object.assign(window, {
  SpiritModel,
  PricingTeaser,
  Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/landing/Sections.jsx", error: String((e && e.message) || e) }); }

// ui_kits/landing/Shared.jsx
try { (() => {
/* Landing — shared bits: icon helper, decorative emblem, section heading, AssetTile.
 * Exported to window for sibling babel scripts. */

const LFIcon = ({
  name,
  size = 18,
  color,
  style = {}
}) => React.createElement("i", {
  "data-lucide": name,
  style: {
    width: size,
    height: size,
    color,
    ...style
  }
});
function SectionHead({
  kicker,
  title,
  sub,
  align = "center"
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: align,
      maxWidth: 720,
      margin: align === "center" ? "0 auto" : 0
    }
  }, kicker && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      background: "var(--gold-400)",
      transform: "rotate(45deg)",
      boxShadow: "var(--glow-spirit)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      letterSpacing: "var(--tracking-wider)",
      color: "var(--gold-300)",
      textTransform: "uppercase"
    }
  }, kicker)), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-serif)",
      fontWeight: 700,
      fontSize: 40,
      lineHeight: 1.2,
      color: "var(--text-primary)",
      margin: 0,
      letterSpacing: "var(--tracking-tight)"
    }
  }, title), sub && /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 16,
      lineHeight: 1.7,
      color: "var(--text-secondary)",
      margin: "16px auto 0",
      maxWidth: 640
    }
  }, sub));
}

/* AssetTile — a representative game-asset card. No real imagery available;
 * theme is conveyed by color + icon + labels (clearly a placeholder preview). */
function AssetTile({
  genre,
  sub,
  icon,
  from,
  to,
  glow,
  tags = [],
  size,
  large = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      border: "1px solid var(--border-subtle)",
      background: "var(--surface-card)",
      aspectRatio: large ? "16 / 10" : "3 / 4",
      minHeight: large ? 220 : 0,
      cursor: "pointer",
      transition: "transform var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)"
    },
    onMouseEnter: e => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.borderColor = "var(--border-default)";
      e.currentTarget.style.boxShadow = "var(--shadow-panel)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.borderColor = "var(--border-subtle)";
      e.currentTarget.style.boxShadow = "none";
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: `radial-gradient(120% 90% at 50% 18%, ${from}, ${to} 70%)`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "repeating-radial-gradient(circle at 50% 35%, transparent 0 26px, rgba(255,255,255,0.03) 26px 27px)",
      opacity: 0.5
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "30%",
      left: "50%",
      transform: "translate(-50%,-50%)",
      color: "rgba(255,255,255,0.92)",
      filter: `drop-shadow(0 0 18px ${glow})`
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": icon,
    style: {
      width: large ? 64 : 46,
      height: large ? 64 : 46
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      padding: large ? 18 : 13,
      background: "linear-gradient(to top, rgba(7,9,11,0.92), rgba(7,9,11,0.55) 60%, transparent)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-serif)",
      fontWeight: 600,
      fontSize: large ? 20 : 15,
      color: "#fff",
      letterSpacing: "var(--tracking-tight)"
    }
  }, genre), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: large ? 13 : 11,
      color: "rgba(244,241,232,0.7)",
      marginTop: 3
    }
  }, sub), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 5,
      marginTop: 9
    }
  }, tags.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 10,
      color: "var(--gold-200)",
      background: "rgba(201,163,91,0.16)",
      border: "1px solid rgba(201,163,91,0.3)",
      borderRadius: "var(--radius-sm)",
      padding: "2px 7px"
    }
  }, t)), size && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: "rgba(244,241,232,0.55)",
      padding: "2px 0",
      marginLeft: "auto"
    }
  }, size))));
}
Object.assign(window, {
  LFIcon,
  SectionHead,
  AssetTile
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/landing/Shared.jsx", error: String((e && e.message) || e) }); }

// ui_kits/landing/TopNav.jsx
try { (() => {
/* Landing — TopNav */
function TopNav() {
  const {
    Button,
    SpiritStone
  } = window.LingjiForgeDesignSystem_e6d384;
  const links = ["万象生成", "万象模板", "定价", "开发者"];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 50,
      height: "var(--topbar-h)",
      display: "flex",
      alignItems: "center",
      gap: 28,
      padding: "0 40px",
      background: "rgba(11,15,18,0.78)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-emblem-transparent.png",
    alt: "\u7075\u673A\u9601",
    style: {
      width: 36,
      height: 36,
      objectFit: "contain",
      filter: "drop-shadow(0 0 10px rgba(201,163,91,0.3))"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-serif)",
      fontWeight: 800,
      fontSize: 22,
      color: "var(--text-primary)",
      letterSpacing: "0.04em"
    }
  }, "\u7075\u673A\u9601")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: 4,
      marginLeft: 12
    }
  }, links.map((l, i) => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      padding: "8px 14px",
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      color: i === 0 ? "var(--gold-200)" : "var(--text-secondary)",
      textDecoration: "none",
      borderRadius: "var(--radius-md)",
      transition: "color var(--dur-base)"
    },
    onMouseEnter: e => e.currentTarget.style.color = "var(--text-primary)",
    onMouseLeave: e => e.currentTarget.style.color = i === 0 ? "var(--gold-200)" : "var(--text-secondary)"
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(SpiritStone, {
    count: 128,
    onAdd: () => {}
  }), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      color: "var(--text-secondary)",
      textDecoration: "none"
    }
  }, "\u767B\u5F55"), /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    size: "sm",
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "sparkles",
      style: {
        width: 15,
        height: 15
      }
    })
  }, "\u5F00\u59CB\u751F\u6210")));
}
Object.assign(window, {
  TopNav
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/landing/TopNav.jsx", error: String((e && e.message) || e) }); }

// ui_kits/studio/AdModal.jsx
try { (() => {
/* Studio — Ad reward modal (广告激励弹窗). States: prompt → playing → done */
function AdRewardModal({
  open,
  onClose,
  onReward,
  insufficient = false,
  remaining = 3
}) {
  const {
    Button,
    RewardBurst
  } = window.LingjiForgeDesignSystem_e6d384;
  const [stage, setStage] = React.useState("prompt");
  const [pct, setPct] = React.useState(0);
  React.useEffect(() => {
    if (open) {
      setStage("prompt");
      setPct(0);
    }
  }, [open]);
  React.useEffect(() => {
    if (stage !== "playing") return;
    const id = setInterval(() => setPct(p => {
      if (p >= 100) {
        clearInterval(id);
        setStage("done");
        if (onReward) onReward(5);
        return 100;
      }
      return p + 4;
    }), 70);
    return () => clearInterval(id);
  }, [stage]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "var(--ink-fog)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      animation: "lf-fade var(--dur-base) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: 400,
      maxWidth: "100%",
      background: "var(--surface-card)",
      border: "1px solid var(--border-default)",
      clipPath: "var(--cut-corner)",
      boxShadow: "var(--shadow-modal), var(--glow-gold)",
      padding: 28,
      animation: "lf-rise var(--dur-slow) var(--ease-out)"
    }
  }, stage === "prompt" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      background: "var(--gold-400)",
      transform: "rotate(45deg)",
      boxShadow: "var(--glow-spirit)"
    }
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: "var(--font-serif)",
      fontWeight: 600,
      fontSize: 22,
      color: "var(--text-primary)"
    }
  }, insufficient ? "灵石不足" : "看广告领取灵石")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: "var(--font-sans)",
      fontSize: 15,
      lineHeight: 1.7,
      color: "var(--text-secondary)"
    }
  }, insufficient ? /*#__PURE__*/React.createElement(React.Fragment, null, "\u5F53\u524D\u7075\u77F3\u4E0D\u8DB3\u4EE5\u5B8C\u6210\u672C\u6B21\u751F\u6210\u3002\u5B8C\u6574\u89C2\u770B\u4E00\u6761\u5E7F\u544A\uFF0C\u53EF\u83B7\u5F97 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--gold-300)"
    }
  }, "5 \u7075\u77F3"), " \u7EE7\u7EED\u9020\u7269\u3002") : /*#__PURE__*/React.createElement(React.Fragment, null, "\u5B8C\u6574\u89C2\u770B\u4E00\u6761\u5E7F\u544A\uFF0C\u53EF\u83B7\u5F97 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--gold-300)"
    }
  }, "5 \u7075\u77F3"), "\uFF0C\u7528\u4E8E\u7D20\u6750\u751F\u6210\u3001\u52A8\u753B\u751F\u6210\u548C\u9AD8\u6E05\u5BFC\u51FA\u3002")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      justifyContent: "flex-end",
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: onClose
  }, "\u6682\u4E0D\u9886\u53D6"), /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "clapperboard",
      style: {
        width: 16,
        height: 16
      }
    }),
    onClick: () => setStage("playing")
  }, "\u89C2\u770B\u5E7F\u544A"))), stage === "playing" && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "8px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 132,
      borderRadius: "var(--radius-md)",
      background: "linear-gradient(135deg, var(--ink-850), var(--ink-700))",
      border: "1px solid var(--border-subtle)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "play",
    style: {
      width: 36,
      height: 36,
      color: "var(--text-muted)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 8,
      right: 10,
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "var(--text-muted)"
    }
  }, "\u5E7F\u544A ", Math.ceil((100 - pct) * 0.15), "s")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      height: 6,
      background: "var(--surface-inset)",
      borderRadius: 999,
      overflow: "hidden",
      border: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + "%",
      height: "100%",
      background: "linear-gradient(90deg,var(--gold-500),var(--gold-300))",
      boxShadow: "var(--glow-gold)",
      transition: "width 70ms linear"
    }
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: "var(--text-muted)",
      marginTop: 14
    }
  }, "\u5E7F\u544A\u64AD\u653E\u4E2D\uFF0C\u5B8C\u6574\u89C2\u770B\u53EF\u9886\u53D6\u7075\u77F3\u2026")), stage === "done" && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "4px 0"
    }
  }, /*#__PURE__*/React.createElement(RewardBurst, {
    size: 128,
    style: {
      margin: "0 auto 8px",
      display: "block"
    }
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: "var(--font-serif)",
      fontWeight: 700,
      fontSize: 26,
      color: "var(--gold-200)"
    }
  }, "\u7075\u77F3 +5"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      color: "var(--text-secondary)",
      marginTop: 8
    }
  }, "\u4ECA\u65E5\u8FD8\u53EF\u9886\u53D6 ", remaining, " \u6B21"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    full: true,
    onClick: onClose
  }, "\u7EE7\u7EED\u9020\u7269")))), /*#__PURE__*/React.createElement("style", null, `@keyframes lf-fade{from{opacity:0}}@keyframes lf-rise{from{opacity:0;transform:translateY(12px) scale(0.98)}}`));
}
Object.assign(window, {
  AdRewardModal
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/studio/AdModal.jsx", error: String((e && e.message) || e) }); }

// ui_kits/studio/ParamPanel.jsx
try { (() => {
/* Studio — right parameter panel */
function ParamPanel({
  params,
  setParam,
  cost,
  spirit,
  onGenerate,
  generating
}) {
  const {
    Tag,
    SegmentedControl,
    Switch,
    Select,
    Button
  } = window.LingjiForgeDesignSystem_e6d384;
  const Group = ({
    label,
    children
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 16,
      marginBottom: 16,
      borderBottom: "1px solid var(--divider)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      fontWeight: 600,
      color: "var(--text-secondary)",
      marginBottom: 11
    }
  }, label), children);
  const chips = (key, opts) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 7
    }
  }, opts.map(o => /*#__PURE__*/React.createElement(Tag, {
    key: o,
    selected: params[key] === o,
    onClick: () => setParam(key, o)
  }, o)));
  return /*#__PURE__*/React.createElement("aside", {
    className: "lf-scroll",
    style: {
      width: "var(--studio-param-w)",
      flex: "none",
      borderLeft: "1px solid var(--border-subtle)",
      background: "var(--bg-base)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lf-scroll",
    style: {
      flex: 1,
      overflowY: "auto",
      padding: 18
    }
  }, /*#__PURE__*/React.createElement(Group, {
    label: "\u9898\u6750"
  }, chips("genre", ["仙侠", "武侠", "西幻", "科幻", "赛博朋克", "现代", "末日", "生存", "卡通", "Q版", "像素", "二次元"])), /*#__PURE__*/React.createElement(Group, {
    label: "\u98CE\u683C"
  }, chips("style", ["像素风", "扁平插画", "厚涂", "Q版", "暗黑", "国风", "水墨", "未来科技", "低多边形"])), /*#__PURE__*/React.createElement(Group, {
    label: "\u89C6\u89D2"
  }, chips("view", ["正面", "侧面", "背面", "俯视角", "横版", "4方向", "8方向"])), /*#__PURE__*/React.createElement(Group, {
    label: "\u52A8\u4F5C"
  }, chips("action", ["待机", "行走", "攻击", "施法", "跳跃", "受击", "死亡"])), /*#__PURE__*/React.createElement(Group, {
    label: "\u5C3A\u5BF8"
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    size: "sm",
    options: ["32x32", "48x48", "64x64", "128x128"],
    value: params.size,
    onChange: v => setParam("size", v)
  })), /*#__PURE__*/React.createElement(Group, {
    label: "\u7528\u9014"
  }, /*#__PURE__*/React.createElement(Select, {
    value: params.usage,
    onChange: e => setParam("usage", e.target.value)
  }, /*#__PURE__*/React.createElement("option", null, "\u5FAE\u4FE1\u5C0F\u6E38\u620F"), /*#__PURE__*/React.createElement("option", null, "\u6296\u97F3\u5C0F\u6E38\u620F"), /*#__PURE__*/React.createElement("option", null, "Cocos Creator"), /*#__PURE__*/React.createElement("option", null, "Unity"), /*#__PURE__*/React.createElement("option", null, "Godot"), /*#__PURE__*/React.createElement("option", null, "RPG Maker"))), /*#__PURE__*/React.createElement(Group, {
    label: "\u8F93\u51FA\u683C\u5F0F"
  }, chips("format", ["PNG", "GIF", "Sprite Sheet", "JSON Metadata"])), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: "var(--text-secondary)"
    }
  }, "\u98CE\u683C\u9501\u5B9A"), /*#__PURE__*/React.createElement(Switch, {
    checked: params.lock,
    onChange: v => setParam("lock", v)
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: "var(--text-secondary)"
    }
  }, "\u6279\u91CF\u751F\u6210"), /*#__PURE__*/React.createElement(Switch, {
    checked: params.batch,
    onChange: v => setParam("batch", v)
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      borderTop: "1px solid var(--border-subtle)",
      background: "var(--bg-elevated)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u672C\u6B21\u6D88\u8017"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontFamily: "var(--font-mono)",
      color: "var(--gold-200)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      background: "linear-gradient(135deg,var(--gold-300),var(--gold-600))",
      transform: "rotate(45deg)",
      borderRadius: 1,
      boxShadow: "var(--glow-spirit)"
    }
  }), cost, " \u7075\u77F3")), /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    full: true,
    size: "lg",
    loading: generating,
    onClick: onGenerate,
    icon: !generating && /*#__PURE__*/React.createElement("i", {
      "data-lucide": "wand-sparkles",
      style: {
        width: 17,
        height: 17
      }
    })
  }, generating ? "推演中…" : "开始生成"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 9,
      fontFamily: "var(--font-sans)",
      fontSize: 11,
      color: "var(--text-faint)"
    }
  }, "\u4F59\u989D ", spirit, " \u7075\u77F3 \xB7 ", spirit < cost ? "灵石不足，可看广告补充" : "可生成约 " + Math.floor(spirit / cost) + " 次")));
}
Object.assign(window, {
  ParamPanel
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/studio/ParamPanel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/studio/StudioCanvas.jsx
try { (() => {
/* Studio — center canvas: prompt, result tabs, candidate grid */
const GENRE_ART = {
  "仙侠": {
    from: "#2f6e64",
    to: "#0e211f",
    glow: "rgba(201,163,91,0.7)",
    icon: "sword"
  },
  "武侠": {
    from: "#6a5a3a",
    to: "#1f1a10",
    glow: "rgba(218,185,120,0.7)",
    icon: "swords"
  },
  "西幻": {
    from: "#5b4b9c",
    to: "#181333",
    glow: "rgba(150,130,230,0.8)",
    icon: "wand-sparkles"
  },
  "科幻": {
    from: "#3f6e8f",
    to: "#0f1d28",
    glow: "rgba(120,180,230,0.8)",
    icon: "bot"
  },
  "赛博朋克": {
    from: "#a8327f",
    to: "#1a0f24",
    glow: "rgba(255,80,200,0.8)",
    icon: "skull"
  },
  "现代": {
    from: "#3a5a78",
    to: "#101a24",
    glow: "rgba(140,176,204,0.8)",
    icon: "building-2"
  },
  "末日": {
    from: "#7a5a3a",
    to: "#1c140c",
    glow: "rgba(220,150,80,0.7)",
    icon: "radiation"
  },
  "Q版": {
    from: "#5a9a4e",
    to: "#1d2e16",
    glow: "rgba(180,230,140,0.8)",
    icon: "sprout"
  },
  "像素": {
    from: "#7a6a4a",
    to: "#211a12",
    glow: "rgba(230,170,90,0.8)",
    icon: "grid-2x2"
  },
  "二次元": {
    from: "#9c5a7a",
    to: "#241018",
    glow: "rgba(240,150,190,0.8)",
    icon: "heart"
  }
};
function ResultTile({
  art,
  label,
  selected,
  onClick,
  loading
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      position: "relative",
      aspectRatio: "1",
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
      cursor: "pointer",
      border: "1.5px solid " + (selected ? "var(--gold-500)" : "var(--border-subtle)"),
      boxShadow: selected ? "var(--glow-gold)" : "none",
      background: "var(--surface-inset)",
      transition: "border-color var(--dur-base), box-shadow var(--dur-base)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      backgroundImage: "linear-gradient(45deg,#1a2227 25%,transparent 25%),linear-gradient(-45deg,#1a2227 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1a2227 75%),linear-gradient(-45deg,transparent 75%,#1a2227 75%)",
      backgroundSize: "16px 16px",
      backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
      opacity: 0.5
    }
  }), loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--surface-card)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      borderRadius: "50%",
      border: "2.5px solid var(--gold-500)",
      borderTopColor: "transparent",
      animation: "lf-spin 0.7s linear infinite"
    }
  })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: `radial-gradient(120% 90% at 50% 30%, ${art.from}, ${art.to} 72%)`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "44%",
      left: "50%",
      transform: "translate(-50%,-50%)",
      color: "rgba(255,255,255,0.92)",
      filter: `drop-shadow(0 0 16px ${art.glow})`
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": art.icon,
    style: {
      width: 52,
      height: 52
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      bottom: 8,
      left: 9,
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "rgba(255,255,255,0.7)"
    }
  }, label), selected && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: "var(--gold-500)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check",
    style: {
      width: 13,
      height: 13,
      color: "var(--ink-900)"
    }
  }))), /*#__PURE__*/React.createElement("style", null, `@keyframes lf-spin{to{transform:rotate(360deg)}}`));
}
function StudioCanvas({
  params,
  setParam,
  phase,
  progress,
  onGenerate,
  prompt,
  setPrompt,
  cost
}) {
  const {
    IconButton,
    Switch,
    SegmentedControl,
    ProgressBar,
    Button,
    Badge,
    OrnateBar
  } = window.LingjiForgeDesignSystem_e6d384;
  const [tab, setTab] = React.useState("候选结果");
  const [sel, setSel] = React.useState(0);
  const art = GENRE_ART[params.genre] || GENRE_ART["仙侠"];
  const generating = phase === "generating";
  const done = phase === "done";
  return /*#__PURE__*/React.createElement("main", {
    className: "lf-scroll lf-bg-deep",
    style: {
      flex: 1,
      minWidth: 0,
      overflowY: "auto",
      padding: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 760,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-inset)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--inset-top)",
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("textarea", {
    value: prompt,
    onChange: e => setPrompt(e.target.value),
    rows: 2,
    className: "lf-scroll",
    placeholder: "\u7528\u4E2D\u6587\u63CF\u8FF0\u4F60\u60F3\u8981\u7684\u7D20\u6750\u2026\u4F8B\u5982\uFF1A\u56FD\u98CE\u50CF\u7D20\u98CE\u7684\u5973\u5251\u4FEE\uFF0C8\u65B9\u5411\u884C\u8D70\u52A8\u753B\uFF0C\u900F\u660E\u80CC\u666F\u3002",
    style: {
      width: "100%",
      resize: "none",
      background: "transparent",
      border: "none",
      outline: "none",
      color: "var(--text-primary)",
      fontFamily: "var(--font-sans)",
      fontSize: 16,
      lineHeight: 1.7
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 30,
      padding: "0 10px",
      borderRadius: "var(--radius-md)",
      background: "transparent",
      border: "1px dashed var(--border-default)",
      color: "var(--text-muted)",
      fontSize: 12,
      fontFamily: "var(--font-sans)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "image-plus",
    style: {
      width: 14,
      height: 14
    }
  }), "\u4E0A\u4F20\u53C2\u8003\u56FE"), /*#__PURE__*/React.createElement(Switch, {
    checked: params.alpha,
    onChange: v => setParam("alpha", v),
    label: "\u900F\u660E\u80CC\u666F"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    size: "md",
    style: {
      marginLeft: "auto"
    },
    loading: generating,
    onClick: onGenerate,
    icon: !generating && /*#__PURE__*/React.createElement("i", {
      "data-lucide": "wand-sparkles",
      style: {
        width: 16,
        height: 16
      }
    })
  }, generating ? "推演中" : "开始生成", !generating && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      fontFamily: "var(--font-mono)",
      fontSize: 12,
      opacity: 0.85
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      background: "currentColor",
      transform: "rotate(45deg)",
      borderRadius: 1
    }
  }), cost)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      margin: "22px 0 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4
    }
  }, ["候选结果", "动画预览", "Sprite Sheet"].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setTab(t),
    style: {
      height: 32,
      padding: "0 14px",
      borderRadius: "var(--radius-md)",
      border: "none",
      cursor: "pointer",
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      fontWeight: tab === t ? 500 : 400,
      color: tab === t ? "var(--gold-200)" : "var(--text-secondary)",
      background: tab === t ? "rgba(201,163,91,0.14)" : "transparent"
    }
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "\u653E\u5927\u9884\u89C8",
    variant: "surface"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "maximize-2",
    style: {
      width: 16,
      height: 16
    }
  })), /*#__PURE__*/React.createElement(IconButton, {
    label: "\u91CD\u65B0\u63A8\u6F14",
    variant: "surface",
    onClick: onGenerate
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "rotate-cw",
    style: {
      width: 16,
      height: 16
    }
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "sm",
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "download",
      style: {
        width: 15,
        height: 15
      }
    })
  }, "\u5BFC\u51FA\u7D20\u6750"))), generating && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(OrnateBar, {
    value: progress,
    tone: "teal",
    height: 22,
    label: `正在推演 · ${params.genre} · ${params.style}`
  })), tab === "候选结果" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(2,1fr)",
      gap: 14
    }
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement(ResultTile, {
    key: i,
    art: art,
    label: `候选 ${i + 1} · ${params.size}`,
    selected: done && sel === i,
    loading: generating,
    onClick: () => setSel(i)
  }))), tab === "动画预览" && /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border-subtle)",
      background: "var(--surface-card)",
      padding: 24,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      alignItems: "center"
    }
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: 96,
      height: 96,
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-subtle)",
      position: "relative",
      overflow: "hidden",
      opacity: done ? 1 : 0.4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: `radial-gradient(120% 90% at 50% 35%, ${art.from}, ${art.to})`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "rgba(255,255,255,0.9)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": art.icon,
    style: {
      width: 34,
      height: 34
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      bottom: 4,
      left: 6,
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      color: "rgba(255,255,255,0.7)"
    }
  }, ["下", "左", "右", "上"][i])))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "jade"
  }, "8\u65B9\u5411 \xB7 12\u5E27"), /*#__PURE__*/React.createElement(Badge, {
    tone: "gold"
  }, "12 FPS"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      color: "var(--text-muted)"
    }
  }, "\u884C\u8D70\u5FAA\u73AF\u52A8\u753B\u9884\u89C8"))), tab === "Sprite Sheet" && /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border-subtle)",
      background: "var(--surface-card)",
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(8,1fr)",
      gap: 4
    }
  }, Array.from({
    length: 32
  }).map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      aspectRatio: "1",
      borderRadius: 3,
      background: `radial-gradient(120% 90% at 50% 35%, ${art.from}, ${art.to})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: done ? 1 : 0.35
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": art.icon,
    style: {
      width: 16,
      height: 16,
      color: "rgba(255,255,255,0.85)"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      marginTop: 14,
      fontFamily: "var(--font-mono)",
      fontSize: 12,
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "8 \u5217 \xD7 4 \u884C"), /*#__PURE__*/React.createElement("span", null, "\u5E27 ", params.size), /*#__PURE__*/React.createElement("span", null, "\u56FE\u96C6 ", parseInt(params.size) * 8, "\xD7", parseInt(params.size) * 4)))));
}
Object.assign(window, {
  StudioCanvas,
  GENRE_ART
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/studio/StudioCanvas.jsx", error: String((e && e.message) || e) }); }

// ui_kits/studio/StudioNav.jsx
try { (() => {
/* Studio — left asset-type nav */
function StudioNav({
  active,
  setActive
}) {
  const {
    NavItem,
    OrbIcon
  } = window.LingjiForgeDesignSystem_e6d384;
  const groups = [["生成", [["角色", "meditation"], ["怪物 / NPC", "beast"], ["道具 / 装备", "gem"], ["技能特效", "portal"], ["地图 / Tileset", "mountain"], ["建筑 / 场景", "pagoda"], ["UI 组件", "starchart"], ["图标", "talisman"], ["动画", "crane"]]], ["资产", [["我的素材库", "chest"], ["万象模板", "book"]]]];
  return /*#__PURE__*/React.createElement("nav", {
    className: "lf-scroll",
    style: {
      width: "var(--studio-nav-w)",
      flex: "none",
      borderRight: "1px solid var(--border-subtle)",
      background: "var(--bg-base)",
      padding: "14px 12px",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, groups.map(([label, items]) => /*#__PURE__*/React.createElement("div", {
    key: label
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 11,
      letterSpacing: "var(--tracking-wider)",
      color: "var(--text-faint)",
      textTransform: "uppercase",
      padding: "0 10px 8px"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, items.map(([t, ic]) => /*#__PURE__*/React.createElement(NavItem, {
    key: t,
    icon: /*#__PURE__*/React.createElement(OrbIcon, {
      name: ic,
      size: 26,
      active: t === active
    }),
    active: t === active,
    count: t === "怪物 / NPC" ? 42 : t === "我的素材库" ? 318 : null,
    onClick: () => setActive(t)
  }, t))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      padding: 14,
      borderRadius: "var(--radius-lg)",
      background: "linear-gradient(160deg, rgba(201,163,91,0.12), var(--surface-card))",
      border: "1px solid var(--border-default)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-serif)",
      fontWeight: 600,
      fontSize: 14,
      color: "var(--gold-200)"
    }
  }, "\u5347\u7EA7\u6708\u5361\u7248"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      color: "var(--text-secondary)",
      marginTop: 5,
      lineHeight: 1.6
    }
  }, "\u514D\u5E7F\u544A \xB7 \u6BCF\u65E5\u7075\u77F3 \xB7 \u5FEB\u901F\u961F\u5217")));
}
Object.assign(window, {
  StudioNav
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/studio/StudioNav.jsx", error: String((e && e.message) || e) }); }

// ui_kits/studio/StudioTopBar.jsx
try { (() => {
/* Studio — TopBar */
function StudioTopBar({
  spirit,
  onAd
}) {
  const {
    SpiritStone,
    IconButton,
    Avatar,
    Button
  } = window.LingjiForgeDesignSystem_e6d384;
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: "var(--studio-header-h)",
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "0 18px",
      borderBottom: "1px solid var(--border-subtle)",
      background: "var(--bg-elevated)",
      flex: "none",
      zIndex: 30
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-emblem-transparent.png",
    alt: "\u7075\u673A\u9601",
    style: {
      width: 30,
      height: 30,
      objectFit: "contain",
      filter: "drop-shadow(0 0 8px rgba(201,163,91,0.3))"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-serif)",
      fontWeight: 800,
      fontSize: 19,
      color: "var(--text-primary)",
      letterSpacing: "0.04em"
    }
  }, "\u7075\u673A\u9601"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 20,
      background: "var(--divider)",
      margin: "0 4px"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      color: "var(--text-secondary)"
    }
  }, "\u521B\u4F5C\u53F0")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginLeft: 14,
      padding: "5px 12px",
      borderRadius: "var(--radius-md)",
      background: "var(--surface-inset)",
      border: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "folder",
    style: {
      width: 14,
      height: 14,
      color: "var(--text-muted)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: "var(--text-secondary)"
    }
  }, "\u4FEF\u89C6\u89D2 RPG \xB7 \u4E3B\u89D2\u7D20\u6750"), /*#__PURE__*/React.createElement("i", {
    "data-lucide": "chevron-down",
    style: {
      width: 13,
      height: 13,
      color: "var(--text-muted)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onAd,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      height: 32,
      padding: "0 12px",
      borderRadius: "var(--radius-pill)",
      background: "rgba(47,110,100,0.16)",
      border: "1px solid var(--border-jade)",
      color: "var(--jade-200)",
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "clapperboard",
    style: {
      width: 15,
      height: 15
    }
  }), "\u770B\u5E7F\u544A\u9886\u53D6\u7075\u77F3"), /*#__PURE__*/React.createElement(SpiritStone, {
    count: spirit,
    onAdd: onAd
  }), /*#__PURE__*/React.createElement(IconButton, {
    label: "\u6BCF\u65E5\u4EFB\u52A1"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "scroll-text",
    style: {
      width: 18,
      height: 18
    }
  })), /*#__PURE__*/React.createElement(IconButton, {
    label: "\u8BBE\u7F6E"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "settings",
    style: {
      width: 18,
      height: 18
    }
  })), /*#__PURE__*/React.createElement(Avatar, {
    name: "\u9752",
    size: 32
  })));
}
Object.assign(window, {
  StudioTopBar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/studio/StudioTopBar.jsx", error: String((e && e.message) || e) }); }

__ds_ns.CornerFrame = __ds_scope.CornerFrame;

__ds_ns.OrnateBar = __ds_scope.OrnateBar;

__ds_ns.Banner = __ds_scope.Banner;

__ds_ns.FeaturePanel = __ds_scope.FeaturePanel;

__ds_ns.ORB_ICONS = __ds_scope.ORB_ICONS;

__ds_ns.OrbIcon = __ds_scope.OrbIcon;

__ds_ns.CloudDivider = __ds_scope.CloudDivider;

__ds_ns.OrnatePlate = __ds_scope.OrnatePlate;

__ds_ns.RewardBurst = __ds_scope.RewardBurst;

__ds_ns.OrnateButton = __ds_scope.OrnateButton;

__ds_ns.OrnatePanel = __ds_scope.OrnatePanel;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.SpiritStone = __ds_scope.SpiritStone;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.PromptInput = __ds_scope.PromptInput;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.NavItem = __ds_scope.NavItem;

})();
