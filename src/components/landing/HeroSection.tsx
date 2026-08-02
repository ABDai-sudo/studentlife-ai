import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DashboardPreview } from "@/components/landing/DashboardPreview";

export function HeroSection() {
  return (
    <section className="hero-canvas border-b border-border">
      <div className="container-shell grid items-center gap-12 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:py-20">
        <div>
          <Badge tone="primary" className="mb-4">
            AI financial management built for student life
          </Badge>

          <h1 className="max-w-xl text-[2rem] font-semibold tracking-tight text-foreground sm:text-[2.55rem] sm:leading-[1.15]">
            Make your money last. Manage student life better.
          </h1>

          <p className="mt-4 max-w-lg text-[1.05rem] leading-relaxed text-secondary">
            Track spending, control your daily budget, save for goals, and
            organize classes, assignments, and exams from one intelligent student
            workspace.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button href="/signup" size="lg">
              Start managing money
            </Button>
            <Button href="#product" variant="secondary" size="lg">
              View financial dashboard
            </Button>
          </div>

          <ul className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5">
            {[
              "Free student plan",
              "No credit card required",
              "Finance and studies in one app",
            ].map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-1.5 text-sm text-secondary"
              >
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <DashboardPreview />
      </div>
    </section>
  );
}
