import type { PersonalityMode } from "./types";

export type NavCopyKey =
  | "dashboard"
  | "aiTutor"
  | "subjects"
  | "notes"
  | "assignments"
  | "examPrep"
  | "questionGenerator"
  | "timetable"
  | "budget"
  | "progress"
  | "classHub"
  | "profile"
  | "settings"
  | "moneyDashboard"
  | "expenses"
  | "moneyCoach"
  | "goals"
  | "afford"
  | "reports";

export type MoneyAssistantQuickAction = {
  id: string;
  label: string;
  /** Chat prompt sent to the coach when clicked */
  prompt?: string;
  /** In-app route when the action should navigate instead of chatting */
  href?: string;
};

export type MoneyAssistantCopy = {
  /** Assistant display name for this personality */
  name: string;
  /** Short tagline under the name */
  tagline: string;
  /** CTA to open / ask the assistant */
  askCta: string;
  /** Welcoming page subtitle (not a legal disclaimer banner) */
  subtitle: string;
  /** Opening chat line — based only on details the student added */
  welcome: string;
  /** Budget page helper line */
  budgetHint: string;
  /** Reply when banking / investing / credit / tax is asked */
  scopeOut: string;
};

export type PersonalityCopy = {
  nav: Record<NavCopyKey, string>;
  greetings: {
    tutorHome: string;
    dashboard: string;
  };
  emptyStates: {
    noTasks: string;
    noNotes: string;
    noConversations: string;
  };
  streaks: {
    dayN: string;
    comeback: string;
    /** Today already secured */
    secured: string;
    /** Streak > 0, today incomplete */
    maintain: string;
    /** No streak yet */
    start: string;
    /** At-risk notification body template — use {n} for days */
    atRisk: string;
  };
  deadlines: {
    dueSoon: string;
    dueTomorrow: string;
  };
  budget: {
    overspendWarn: string;
  };
  moneyAssistant: MoneyAssistantCopy;
  appearance: {
    sectionTitle: string;
    light: string;
    dark: string;
    system: string;
    hint: string;
  };
  quests: {
    completed: string;
  };
  emergency: {
    buttonLabel: string;
    title: string;
  };
  achievements: {
    unlock: string;
  };
};

/** Shared recovery chips after an out-of-scope money question. */
export const moneyAssistantQuickActions: MoneyAssistantQuickAction[] = [
  {
    id: "safe-daily",
    label: "Check My Safe Daily Spend",
    prompt: "What is my safe daily spend?",
  },
  {
    id: "review-expenses",
    label: "Review My Expenses",
    href: "/dashboard/expenses",
  },
  {
    id: "savings-goal",
    label: "Plan a savings goal",
    href: "/dashboard/goals",
  },
  {
    id: "afford",
    label: "Can I Afford This?",
    href: "/dashboard/afford",
  },
  {
    id: "reduce-spend",
    label: "Reduce spending",
    prompt: "Help me reduce my spending this month.",
  },
  {
    id: "monthly-budget",
    label: "Create a monthly budget",
    href: "/dashboard/budget",
  },
];

/** Privacy, security, account deletion, and errors — always professional. */
export const seriousCopy = {
  privacyTitle: "Privacy",
  privacyBody:
    "We protect your personal data and only use it to provide StudentLife AI services.",
  securityTitle: "Security",
  securityBody:
    "Keep your password private. Sign out on shared devices when you are finished.",
  deleteAccountTitle: "Delete account",
  deleteAccountBody:
    "This permanently removes your account and associated data. This action cannot be undone.",
  deleteAccountConfirm: "Type DELETE to confirm account deletion.",
  errorGeneric: "Something went wrong. Please try again.",
  errorNetwork: "Unable to reach the server. Check your connection and retry.",
  errorUnauthorized: "Your session has expired. Please sign in again.",
  errorForbidden: "You do not have permission to perform this action.",
  errorNotFound: "The requested resource could not be found.",
  errorValidation: "Please check your input and try again.",
  /** Product-scope note for Help / FAQ / Terms — not for normal chat UI */
  moneyAssistantLimitation:
    "StudentLife AI is a student budgeting tool based on details you add. It is not a bank, lender, credit bureau, or investment adviser.",
} as const;

