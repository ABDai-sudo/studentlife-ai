"use client";

import Link from "next/link";
import { Palette } from "lucide-react";
import type { PersonalityMode } from "@/lib/personality";
import { PERSONALITY_BLURBS, PERSONALITY_SHORT_LABELS } from "@/lib/languages";

type PersonalityVibeCardProps = {
  personality: PersonalityMode | string;
  title: string;
  hint: string;
  editLabel: string;
  /** Anchor id of the personality form control. */
  editHref?: string;
};

/**
 * Premium, subtle indicator near UI Language.
 * Shows tone/personality — never framed as a language.
 */
export function PersonalityVibeCard({
  personality,
  title,
  hint,
  editLabel,
  editHref = "#personality",
}: PersonalityVibeCardProps) {
  const short =
    PERSONALITY_SHORT_LABELS[personality] ||
    String(personality).replaceAll("_", " ");
  const blurb =
    PERSONALITY_BLURBS[personality] ||
    "Changes wording and personality — not language.";

  return (
    <div className="rounded-lg border border-border bg-surface px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.06em] text-muted">
            {title}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-primary/20 bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
              <Palette className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{short}</span>
            </span>
          </div>
          <p className="mt-1.5 text-xs font-medium leading-snug text-secondary">
            {blurb}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>
        </div>
        <Link
          href={editHref}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {editLabel}
        </Link>
      </div>
    </div>
  );
}
