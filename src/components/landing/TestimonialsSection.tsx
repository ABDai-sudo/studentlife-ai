import { SectionHeader } from "@/components/ui/SectionHeader";

const feedbackPoints = [
  "Students want quick assignment support.",
  "Students want daily streaks, quests, and games.",
  "Students want a Chronically Online personality option.",
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="section-y-compact border-b border-border bg-background">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Student feedback"
          title="Built with student feedback"
          description="These are product directions we hear from students — not named testimonials, ratings, or verified outcome claims."
          align="center"
          className="mb-6"
        />

        <ul className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-3">
          {feedbackPoints.map((point) => (
            <li
              key={point}
              className="rounded-xl border border-border bg-surface px-4 py-4 text-base leading-[1.65] text-secondary"
            >
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
