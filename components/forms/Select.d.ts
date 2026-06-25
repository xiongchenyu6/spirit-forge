import * as React from "react";

/** Styled native select. Pass <option> children. */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  size?: "sm" | "md" | "lg";
  wrapStyle?: React.CSSProperties;
}
export function Select(props: SelectProps): JSX.Element;
