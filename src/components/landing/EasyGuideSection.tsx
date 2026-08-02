import { BookOpen, CalendarDays, CircleHelp, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/Button";

const steps = [
  {
    number: "1",
    title: "Make your free account",
    text: "Enter your name, email, and a password. That’s all.",
    icon: CircleHelp,
  },
  {
    number: "2",
    title: "Add your classes",
    text: "Write the class name and time. Example: Maths — Monday 10 AM.",
    icon: CalendarDays,
  },
  {
    number: "3",
    title: "Add homework and notes",
    text: "Save what you need to finish and what you learned in class.",
    icon: PencilLine,
  },
  {
    number: "4",
    title: "Ask for help anytime",
    text: "Open Ask AI and type your question in simple words.",
    icon: BookOpen,
  },
];

export function EasyGuideSection() {
  return (
    <section
      id="easy-guide"
      className="section-y border-b border-border bg-surface"
    >
      <div className="container-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-primary">Easy guide</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.85rem]">
            Anyone can use this app in 4 simple steps
          </h2>
          <p className="mt-3 text-[1.02rem] leading-relaxed text-secondary">
            You do not need computer skills. Just follow these steps one by one.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ number, title, text, icon: Icon }) => (
            <article
              key={number}
              className="card-elevated relative p-5 pt-6"
            >
              <span className="absolute -top-3 left-5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-sm">
                {number}
              </span>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary-soft/60 px-5 py-5 text-center sm:px-8">
          <p className="text-base font-semibold text-foreground">
            Stuck? Look for the big blue buttons. They always show the next step.
          </p>
          <p className="mt-2 text-sm text-secondary">
            Example: “Create free account”, “Add class”, “Ask AI”.
          </p>
          <div className="mt-5 flex justify-center">
            <Button href="/signup" size="lg">
              Start now — it’s free
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
