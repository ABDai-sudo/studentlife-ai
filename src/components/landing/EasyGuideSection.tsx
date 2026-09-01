import { Button } from "@/components/ui/Button";

const steps = [
  {
    number: "1",
    title: "Create your account",
    text: "Sign up with your name, email, and a password.",
  },
  {
    number: "2",
    title: "Add your classes",
    text: "Enter the class name and when it meets. You can change this later.",
  },
  {
    number: "3",
    title: "Add homework and notes",
    text: "Keep deadlines and class notes in one place so revision is easier.",
  },
  {
    number: "4",
    title: "Ask the tutor",
    text: "Open AI Tutor and ask a question in plain language.",
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
          <p className="text-sm font-medium text-muted">Getting started</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.85rem]">
            Four steps to set up your workspace
          </h2>
          <p className="mt-3 text-[1.02rem] leading-relaxed text-secondary">
            Create an account, add your classes, then start using study and money
            tools together.
          </p>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ number, title, text }) => (
            <article key={number}>
              <span className="text-xs font-medium text-muted">{number}</span>
              <h3 className="mt-2 text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-base font-semibold text-foreground">
            Each page highlights one next step.
          </p>
          <p className="mt-2 text-sm text-secondary">
            Example: create an account, add a class, then ask the tutor.
          </p>
          <div className="mt-5">
            <Button href="/signup" size="lg">
              Create a free account
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
