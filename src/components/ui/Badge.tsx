import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "primary" | "ai" | "success" | "warning" | "error";
  className?: string;
};

const tones = {
  neutral: "bg-surface-secondary text-secondary border-border",
  primary: "bg-primary-soft text-primary border-primary/15",
  ai: "bg-ai-soft text-ai border-ai/15",
  success: "bg-green-50 text-success border-green-100",
  warning: "bg-amber-50 text-warning border-amber-100",
  error: "bg-red-50 text-error border-red-100",
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
