import * as React from "react";

/**
 * Painterly 仙侠 circular orb icon from the brand icon set (assets/icons/).
 * Use for category / asset-type / nav icons — NOT for small functional UI
 * (toolbar, chevrons, checks); those stay as Lucide line icons.
 *
 * Path: set window.LF_ICON_BASE to the relative prefix to project root before use
 * (e.g. "../../" inside ui_kits). Defaults to "".
 *
 * @startingPoint section="Brand" subtitle="仙侠 orb icon set" viewport="700x220"
 */
export interface OrbIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Icon name (file stem in assets/icons). */
  name?:
    | "emblem" | "crystal" | "scroll" | "censer" | "gourd"
    | "pagoda" | "sword" | "portal" | "scroll-bamboo" | "book"
    | "meditation" | "mountain" | "taiji" | "crane" | "starchart"
    | "pouch" | "talisman" | "gem" | "beast" | "shrine" | "brush" | "chest";
  size?: number;
  /** Selected styling (saturate + glow). */
  active?: boolean;
  /** Add a subtle gold ring + inset backdrop. */
  framed?: boolean;
  glow?: boolean;
  onClick?: () => void;
}
export function OrbIcon(props: OrbIconProps): JSX.Element;
export const ORB_ICONS: string[];
