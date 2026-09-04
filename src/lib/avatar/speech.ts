import { statusLooksPrivate } from "@/lib/avatar/contextual-status";
import { pickCampusSlang } from "@/lib/avatar/campus-slang";
import type { BudgetState } from "@/lib/avatar/budget-state";

const BRO_BUDGET_LINE: Record<BudgetState, string> = {
  rich: "We are up, bro. Aura points are maxed out. Financial drip is elite right now. Let's cook.",
  mid: "Chillin' bro. Budget is mid but stable, no cap. We move.",
  cooked:
    "Bro, the wallet is down bad. Let's slow the spending before things get cooked.",
};

const DEFAULT_BUDGET_LINE: Record<BudgetState, string> = {
  rich: "Your budget is in a strong place. Keep the same pace.",
  mid: "Your budget is stable. Stay consistent.",
  cooked: "Spending is tight this month. Slow down before the budget runs out.",
};

const MODEL_PAPERS_LINE = "Your model papers are ready.";

export type AvatarSpeechInput = {
  budget: BudgetState;
  examSeasonActive: boolean;
  institutionName?: string | null;
  campusSlang: boolean;
  broModeEnabled: boolean;
  seed: string;
  /** Only true when authenticated question papers exist. */
  hasModelPapers?: boolean;
};

export type AvatarSpeechResult = {
  budgetLine: string;
  slangLine: string | null;
  examLine: string | null;
  papersLine: string | null;
  text: string;
  budget: BudgetState;
};

const INSTITUTION_MAX = 48;
const INSTITUTION_OK = /^[\p{L}\p{M}0-9 .,'&()-]+$/u;

export function sanitizeInstitutionName(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed || trimmed.length > INSTITUTION_MAX) return null;
  if (statusLooksPrivate(trimmed)) return null;
  if (!INSTITUTION_OK.test(trimmed)) return null;
  return trimmed;
}

function examLineFor(institutionName: string | null): string | null {
  const safe = sanitizeInstitutionName(institutionName);
  if (!safe) return null;
  return `Also, your ${safe} study material is ready. Time to lock in.`;
}

export function getAvatarSpeech(input: AvatarSpeechInput): AvatarSpeechResult {
  const budgetLine = input.broModeEnabled
    ? BRO_BUDGET_LINE[input.budget]
    : DEFAULT_BUDGET_LINE[input.budget];

  const slangLine =
    input.campusSlang && input.seed ? pickCampusSlang(input.seed) : null;

  const examLine = input.examSeasonActive
    ? examLineFor(input.institutionName ?? null)
    : null;

  const papersLine =
    input.examSeasonActive && input.hasModelPapers ? MODEL_PAPERS_LINE : null;

  const text = [budgetLine, slangLine, examLine, papersLine]
    .filter((part): part is string => Boolean(part))
    .join(" ");

  return {
    budgetLine,
    slangLine,
    examLine,
    papersLine,
    text,
    budget: input.budget,
  };
}
