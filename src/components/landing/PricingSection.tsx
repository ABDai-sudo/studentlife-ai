import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Core money tools and essential student organization.",
    features: [
      "Monthly budget",
      "Expense tracking",
      "Safe daily spending",
      "Basic savings goals",
      "Subjects, notes, assignments",
      "Timetable",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Student Pro",
    price: "₹49",
    period: "/month",
    description: "AI Money Coach and deeper insights for serious budget control.",
    features: [
      "Everything in Free",
      "AI Financial Coach",
      "Advanced spending insights",
      "Unlimited savings goals",
      "Can I Afford It?",
      "Financial health reports",
      "Subscription tracking",
      "Advanced academic AI",
      "Exam prep tools & analytics",
    ],
    cta: "Start Student Pro",
    highlighted: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="section-y border-b border-border bg-background">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Pricing"
          title="Start free. Upgrade for AI Money Coach."
          description="No banking, lending, credit, or investment products — just student budgeting tools and organization."
          align="center"
          className="mb-10"
        />

        <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`card-elevated p-6 ${
                plan.highlighted ? "border-primary ring-1 ring-primary/20" : ""
              }`}
            >
              <p className="text-sm font-semibold text-primary">{plan.name}</p>
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
                href="/signup"
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