const professional: PersonalityCopy = {
  nav: {
    dashboard: "Overview",
    aiTutor: "Study Tutor",
    subjects: "Subjects",
    notes: "Notes",
    assignments: "Assignments",
    examPrep: "Exam Prep",
    questionGenerator: "Question Generator",
    timetable: "Timetable",
    budget: "Budget",
    progress: "Progress",
    classHub: "Class Hub",
    profile: "Profile",
    settings: "Settings",
    moneyDashboard: "Money Dashboard",
    expenses: "Expenses",
    moneyCoach: "AI Money Coach",
    goals: "Savings Goals",
    afford: "Can I Afford It?",
    reports: "Reports",
  },
  greetings: {
    tutorHome: "Ready to study. What would you like to work on?",
    dashboard: "Welcome back. Here is your plan for today.",
  },
  emptyStates: {
    noTasks: "No tasks yet. Add one to get started.",
    noNotes: "No notes yet. Create your first note.",
    noConversations: "No conversations yet. Ask your first question.",
  },
  streaks: {
    dayN: "Day {n} streak",
    comeback: "Welcome back. Your streak restarts today.",
    secured: "Today's streak is complete.",
    maintain: "Complete one meaningful activity today to maintain your streak.",
    start: "Complete one meaningful activity today to start your streak.",
    atRisk: "Your {n}-day streak is still incomplete today.",
  },
  deadlines: {
    dueSoon: "Due soon",
    dueTomorrow: "Due tomorrow",
  },
  budget: {
    overspendWarn: "You are over budget in this category.",
  },
  moneyAssistant: {
    name: "AI Money Coach",
    tagline: "Personal budgeting guidance",
    askCta: "Ask Money Coach",
    subtitle: "Everyday guidance for spending, savings, and student budgets.",
    welcome:
      "I’ll base suggestions on the budget details you’ve added. Ask about safe daily spend, expenses, or a purchase.",
    budgetHint: "Set category budgets and track where your money goes.",
    scopeOut:
      "That’s outside the Money Coach’s scope. I can help with your student budget, expenses, savings goals, safe daily spending, and whether a purchase fits your plan.",
  },
  appearance: {
    sectionTitle: "Appearance",
    light: "Light",
    dark: "Dark",
    system: "Use device setting",
    hint: "Choose Light, Dark, or follow your device. Personality tone stays separate.",
  },
  quests: {
    completed: "Quest completed.",
  },
  emergency: {
    buttonLabel: "Create a catch-up plan",
    title: "Catch-up study plan",
  },
  achievements: {
    unlock: "Achievement unlocked",
  },
};

const friendly: PersonalityCopy = {
  nav: {
    dashboard: "Home",
    aiTutor: "Study Buddy",
    subjects: "My Classes",
    notes: "Notes",
    assignments: "Homework",
    examPrep: "Exam Prep",
    questionGenerator: "Practice Qs",
    timetable: "Schedule",
    budget: "Budget",
    progress: "Progress",
    classHub: "Class Hub",
    profile: "You",
    settings: "Settings",
    moneyDashboard: "Money Home",
    expenses: "Spending",
    moneyCoach: "Money Buddy",
    goals: "Goals",
    afford: "Can I Buy It?",
    reports: "Reports",
  },
  greetings: {
    tutorHome: "Hey! Ready when you are — what are we tackling?",
    dashboard: "Hey there! Here's a friendly look at your day.",
  },
  emptyStates: {
    noTasks: "Nothing on the list yet — add a task whenever you're ready.",
    noNotes: "Your notes are empty. Capture an idea when it hits!",
    noConversations: "No chats yet. Say hi and ask anything.",
  },
  streaks: {
    dayN: "Day {n} — nice work!",
    comeback: "Missed you! Let's rebuild that streak together.",
    secured: "Today is secured — nice work.",
    maintain: "One useful study action keeps your streak going.",
    start: "One useful study action starts your streak.",
    atRisk: "You still have time to keep your {n}-day streak going.",
  },
  deadlines: {
    dueSoon: "Coming up soon",
    dueTomorrow: "Due tomorrow — you've got this",
  },
  budget: {
    overspendWarn: "Heads up — this category is over budget.",
  },
  moneyAssistant: {
    name: "Money Buddy",
    tagline: "Friendly budget guidance",
    askCta: "Ask Your Money Buddy",
    subtitle: "Friendly help for your spending, savings, and goals.",
    welcome:
      "I’ll use the budget details you added to make the answer more useful. Ask about spending, savings, or a purchase anytime.",
    budgetHint: "Plan your spending and keep your goals on track.",
    scopeOut:
      "I’m best at helping with everyday spending, savings, expenses, and money goals. Tell me what you’re trying to afford, and we can plan it together.",
  },
  appearance: {
    sectionTitle: "App appearance",
    light: "Light",
    dark: "Dark",
    system: "Match my device",
    hint: "Pick a look that feels comfortable. Your personality setting stays the same.",
  },
  quests: {
    completed: "Nice! Quest done.",
  },
  emergency: {
    buttonLabel: "I need help",
    title: "We're here for you",
  },
  achievements: {
    unlock: "You unlocked an achievement!",
  },
};

