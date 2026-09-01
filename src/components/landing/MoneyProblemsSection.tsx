import { SectionHeader } from "@/components/ui/SectionHeader";

const problems = [
  {
    title: "Pocket money runs out early",
    detail: "Week 3 arrives and food + travel already ate the month.",
    ui: "Money left ₹320 · 12 days remaining · High risk",
  },
  {
    title: "No idea where money went",
    detail: "Small spends add up with nothing written down.",
    ui: "Food ₹1,420 · Travel ₹680 · Entertainment ₹540",
  },
  {
    title: "Hard to save for a laptop or course",
    detail: "Goals stay vague without a weekly contribution plan.",
    ui: "Laptop goal · ₹8,000 / ₹60,000 · 42%",
  },
  {
    title: "Subscriptions and hostel costs get forgotten",
    detail: "Recurring payments surprise you mid-month.",
    ui: "Reminder · Netflix ₹199 · Hostel mess ₹2,000",
  },
];

export function MoneyProblemsSection() {
  return (
    <section id="problems" className="section-y border-b border-border bg-background">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Student money problems"
          title="Student money should not disappear before month-end."
          description="StudentLife AI is built for pocket money, hostel costs, travel, food, and saving for real student goals—not generic adult budgeting."
          className="mb-10"
        />
        <div className="grid gap-8 md:grid-cols-2">
          {problems.map((item) => (
            <article key={item.title} className="border-t border-border pt-5">
              <h3 className="text-base font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                {item.detail}
              </p>
              <p className="mt-4 text-sm font-medium text-foreground">
                {item.ui}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
