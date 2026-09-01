import {
  AlertTriangle,
  ClipboardList,
  GraduationCap,
  MessageCircle,
  Timer,
  Wallet,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

const modules = [
  {
    href: "#ai-tutor",
    title: "Personalized AI Tutor",
    body: "Ask anything with context from your course, semester, and notes.",
    icon: MessageCircle,
  },
  {
    href: "#assignments",
    title: "Assignment Helper",
    body: "Outlines, drafts, and viva prep — review before you submit.",
    icon: ClipboardList,
  },
  {
    href: "#exam-prep",
    title: "Exam Preparation",
    body: "Question papers, mock tests, MCQs, and answer keys.",
    icon: GraduationCap,
  },
  {
    href: "#games",
    title: "Streaks & Games",
    body: "Quests, XP, levels, and short study games that keep you consistent.",
    icon: Timer,
  },
  {
    href: "#emergency",
    title: "Catch-up study plan",
    body: "When you’re short on time, get a clear do-now plan.",
    icon: AlertTriangle,
  },
  {
    href: "#budget",
    title: "Student Budget",
    body: "Safe daily spend, expenses, goals, and an AI money coach.",
    icon: Wallet,
  },
];

export function ProductOverview() {
  return (
    <section id="product" className="section-y-compact border-b border-border bg-surface">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Product"
          title="One workspace for study, deadlines, and money"
          description="StudentLife AI is a student workspace. Budget tools are one module — not the whole product."
          align="center"
          className="mb-8"
        />

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <a
                key={mod.title}
                href={mod.href}
                className="group border-t border-border pt-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Icon className="h-4 w-4 text-primary" aria-hidden />
                <p className="mt-3 text-sm font-semibold text-foreground group-hover:text-primary">
                  {mod.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-secondary">
                  {mod.body}
                </p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
