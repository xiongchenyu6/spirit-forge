import * as React from "react";

/**
 * 灵石 currency display — the glowing gold gem plus the user's balance.
 * Brand-specific. Used in the top bar and anywhere a 灵石 cost/balance shows.
 *
 * @startingPoint section="Brand" subtitle="灵石 currency balance pill" viewport="700x120"
 */
export interface SpiritStoneProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current 灵石 balance. */
  count?: number;
  size?: "sm" | "md" | "lg";
  /** When set, renders a "+" button (开广告领取灵石入口). */
  onAdd?: () => void;
  /** Low-balance styling (灵石不足). */
  low?: boolean;
  /** Currency glyph: real crystal art or a CSS gold diamond. @default "crystal" */
  art?: "crystal" | "diamond";
}
export function SpiritStone(props: SpiritStoneProps): JSX.Element;
