import { displayAvatarStatus } from "@/lib/avatar/presets";
import { statusLooksPrivate } from "@/lib/avatar/contextual-status";
import type { BudgetState } from "@/lib/avatar/budget-state";

export type AvatarShareInput = {
  displayName: string;
  status?: string | null;
  budget?: BudgetState | null;
  streak?: number | null;
};

const MONEY_NEEDLES = [
  "₹",
  "rs.",
  "inr",
  "usd",
  "wallet",
  "balance",
  "spent",
  "pocket",
  "budget",
  "@",
];

export function buildAvatarShareText(input: AvatarShareInput): string {
  const name = input.displayName.replace(/\s+/g, " ").trim() || "Student";
  const parts = [name, "StudentLife"];

  const status = displayAvatarStatus(input.status);
  if (status && !statusLooksPrivate(status)) {
    parts.push(status);
  }

  if (
    input.streak != null &&
    Number.isFinite(input.streak) &&
    input.streak > 0 &&
    input.streak < 10_000
  ) {
    parts.push(`${Math.floor(input.streak)}-day streak`);
  }

  return parts.join(" · ");
}

export function shareTextLooksPrivate(text: string): boolean {
  if (statusLooksPrivate(text)) return true;
  const lower = text.toLowerCase();
  if (MONEY_NEEDLES.some((needle) => lower.includes(needle))) return true;
  return /(?:^|[^\d])\d+(?:[.,]\d{2})(?:[^\d]|$)/.test(text);
}
