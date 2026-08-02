import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const columns = [
  {
    title: "Product",
    links: [
      { href: "#product", label: "Money Dashboard" },
      { href: "#expenses", label: "Expenses" },
      { href: "#goals", label: "Savings Goals" },
      { href: "#afford", label: "Can I Afford It?" },
      { href: "#health", label: "Financial Health" },
    ],
  },
  {
    title: "Budget Tools",
    links: [
      { href: "#pocket-money", label: "Pocket Money Mode" },
      { href: "#safe-spend", label: "Safe Daily Spend" },
      { href: "#coach", label: "AI Money Coach" },
      { href: "#reports", label: "Reports" },
    ],
  },
  {
    title: "Student Tools",
    links: [
      { href: "#academics", label: "Subjects & notes" },
      { href: "#academics", label: "Assignments" },
      { href: "#academics", label: "Timetable" },
      { href: "#academics", label: "Exams" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#problems", label: "About" },
      { href: "mailto:hello@studentlife.ai", label: "Contact" },
      { href: "#", label: "Privacy" },
      { href: "#", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container-shell py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2.4fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-secondary">
              AI-powered financial management for students — with academic tools
              when you need them.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="text-sm font-semibold text-foreground">
                  {column.title}
                </p>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-sm text-secondary hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-muted">
          © {new Date().getFullYear()} StudentLife AI. Budgeting tools only — not a
          bank, lender, or investment platform.
        </div>
      </div>
    </footer>
  );
}
