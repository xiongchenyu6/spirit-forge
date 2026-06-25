import * as React from "react";

/**
 * Selectable pill/chip — the workhorse of the 创作台 parameter panel
 * (题材, 风格, 视角, 动作, 尺寸, 用途, 输出格式).
 */
export interface TagProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  children?: React.ReactNode;
  selected?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}
export function Tag(props: TagProps): JSX.Element;
