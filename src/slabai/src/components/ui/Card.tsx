import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export function Card({ children, padded = true, className = "", ...props }: CardProps) {
  return (
    <div className={`card ${padded ? "card--padded" : ""} ${className}`} {...props}>
      {children}
    </div>
  );
}
