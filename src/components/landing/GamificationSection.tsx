import { Flame, Target, Timer, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";

const quests = [
  "Study C Programming for 25 minutes",
  "Complete one pending assignment",
  "Finish a five-question quiz",
];

const games = [
  { name: "Quiz Rush", desc: "Timed MCQs under pressure" },
  { name: "Focus Sprint", desc: "25-minute deep work block" },
  { name: "Flashcard Flip", desc: "Quick recall drills" },
  { name: "Chapter challenge", desc: "Chapter and exam prep tracker" },
];

export function GamificationSection() {
  return (
    <section id="games" className="section-y-compact border-b border-border bg-surface">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Streaks, XP, and short games"
          title="Build consistent study habits"
          description="Daily quests, XP, levels, and short games that reward real study — not empty taps."
          className="mb-8"
        />

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat icon={Flame} label="7-day streak" value="7" />
              <Stat icon={TrendingUp} label="XP" value="640" />
              <Stat icon={Target} label="Academic Aura" value="82" />
              <Stat icon={Timer} label="Level" value="On schedule" small />
            </div>

            <p className="mt-5 text-sm font-semibold text-foreground">
              Today’s three quests
            </p>
            <ul className="mt-3 space-y-2">
              {quests.map((q, i) => (
                <li
                  key={q}
                  className="flex items-center gap-3 border-b border-border py-2.5 text-sm text-foreground last:border-b-0"
                >
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-soft text-[0.7rem] font-semibold text-primary">
                    {i + 1}
                  </span>
                  {q}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm font-medium text-secondary">
              Complete one meaningful activity to keep today’s streak.
            </p>
            <ProgressBar value={33} className="mt-3" label="Daily quest progress" />
          </div>

          <div className="space-y-3">
            {games.map((game) => (
              <div
                key={game.name}
                className="flex items-start gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{game.name}</p>
                  <p className="mt-0.5 text-sm text-secondary">{game.desc}</p>
                </div>
              </div>
            ))}
            <Button href="/signup" className="w-full sm:w-auto">
              Open Games & Streaks
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  small,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[0.65rem] font-medium text-muted">
        <Icon className="h-3 w-3" aria-hidden />
        {label}
      </p>
      <p
        className={`mt-1 font-semibold text-foreground ${
          small ? "text-xs sm:text-sm" : "text-lg"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
