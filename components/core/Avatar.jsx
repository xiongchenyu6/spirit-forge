import React from "react";

/**
 * Avatar — user or asset thumbnail with a gold hairline ring.
 */
export function Avatar({ src, name = "", size = 36, ring = true, square = false, style = {}, ...rest }) {
  const initials = name ? name.trim().slice(0, 2) : "灵";
  return (
    <div
      style={{
        width: size, height: size, flex: "none",
        borderRadius: square ? "var(--radius-md)" : "50%",
        background: src ? `center/cover no-repeat url(${src})` : "linear-gradient(135deg, var(--jade-600), var(--jade-900))",
        border: ring ? "1px solid var(--border-strong)" : "none",
        boxShadow: ring ? "var(--inset-top)" : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--jade-200)", fontFamily: "var(--font-serif)", fontWeight: "var(--weight-semibold)",
        fontSize: size * 0.4, overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      {!src && initials}
    </div>
  );
}
