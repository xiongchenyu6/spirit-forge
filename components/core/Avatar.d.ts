import * as React from "react";

/** User/asset avatar with gold hairline ring; falls back to initials. */
export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name?: string;
  size?: number;
  ring?: boolean;
  /** Rounded-square instead of circle (asset thumbnails). */
  square?: boolean;
}
export function Avatar(props: AvatarProps): JSX.Element;
