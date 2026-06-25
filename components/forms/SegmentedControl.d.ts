import * as React from "react";

/** Exclusive segmented toggle (视角 / 输出格式). */
export interface SegmentedControlProps {
  options: Array<string | { value: string; label: React.ReactNode }>;
  value?: string;
  onChange?: (value: string) => void;
  size?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
}
export function SegmentedControl(props: SegmentedControlProps): JSX.Element;
