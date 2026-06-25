import * as React from "react";

/** Centered modal with ink-fog backdrop and 切角 plate. */
export interface DialogProps {
  open?: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  /** 切角 cut-corner plate. @default true */
  cut?: boolean;
  style?: React.CSSProperties;
}
export function Dialog(props: DialogProps): JSX.Element | null;
