import * as React from "react";

/**
 * Painterly 鎏金 bitmap button for hero / feature CTAs (uses the厚涂 plate art).
 * Needs window.LF_ICON_BASE set (relative prefix to project root). For dense UI, use Button.
 *
 * @startingPoint section="Brand" subtitle="Ornate bitmap CTA button" viewport="700x120"
 */
export interface OrnateButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  /** teal (jade plate) or paper (parchment plate). @default "teal" */
  variant?: "teal" | "paper";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  full?: boolean;
  disabled?: boolean;
}
export function OrnateButton(props: OrnateButtonProps): JSX.Element;
