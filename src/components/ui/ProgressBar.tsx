type ProgressBarProps = {
  value: number;
  className?: string;
  label?: string;
  tone?: "primary" | "ai" | "success" | "accent";
};

const barTone = {
  primary: "bg-primary",
  ai: "bg-primary",
  success: "bg-success",
  accent: "bg-accent",
};

export function ProgressBar({
  value,
  className = "",
  label,
  tone = "primary",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={className}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-xs text-secondary">
          <span>{label}</span>
          <span className="font-semibold text-foreground">{clamped}%</span>
        </div>
      ) : null}
      <div
        className="h-1.5 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${barTone[tone]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
