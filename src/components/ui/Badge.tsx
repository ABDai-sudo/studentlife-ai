import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "primary" | "ai" | "success" | "warning" | "error";
  className?: string;
};

const tones = {
  neutral: "bg-surface-secondary text-secondary border-border",
  primary: "bg-primary-soft text-primary border-primary/15",
  ai: "bg-primary-soft text-primary border-primary/15",
  success: "bg-success-soft text-success border-success/25",
  warning: "bg-warning-soft text-warning border-warning/25",
  error: "bg-error-soft text-error border-error/25",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
