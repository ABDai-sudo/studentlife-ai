import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description:
      "The complete student workspace starter — academics and money tools without a card.",
    features: [
      "Basic AI Tutor",
      "Tasks and timetable",
      "Basic assignment help",
      "Limited question generation",
      "Budget tools (safe spend, expenses, goals)",
      "Basic streaks and quests",
      "Personality modes (core set)",
    ],
    cta: "Create a free account",
    highlighted: true,
    href: "/signup",
    badge: "Available now",
  },
  {
    name: "Student Pro",
    price: "₹49",
    period: "/month",
    description:
      "Coming later — higher AI limits and advanced academic tools when billing is ready. Payments are not enabled yet.",
    features: [
      "Everything in Free",
      "More AI usage",
      "Larger file uploads",
      "Advanced mock exams",
      "Detailed assignment help",
      "Premium personality themes",
      "Advanced weekly recaps",
      "Priority AI processing",
    ],
    cta: "Join waitlist via signup",
    highlighted: false,
    href: "/signup",
    badge: "Coming soon",
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="section-y-compact border-b border-border bg-surface">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Pricing"
          title="Free for the core student workspace"
          description="The free plan covers academics and budget. Pro expands AI depth later — no payments are charged until billing ships."
          align="center"
          className="mb-8"
        />

        <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2 md:gap-0">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`pt-6 ${
                plan.highlighted ? "md:pe-8" : "border-t border-border md:border-s md:border-t-0 md:ps-8"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-primary">{plan.name}</p>
                <span className="rounded-md border border-border bg-surface-secondary px-2 py-0.5 text-[0.7rem] font-medium text-secondary">
                  {plan.badge}
                </span>
              </div>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-muted">{plan.period}</span>
              </p>
              <p className="mt-2 text-sm text-secondary">{plan.description}</p>
              <ul className="mt-5 space-y-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                href={plan.href}
                variant={plan.highlighted ? "primary" : "secondary"}
                className="mt-6 w-full"
              >
                {plan.cta}
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
