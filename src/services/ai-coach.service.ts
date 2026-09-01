import { getDashboardMoneySummary } from "@/services/expense.service";
import { listGoalsForUser } from "@/services/goal.service";
import { listBudgetsForUser } from "@/services/budget.service";
import { getProfileForUser } from "@/services/profile.service";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expense";
import { formatMoney } from "@/lib/money";
import {
  getMoneyAssistantCopy,
  type PersonalityMode,
} from "@/lib/personality";

export type AiCoachReply = {
  reply: string;
  provider: "rules" | "openai" | "gemini" | "scope";
  /** True when the question is outside student-budgeting scope */
  outOfScope?: boolean;
};

/** Topics the money assistant intentionally does not cover. */
const OUT_OF_SCOPE_PATTERNS: RegExp[] = [
  /\b(bank|banking|bank account|savings account|current account|open an account)\b/i,
  /\b(invest|investment|investing|investor|stocks?|shares?|mutual funds?|etf|portfolio|brokerage)\b/i,
  /\b(crypto|bitcoin|ethereum|nft|forex|day.?trad(?:e|ing)|trading tips?)\b/i,
  /\b(credit card|credit score|credit rating|loan|loans|emi|mortgage|lender|borrow)\b/i,
  /\b(tax|taxes|income tax|gst|tds|itr|tax filing|tax return)\b/i,
  /\b(insurance policy|life insurance|term insurance|sip\b|equity)\b/i,
];

export function isMoneyCoachOutOfScope(message: string): boolean {
  const q = message.trim();
  if (!q) return false;
  return OUT_OF_SCOPE_PATTERNS.some((re) => re.test(q));
}

async function buildContext(userId: string) {
  const [summary, goals, budgets] = await Promise.all([
    getDashboardMoneySummary(userId),
    listGoalsForUser(userId),
    listBudgetsForUser(userId),
  ]);

  const currency = summary.currency;
  const top = summary.categories
    .slice(0, 3)
    .map(
      (c) =>
        `${EXPENSE_CATEGORY_LABELS[c.category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? c.category}: ${formatMoney(c.amount, currency)} (${c.percent}%)`
    )
    .join("; ");

  const goalLines = goals
    .filter((g) => g.status === "ACTIVE")
    .slice(0, 3)
    .map(
      (g) =>
        `${g.title}: ${formatMoney(g.currentAmount, g.currency)} / ${formatMoney(g.targetAmount, g.currency)} (${g.progressPercent}%)`
    )
    .join("; ");

  const budgetLines = budgets
    .slice(0, 5)
    .map(
      (b) =>
        `${b.categoryLabel}: spent ${formatMoney(b.spent, b.currency)} of ${formatMoney(b.amount, b.currency)}`
    )
    .join("; ");

  return {
    summary,
    text: [
      `Currency: ${currency}`,
      `Pocket money: ${summary.pocketMoney == null ? "not set" : formatMoney(summary.pocketMoney, currency)}`,
      `Money left: ${summary.moneyLeft == null ? "n/a" : formatMoney(summary.moneyLeft, currency)}`,
      `Days left in month: ${summary.daysLeft}`,
      `Safe per day: ${summary.safePerDay == null ? "n/a" : formatMoney(summary.safePerDay, currency)}`,
      `Spent this month: ${formatMoney(summary.monthSpent, currency)}`,
      `Spent today: ${formatMoney(summary.todaySpent, currency)}`,
      `Top categories: ${top || "none yet"}`,
      `Budgets: ${budgetLines || "none set"}`,
      `Goals: ${goalLines || "none set"}`,
    ].join("\n"),
  };
}

