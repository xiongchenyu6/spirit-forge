import * as React from "react";

/**
 * Gold-rimmed plate frame (9-slice border-image) over a surface color — the 炼器台 container.
 * Needs window.LF_ICON_BASE set.
 *
 * @startingPoint section="Brand" subtitle="Ornate gold-rim framed panel" viewport="700x220"
 */
export interface OrnatePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** Inner surface color. @default var(--surface-card) */
  surface?: string;
  /** Total inner padding (incl. the frame band). @default 22 */
  padding?: number | string;
  /** border-image slice / width in px. @default 28 */
  slice?: number;
  glow?: boolean;
}
export function OrnatePanel(props: OrnatePanelProps): JSX.Element;
