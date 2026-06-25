interface StatusBadgeProps {
  tone?: "blue" | "orange" | "success";
  children: React.ReactNode;
}

export function StatusBadge({ tone = "blue", children }: StatusBadgeProps) {
  const className = tone === "orange" ? "badge badge--orange" : tone === "success" ? "badge badge--success" : "badge";
  return <span className={className}>{children}</span>;
}
