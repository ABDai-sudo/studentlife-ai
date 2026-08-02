import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Brain,
  Calculator,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  NotebookPen,
  PiggyBank,
  Settings,
  Target,
  TrendingUp,
  UserRound,
  Wallet,
  WalletCards,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
};

export const appNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", hint: "Money first", icon: LayoutDashboard },
  { href: "/dashboard/money", label: "Money Dashboard", hint: "Month survival", icon: Wallet },
  { href: "/dashboard/expenses", label: "Expenses", hint: "Log spending", icon: WalletCards },
  { href: "/dashboard/budget", label: "Budget", hint: "Pocket money plan", icon: PiggyBank },
  { href: "/dashboard/ai-coach", label: "AI Money Coach", hint: "Spending help", icon: Brain },
  { href: "/dashboard/goals", label: "Savings Goals", hint: "Dream purchases", icon: Target },
  { href: "/dashboard/afford", label: "Can I Afford It?", hint: "Check a buy", icon: Calculator },
  { href: "/dashboard/reports", label: "Reports", hint: "Weekly & monthly", icon: ChartColumn },
  { href: "/dashboard/subjects", label: "Subjects", hint: "Classes", icon: BookOpen },
  { href: "/dashboard/notes", label: "Notes", hint: "Study notes", icon: NotebookPen },
  { href: "/dashboard/assignments", label: "Assignments", hint: "Deadlines", icon: ClipboardList },
  { href: "/dashboard/timetable", label: "Timetable", hint: "Schedule", icon: CalendarDays },
  { href: "/dashboard/exams", label: "Exams", hint: "Exam dates", icon: GraduationCap },
  { href: "/dashboard/progress", label: "Progress", hint: "Academics", icon: TrendingUp },
  { href: "/dashboard/profile", label: "Profile", hint: "Your details", icon: UserRound },
  { href: "/settings", label: "Settings", hint: "Account", icon: Settings },
];
