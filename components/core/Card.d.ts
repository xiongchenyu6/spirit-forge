import * as React from "react";

/**
 * Surface plate (炼器台). Optional 切角 cut-corner motif and emissive glow.
 *
 * @startingPoint section="Core" subtitle="Plate surface with optional cut-corner motif" viewport="700x200"
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** 切角 cut-corner clip (机关阁 plate). */
  cut?: boolean;
  glow?: "none" | "gold" | "jade";
  /** Hover lift + glow (for clickable cards). */
  interactive?: boolean;
  padding?: number | string;
}
export function Card(props: CardProps): JSX.Element;
