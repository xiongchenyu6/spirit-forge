import * as React from "react";

/**
 * 灵机阁 primary action button. Gold = primary "造物/生成" action; jade = secondary;
 * ghost/outline for tertiary; danger for destructive.
 *
 * @startingPoint section="Core" subtitle="Primary action button — gold/jade/ghost" viewport="700x160"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  /** Visual style. @default "gold" */
  variant?: "gold" | "jade" | "outline" | "ghost" | "danger";
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /** Leading icon node (e.g. an <i data-lucide> or svg). */
  icon?: React.ReactNode;
  /** Trailing icon node. */
  iconRight?: React.ReactNode;
  /** Show a spinner and disable. */
  loading?: boolean;
  disabled?: boolean;
  /** Stretch to container width. */
  full?: boolean;
}

export function Button(props: ButtonProps): JSX.Element;
