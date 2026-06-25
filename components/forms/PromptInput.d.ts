import * as React from "react";

/**
 * The 创作台 Prompt 输入框: multi-line description box with a gold 开始生成 action
 * that shows its 灵石 cost.
 *
 * @startingPoint section="Brand" subtitle="Prompt box with 开始生成 + 灵石 cost" viewport="700x220"
 */
export interface PromptInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  onGenerate?: () => void;
  /** 灵石 cost shown on the generate button. @default 1 */
  cost?: number;
  /** Helper content on the left of the action row. */
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}
export function PromptInput(props: PromptInputProps): JSX.Element;
