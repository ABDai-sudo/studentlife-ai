import { Button } from "@/components/ui/Button";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-3 py-16 text-sm text-secondary"
      role="status"
      aria-live="polite"
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
      {label}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Retry",
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      className="border-s-2 border-error/40 px-4 py-3"
      role="alert"
    >
      <p className="text-sm font-semibold text-error">{title}</p>
      {message ? <p className="mt-1 text-sm text-secondary">{message}</p> : null}
      {onRetry ? (
        <div className="mt-3">
          <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
