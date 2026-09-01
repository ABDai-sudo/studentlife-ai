import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DashboardPreview } from "@/components/landing/DashboardPreview";

export function HeroSection() {
  return (
    <section className="hero-canvas border-b border-border">
      <div className="container-shell grid items-center gap-8 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:py-14">
        <div>
          <p className="mb-4 text-sm font-medium text-muted">
            Study and budget tools for students
          </p>

          <h1 className="max-w-xl text-[2rem] font-semibold tracking-tight text-foreground sm:text-[2.55rem] sm:leading-[1.15]">
            Study, deadlines, and budget — in one place.
          </h1>

          <p className="mt-4 max-w-lg text-[1.05rem] leading-relaxed text-secondary">
            Ask study questions, manage assignments, prepare for exams, keep a
            streak, and track student spending — all in one workspace.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button href="/signup" size="lg">
              Create a free account
            </Button>
            <Button href="#ai-tutor" variant="secondary" size="lg">
              Try AI Tutor
            </Button>
          </div>

          <ul className="mt-7 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5">
            {[
              "Free student plan",
              "No credit card required",
              "Academics and money in one app",
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
