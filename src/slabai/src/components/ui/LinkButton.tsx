import Link from "next/link";
import type { ReactNode } from "react";

type LinkButtonVariant = "primary" | "secondary" | "ghost" | "subtle" | "gradient";

interface LinkButtonProps {
  href: string;
  children: ReactNode;
  variant?: LinkButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LinkButton({ href, children, variant = "primary", size = "md", className = "" }: LinkButtonProps) {
  const classes = ["sl-button", `sl-button--${variant}`, size !== "md" ? `sl-button--${size}` : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <Link className={classes} href={href}>
      {children}
    </Link>
  );
}
