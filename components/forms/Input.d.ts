import * as React from "react";

/** Single-line text input with optional leading icon and suffix. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  invalid?: boolean;
  /** Style override for the wrapping frame. */
  wrapStyle?: React.CSSProperties;
}
export function Input(props: InputProps): JSX.Element;
