import * as React from "react";

/** Left-rail navigation entry with icon, active indicator and optional count. */
export interface NavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
  count?: number | string | null;
  onClick?: () => void;
}
export function NavItem(props: NavItemProps): JSX.Element;
