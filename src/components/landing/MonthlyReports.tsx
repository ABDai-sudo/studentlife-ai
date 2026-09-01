import { SectionHeader } from "@/components/ui/SectionHeader";

export function MonthlyReports() {
  return (
    <section id="reports" className="section-y border-b border-border bg-background">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Reports & insights"
          title="Weekly and monthly reviews you can actually act on"
          description="See spending trends, subscription reminders, and simple month-end summaries — sample preview only."
          className="mb-10"
        />

        <div className="grid gap-10 md:grid-cols-3">
          <article className="md:col-span-2">
            <p className="text-sm font-semibold text-foreground">July overview</p>
            <div className="mt-4 flex h-28 items-end gap-2">
              {[45, 62, 50, 78, 70, 88, 64].map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span
                    className="w-full rounded-t-md bg-primary/80"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[0.65rem] text-muted">W{i + 1}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-secondary">
              Highest week: food + entertainment. Lowest risk week: after pocket
              money reset.
            </p>
          </article>

          <article className="border-t border-border pt-6 md:border-t-0 md:border-s md:ps-8 md:pt-0">
            <p className="text-sm font-semibold text-foreground">Reminders</p>
            <ul className="mt-4 divide-y divide-border border-t border-border text-sm">
              {[
                "Hostel mess · ₹2,000 · 28 Jul",
                "Streaming · ₹199 · 30 Jul",
                "SIM recharge · ₹149 · 02 Aug",
              ].map((item) => (
                <li key={item} className="py-2.5 text-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
