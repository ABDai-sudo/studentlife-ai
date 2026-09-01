import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

const inputs = [
  { label: "Exam in", value: "3 days" },
  { label: "Assignments pending", value: "2" },
  { label: "Available study hours", value: "4 / day" },
  { label: "Weak subject", value: "Mathematics" },
];

const outputs = [
  {
    title: "Do now",
    body: "Revise high-weight Mathematics chapters for 90 minutes. Skip low-yield topics.",
  },
  {
    title: "Do next",
    body: "Draft the shorter assignment outline (45 min), then a 20-question mixed quiz.",
  },
  {
    title: "Do later",
    body: "Polish the longer assignment after the exam buffer is secure.",
  },
  {
    title: "Break schedule",
    body: "50/10 focus blocks · one longer break after block three.",
  },
  {
    title: "Sleep protection",
    body: "Hard stop at 11:30 PM. No all-nighter plan on night one.",
  },
  {
    title: "Add to timetable",
    body: "Three emergency sessions pinned to your calendar for the next three days.",
  },
];

export function EmergencyModeSection() {
  return (
    <section id="emergency" className="section-y-compact border-b border-border bg-background">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Emergency Study Plan"
          title="When time is scarce, get a clear do-now plan"
          description="Tell StudentLife AI how much time you have. Get an ordered plan that protects sleep and still covers what matters."
          className="mb-8"
        />

        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold text-foreground">Example input</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-4">
              {inputs.map((item) => (
                <div key={item.label}>
                  <dt className="text-[0.65rem] text-muted">{item.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
            <Button href="/signup" className="mt-6">
              Create a catch-up plan
            </Button>
          </div>

          <div className="grid gap-6 border-t border-border pt-6 sm:grid-cols-2 lg:border-t-0 lg:border-s lg:ps-8 lg:pt-0">
            {outputs.map((item) => (
              <div key={item.title}>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {item.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-secondary">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