const campusBro: PersonalityCopy = {
  nav: {
    dashboard: "The Hub",
    aiTutor: "Tutor Bro",
    subjects: "Classes",
    notes: "Notes Dump",
    assignments: "Homework",
    examPrep: "Exam Grind",
    questionGenerator: "Practice Hits",
    timetable: "When & Where",
    budget: "Budget",
    progress: "Stats",
    classHub: "Squad Hub",
    profile: "My Profile",
    settings: "Settings",
    moneyDashboard: "Cash Check",
    expenses: "Spend Log",
    moneyCoach: "Budget Bro",
    goals: "Save Goals",
    afford: "Can I Ball?",
    reports: "Money Recap",
  },
  greetings: {
    tutorHome: "Yo — lock in. What are we cooking today?",
    dashboard: "What's good? Here's the game plan.",
  },
  emptyStates: {
    noTasks: "Task list is empty, king. Drop one in.",
    noNotes: "No notes yet. Dump the tea when you're ready.",
    noConversations: "Chat's cold. Fire the first question.",
  },
  streaks: {
    dayN: "Day {n} streak — we stay winning",
    comeback: "Back on campus energy. Streak resets — let's go.",
    secured: "Today's streak is locked in.",
    maintain: "Do one solid study mission and the streak survives.",
    start: "One solid study mission starts the streak.",
    atRisk: "{n} days on the line. One study mission saves it.",
  },
  deadlines: {
    dueSoon: "Due soon, no cap",
    dueTomorrow: "Due tomorrow — lock in",
  },
  budget: {
    overspendWarn: "Bro… this category is cooked. Over budget.",
  },
  moneyAssistant: {
    name: "Budget Bro",
    tagline: "Pocket-money backup",
    askCta: "Ask Budget Bro",
    subtitle: "Your backup for budgets, expenses, and money goals.",
    welcome:
      "I’ll check the budget you added and help plan the next move. Safe daily spend, expenses, purchases — hit me.",
    budgetHint: "Set the budget before the budget sets you.",
    scopeOut:
      "That’s outside Budget Bro’s lane. I can still help control spending, protect savings, or check whether a purchase fits this month.",
  },
  appearance: {
    sectionTitle: "Look",
    light: "Light",
    dark: "Dark",
    system: "Match my device",
    hint: "Light, dark, or match your phone. Tone and theme stay separate.",
  },
  quests: {
    completed: "Quest cleared. Huge W.",
  },
  emergency: {
    buttonLabel: "SOS — help",
    title: "Emergency lane",
  },
  achievements: {
    unlock: "Achievement unlocked. Absolute cinema.",
  },
};