function rulesReply(
  message: string,
  contextText: string,
  summary: Awaited<ReturnType<typeof getDashboardMoneySummary>>
): string {
  const q = message.toLowerCase();
  const currency = summary.currency;

  if (summary.pocketMoney == null) {
    return "Set your monthly pocket money in Profile first. Then I can give useful spending guidance from the budget details you add.";
  }

  if (q.includes("overspend") || (q.includes("where") && q.includes("money"))) {
    const top = summary.categories[0];
    if (!top) {
      return "You have not logged expenses yet. Log food/travel spends, then ask again.";
    }
    const name =
      EXPENSE_CATEGORY_LABELS[top.category as keyof typeof EXPENSE_CATEGORY_LABELS] ??
      top.category;
    return `Your biggest category this month is ${name} at ${formatMoney(top.amount, currency)} (${top.percent}% of tracked spend). Money left: ${formatMoney(summary.moneyLeft ?? 0, currency)} with ${summary.daysLeft} days left.`;
  }

  if (q.includes("safe") || q.includes("per day") || q.includes("daily")) {
    return `Your safe daily spend is about ${formatMoney(summary.safePerDay ?? 0, currency)} (${summary.daysLeft} days left, ${formatMoney(summary.moneyLeft ?? 0, currency)} remaining). Today you have logged ${formatMoney(summary.todaySpent, currency)}.`;
  }

  if (
    q.includes("afford") ||
    q.includes("buy") ||
    q.includes("spend ₹") ||
    q.includes("spend $")
  ) {
    const match = message.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const cost = Number(match[1]);
      const left = summary.moneyLeft ?? 0;
      const after = Math.floor(((left - cost) / summary.daysLeft) * 100) / 100;
      if (cost > left) {
        return `That ${formatMoney(cost, currency)} purchase is above your money left (${formatMoney(left, currency)}). Wait or trim other spending first.`;
      }
      return `If you spend ${formatMoney(cost, currency)}, safe daily spend falls from ${formatMoney(summary.safePerDay ?? 0, currency)} to about ${formatMoney(after, currency)}. Use Can I Afford It? for a full check.`;
    }
  }

  if (q.includes("reduce") || q.includes("cut spend") || q.includes("spend less")) {
    const top = summary.categories[0];
    const name = top
      ? EXPENSE_CATEGORY_LABELS[top.category as keyof typeof EXPENSE_CATEGORY_LABELS] ??
        top.category
      : null;
    return name
      ? `Start with ${name} — it's your largest category this month. Stay near ${formatMoney(summary.safePerDay ?? 0, currency)}/day and review category budgets.`
      : `Stay near ${formatMoney(summary.safePerDay ?? 0, currency)}/day, log every expense, and set category budgets so overspend shows up early.`;
  }

  if (q.includes("save") || q.includes("goal") || q.includes("laptop")) {
    return `You have ${formatMoney(summary.moneyLeft ?? 0, currency)} left this month. Protect savings by staying near ${formatMoney(summary.safePerDay ?? 0, currency)}/day, and add progress on Savings Goals when you can spare money.`;
  }

  return `Based on the budget details you've added:\n${contextText}\n\nAsk something specific like “Where did I overspend?” or “Can I spend 500 on shoes?”`;
}

async function callOpenAI(system: string, userMessage: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 400,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content?.trim() || null;
}

async function callGemini(system: string, userMessage: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.0-flash"}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${system}\n\nUser question: ${userMessage}` }],
          },
        ],
        generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
      }),
    }
  );

  if (!res.ok) return null;
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

export async function askMoneyCoach(
  userId: string,
  message: string
): Promise<AiCoachReply> {
  const profile = await getProfileForUser(userId);
  const mode: PersonalityMode = profile?.personalityMode ?? "PROFESSIONAL";
  const assistant = getMoneyAssistantCopy(mode);

  if (isMoneyCoachOutOfScope(message)) {
    return {
      reply: assistant.scopeOut,
      provider: "scope",
      outOfScope: true,
    };
  }

  const { summary, text } = await buildContext(userId);
  const explanationLang = profile?.preferredExplanationLang || "English";
  const system = `You are ${assistant.name} inside StudentLife AI — a student budgeting companion.
Use ONLY the provided budget context (details the student added: pocket money, expenses, budgets, goals).
Be concise and practical. Do not invent bank balances, credit data, or market data.
If asked about banking products, investing, trading, credit, loans, or tax advice, briefly say that is outside your scope and steer back to student budgeting.
Do not claim to monitor accounts or access information the student did not add.
Do not append long legal disclaimers to every reply.
LANGUAGE RULE (mandatory): Reply in ${explanationLang} unless the student explicitly asks for another language. Personality controls tone only; do not fall back to English just because the tone is casual. Keep terms like XP, CGPA, and currency codes natural.

User budget context:
${text}`;

  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();
  let reply: string | null = null;
  let used: AiCoachReply["provider"] = "rules";

  if (provider === "gemini") {
    reply = await callGemini(system, message);
    if (reply) used = "gemini";
  } else {
    reply = await callOpenAI(system, message);
    if (reply) used = "openai";
  }

  if (!reply) {
    reply = rulesReply(message, text, summary);
    used = "rules";
  }

  return { reply, provider: used, outOfScope: false };
}
