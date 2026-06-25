import React, { type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "subtle" | "danger" | "gradient";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  iconOnly = false,
  loading = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = [
    "sl-button",
    `sl-button--${variant}`,
    size !== "md" ? `sl-button--${size}` : "",
    iconOnly ? "sl-button--icon" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? "Đang xử lý..." : children}
    </button>
  );
}
