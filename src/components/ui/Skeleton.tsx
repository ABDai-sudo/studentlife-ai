type SkeletonProps = {
  className?: string;
};

/** Lightweight pulse placeholder for async surfaces. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-secondary ${className}`}
      aria-hidden
    />
  );
}
