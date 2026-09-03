import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calculator,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  CircleDollarSign,
  Compass,
  FileQuestion,
  GraduationCap,
  LayoutDashboard,
  MessagesSquare,
  NotebookPen,
  MessageCircle,
  PenLine,
  Settings,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  UserPlus,
  UserRound,
  Users,
  Wallet,
  WalletCards,
  AlertTriangle,
} from "lucide-react";
import type { MessageKey } from "@/lib/i18n/dictionaries/en";

export type NavItem = {
  href: string;
  /** Stable i18n key for the nav label */
  i18nKey: MessageKey;
  /** Optional hint under the label */
  hintKey?: MessageKey;
  icon: LucideIcon;
  section?: "main" | "money" | "account";
  /** Hide this item unless the named server feature flag is on. */
  feature?: "campusCircle";
};

export const appNav: NavItem[] = [
  {
    href: "/dashboard",
    i18nKey: "nav.overview",
    hintKey: "nav.hint.home",
    icon: LayoutDashboard,
    section: "main",
  },
  {
    href: "/dashboard/ai-tutor",
    i18nKey: "nav.studyTutor",
    hintKey: "nav.hint.askAnything",
    icon: MessageCircle,
    section: "main",
  },
  {
    href: "/dashboard/study-buddy",
    i18nKey: "nav.studyBuddy",
    hintKey: "nav.hint.studyBuddy",
    icon: Compass,
    section: "main",
  },
  {
    href: "/dashboard/games",
    i18nKey: "nav.games",
    hintKey: "nav.hint.games",
    icon: Timer,
    section: "main",
  },
  {
    href: "/dashboard/leaderboard",
    i18nKey: "nav.leaderboard",
    hintKey: "nav.hint.leaderboard",
    icon: Trophy,
    section: "main",
  },
  {
    href: "/dashboard/subjects",
    i18nKey: "nav.subjects",
    hintKey: "nav.hint.classes",
    icon: BookOpen,
    section: "main",
  },
  {
    href: "/dashboard/notes",
    i18nKey: "nav.notes",
    hintKey: "nav.hint.studyNotes",
    icon: NotebookPen,
    section: "main",
  },
  {
    href: "/dashboard/assignments",
    i18nKey: "nav.assignments",
    hintKey: "nav.hint.deadlines",
    icon: ClipboardList,
    section: "main",
  },
  {
    href: "/dashboard/assignment-helper",
    i18nKey: "nav.assignmentHelper",
    hintKey: "nav.hint.guidedDrafts",
    icon: PenLine,
    section: "main",
  },
  {
    href: "/dashboard/exam-prep",
    i18nKey: "nav.examPrep",
    hintKey: "nav.hint.revisionHub",
    icon: GraduationCap,
    section: "main",
  },
  {
    href: "/dashboard/question-generator",
    i18nKey: "nav.questionGenerator",
    hintKey: "nav.hint.papersQuizzes",
    icon: FileQuestion,
    section: "main",
  },
  {
    href: "/dashboard/timetable",
    i18nKey: "nav.timetable",
    hintKey: "nav.hint.schedule",
    icon: CalendarDays,
    section: "main",
  },
  {
    href: "/dashboard/emergency",
    i18nKey: "nav.emergency",
    hintKey: "nav.hint.imCooked",
    icon: AlertTriangle,
    section: "main",
  },
  {
    href: "/dashboard/progress",
    i18nKey: "nav.progress",
    hintKey: "nav.hint.xpStreaks",
    icon: TrendingUp,
    section: "main",
  },
  {
    href: "/dashboard/class-hub",
    i18nKey: "nav.classHub",
    hintKey: "nav.hint.optional",
    icon: Users,
    section: "main",
  },
  {
    href: "/dashboard/campus-circle",
    i18nKey: "nav.campusCircle",
    hintKey: "nav.hint.campusCircle",
    icon: UserPlus,
    section: "main",
    feature: "campusCircle",
  },
  {
    href: "/dashboard/money",
    i18nKey: "nav.moneyDashboard",
    hintKey: "nav.hint.monthSurvival",
    icon: Wallet,
    section: "money",
  },
  {
    href: "/dashboard/expenses",
    i18nKey: "nav.expenses",
    hintKey: "nav.hint.logSpending",
    icon: WalletCards,
    section: "money",
  },
  {
    href: "/dashboard/budget",
    i18nKey: "nav.budget",
    hintKey: "nav.hint.pocketMoney",
    icon: CircleDollarSign,
    section: "money",
  },
  {
    href: "/dashboard/ai-coach",
    i18nKey: "nav.moneyCoach",
    hintKey: "nav.hint.spendingHelp",
    icon: MessagesSquare,
    section: "money",
  },
  {
    href: "/dashboard/goals",
    i18nKey: "nav.goals",
    hintKey: "nav.hint.dreamPurchases",
    icon: Target,
    section: "money",
  },
  {
    href: "/dashboard/afford",
    i18nKey: "nav.afford",
    hintKey: "nav.hint.checkABuy",
    icon: Calculator,
    section: "money",
  },
  {
    href: "/dashboard/reports",
    i18nKey: "nav.reports",
    hintKey: "nav.hint.weeklyMonthly",
    icon: ChartColumn,
    section: "money",
  },
  {
    href: "/dashboard/profile",
    i18nKey: "nav.profile",
    hintKey: "nav.hint.languageCollege",
    icon: UserRound,
    section: "account",
  },
  {
    href: "/settings",
    i18nKey: "nav.settings",
    hintKey: "nav.hint.personalityTheme",
    icon: Settings,
    section: "account",
  },
];