const chronicallyOnline: PersonalityCopy = {
  nav: {
    dashboard: "Main Feed",
    aiTutor: "Tutor.exe",
    subjects: "Classes",
    notes: "Notes.md",
    assignments: "Homework Queue",
    examPrep: "Boss Fight Prep",
    questionGenerator: "RNG Questions",
    timetable: "Calendar.exe",
    budget: "Budget",
    progress: "XP Tracker",
    classHub: "Server Hub",
    profile: "User Profile",
    settings: "Settings",
    moneyDashboard: "Wallet HUD",
    expenses: "Spend Log",
    moneyCoach: "Wallet Buddy",
    goals: "Side Quests",
    afford: "Purchase Check",
    reports: "Analytics",
  },
  greetings: {
    tutorHome: "booting tutor mode… what do we grind?",
    dashboard: "you're online. here's today's patch notes.",
  },
  emptyStates: {
    noTasks: "0 tasks in queue. spawn one?",
    noNotes: "notes folder empty. write something lore-worthy.",
    noConversations: "no threads yet. start the chat.",
  },
  streaks: {
    dayN: "day {n} streak — touch grass later",
    comeback: "afk ended. streak reset. we rebuild.",
    secured: "Today secured. Streak lives.",
    maintain: "Your streak is still alive. Lock in before midnight.",
    start: "Plot twist available: start today's streak with one mission.",
    atRisk: "Your {n}-day streak is fighting for its life. Lock in.",
  },
  deadlines: {
    dueSoon: "timer low — due soon",
    dueTomorrow: "due tomorrow. clutch or crash.",
  },
  budget: {
    overspendWarn: "budget HP critical in this category.",
  },
  moneyAssistant: {
    name: "Wallet Buddy",
    tagline: "Your pocket-money sidekick",
    askCta: "Ask Your Wallet Buddy",
    subtitle: "Helping your wallet survive the month.",
    welcome:
      "I’ll use your saved budget to help your wallet survive the month. Drop a question about spend, savings, or a purchase.",
    budgetHint: "Give every rupee a job before it mysteriously disappears.",
    scopeOut:
      "That’s outside Wallet Buddy’s lane. I can still help your wallet survive with spending limits, savings goals, expense checks, and purchase planning.",
  },
  appearance: {
    sectionTitle: "Choose the vibe",
    light: "Light mode",
    dark: "Dark mode",
    system: "Let my device decide",
    hint: "Theme pick only — personality wording stays on its own setting.",
  },
  quests: {
    completed: "quest complete. +loot vibes.",
  },
  emergency: {
    buttonLabel: "panic button",
    title: "emergency protocol",
  },
  achievements: {
    unlock: "achievement get!",
  },
};

const academicVillain: PersonalityCopy = {
  nav: {
    dashboard: "Command Center",
    aiTutor: "Dark Tutor",
    subjects: "Domains",
    notes: "Archives",
    assignments: "Contracts",
    examPrep: "Exam Dominion",
    questionGenerator: "Trial Forge",
    timetable: "War Calendar",
    budget: "Treasury",
    progress: "Dominance",
    classHub: "Council",
    profile: "Identity",
    settings: "Settings",
    moneyDashboard: "Treasury Overview",
    expenses: "Outflows",
    moneyCoach: "Financial Strategist",
    goals: "Ambitions",
    afford: "Worth the Cost?",
    reports: "Intelligence",
  },
  greetings: {
    tutorHome: "Excellent. Another mind to sharpen. State your challenge.",
    dashboard: "The board is set. Review your moves for today.",
  },
  emptyStates: {
    noTasks: "No conquests queued. Issue your first decree.",
    noNotes: "The archives are empty. Record your schemes.",
    noConversations: "Silence. Begin your interrogation of the tutor.",
  },
  streaks: {
    dayN: "Day {n} of unbroken rule",
    comeback: "You return. The streak was a setback — not a surrender.",
    secured: "Today's objective is complete. The streak holds.",
    maintain: "Protect the streak. Complete today's objective.",
    start: "Begin the streak. Complete today's objective.",
    atRisk: "{n} days of consistency are at risk. Complete the objective.",
  },
  deadlines: {
    dueSoon: "Deadline approaches",
    dueTomorrow: "Due tomorrow — no mercy for delay",
  },
  budget: {
    overspendWarn: "The treasury bleeds. This category is over budget.",
  },
  moneyAssistant: {
    name: "Financial Strategist",
    tagline: "Strategic spending guidance",
    askCta: "Consult the Strategist",
    subtitle: "Strategic control over spending, savings, and financial goals.",
    welcome:
      "I’ll analyse the budget details you provided and recommend the strongest move. Ask about expenses, savings, or affordability.",
    budgetHint: "Assign every rupee before financial chaos begins.",
    scopeOut:
      "That decision is outside the Financial Strategist’s scope. I can still optimise your expenses, savings targets, affordability, and monthly budget.",
  },
  appearance: {
    sectionTitle: "Appearance",
    light: "Light",
    dark: "Dark",
    system: "Use device setting",
    hint: "Control the interface lighting independently from tone and strategy.",
  },
  quests: {
    completed: "Quest vanquished.",
  },
  emergency: {
    buttonLabel: "Crisis protocol",
    title: "Emergency intervention",
  },
  achievements: {
    unlock: "Trophy claimed",
  },
};

export const copyByMode: Record<PersonalityMode, PersonalityCopy> = {
  PROFESSIONAL: professional,
  FRIENDLY: friendly,
  CAMPUS_BRO: campusBro,
  CHRONICALLY_ONLINE: chronicallyOnline,
  ACADEMIC_VILLAIN: academicVillain,
};
