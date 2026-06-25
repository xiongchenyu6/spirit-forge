import * as React from "react";

/** Icon-only square button for toolbars. */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "surface" | "gold";
  active?: boolean;
  /** Accessible label / tooltip. */
  label?: string;
}
export function IconButton(props: IconButtonProps): JSX.Element;
