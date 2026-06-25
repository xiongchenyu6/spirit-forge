import * as React from "react";

/** Linear progress for generation / ad-watch / quota. */
export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100. */
  value?: number;
  tone?: "gold" | "jade" | "moon";
  height?: number;
  label?: React.ReactNode;
  /** Flowing shimmer (推演中…). */
  animated?: boolean;
}
export function ProgressBar(props: ProgressBarProps): JSX.Element;
