type Point = { label: string; value: number };

export function SimpleBarChart({
  title,
  data,
  emptyMessage = "No data for this period yet.",
}: {
  title: string;
  data: Point[];
  emptyMessage?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 0);
  return (
    <div className="border-t border-border pt-4 md:pt-5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {data.length === 0 || max === 0 ? (
        <p className="mt-6 text-sm text-muted">{emptyMessage}</p>
      ) : (
        <div className="mt-4 flex h-40 items-end gap-1.5 overflow-x-auto">
          {data.map((d) => {
            const h = max === 0 ? 0 : Math.max(4, (d.value / max) * 100);
            return (
              <div
                key={d.label}
                className="flex min-w-[18px] flex-1 flex-col items-center gap-1"
                title={`${d.label}: ${d.value}`}
              >
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[10px] text-muted">{d.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  delta,
}: {
  label: string;
  value: string | number;
  hint?: string;
  delta?: number | null;
}) {
  return (
    <div className="border-t border-border pt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
        {hint ? <span>{hint}</span> : null}
        {delta != null ? (
          <span
            className={
              delta > 0
                ? "text-success"
                : delta < 0
                  ? "text-error"
                  : "text-muted"
            }
          >
            {delta > 0 ? "+" : ""}
            {delta}% vs prior
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-start gap-2 border-t border-border py-8">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="max-w-xl text-sm text-muted">{body}</p>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Operational"
      ? "bg-success-soft text-success"
      : status === "Degraded" || status === "Partial outage"
        ? "bg-warning-soft text-warning"
        : "bg-surface-secondary text-secondary";
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${tone}`}
    >
      {status}
    </span>
  );
}
