import Link from "next/link";

export function CTASection() {
  return (
    <section className="section-y-compact border-b border-border bg-background">
      <div className="container-shell">
        <div className="grid items-start gap-10 border-t border-border pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:pt-12">
          <div>
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-foreground sm:text-[1.85rem]">
              Study, deadlines, and budget — in one workspace.
            </h2>
            <p className="mt-3 max-w-lg text-base leading-[1.65] text-secondary">
              AI Tutor, assignments, exam prep, streaks, catch-up plans, and
              student budget tools — free to start, no credit card required.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-base font-semibold text-white transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Create a free account
              </Link>
              <Link
                href="#ai-tutor"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-5 text-base font-semibold text-foreground transition-colors hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Try AI Tutor
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Today’s snapshot</p>
            <ul className="mt-4 divide-y divide-border border-t border-border text-sm text-secondary">
              {[
                "AI Tutor · C algorithms recap",
                "Study block · 25 minutes",
                "Safe spend · ₹122 · streak day 7",
              ].map((item) => (
                <li key={item} className="py-2.5 text-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
