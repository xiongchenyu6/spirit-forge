import * as React from "react";

/** Small status / count label. */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  tone?: "neutral" | "gold" | "jade" | "moon" | "danger";
  /** Filled (solid gold) instead of tinted. */
  solid?: boolean;
}
export function Badge(props: BadgeProps): JSX.Element;
