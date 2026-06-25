import * as React from "react";

/**
 * Wraps content in four 鎏金 corner ornaments (角标花纹) over an optional hairline border.
 * Needs window.LF_ICON_BASE set.
 */
export interface CornerFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  cornerSize?: number;
  bordered?: boolean;
  pad?: number | string;
}
export function CornerFrame(props: CornerFrameProps): JSX.Element;
