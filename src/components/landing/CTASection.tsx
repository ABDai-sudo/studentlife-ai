import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export function CTASection() {
  return (
    <section className="section-y border-b border-border bg-surface">
      <div className="container-shell">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-ai px-6 py-10 sm:px-10 sm:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-white sm:text-[1.85rem]">
                Make your money last — and keep student life organized.
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/85">
                Start with a free budget, safe daily spending, and goals. Add
                classes and assignments when you need them.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-foreground"
                >
                  Start managing money
                </Link>
                <Link
                  href="#product"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/35 bg-white/10 px-5 text-sm font-semibold text-white"
                >
                  View financial dashboard
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Today</p>
                <Badge className="border-white/20 bg-white/15 text-white">
                  ₹122 safe
                </Badge>
              </div>
              <div className="space-y-2">
                {[
                  "Money left · ₹1,350",
                  "Food alert · +31% vs last month",
                  "Laptop goal · 42%",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg bg-white/10 px-3 py-2.5 text-sm text-white/95"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
