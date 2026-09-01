import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { COMPANY } from "@/lib/company";

const columns = [
  {
    title: "Product",
    links: [
      { href: "#product", label: "Overview" },
      { href: "#ai-tutor", label: "AI Tutor" },
      { href: "#assignments", label: "Assignments" },
      { href: "#exam-prep", label: "Exam Prep" },
      { href: "#games", label: "Games & Streaks" },
    ],
  },
  {
    title: "Study tools",
    links: [
      { href: "#emergency", label: "Emergency Plan" },
      { href: "#personality", label: "Personality Modes" },
      { href: "#recap", label: "Weekly Recap" },
      { href: "#pricing", label: "Pricing" },
    ],
  },
  {
    title: "Budget",
    links: [
      { href: "#budget", label: "Money Dashboard" },
      { href: "#budget", label: "Safe Daily Spend" },
      { href: "#budget", label: "Savings Goals" },
      { href: "#budget", label: "AI Money Coach" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: `mailto:${COMPANY.supportEmail}`, label: "Contact" },
      { href: "/support", label: "Support" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/login", label: "Log in" },
      { href: "/signup", label: "Create a free account" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container-shell py-10">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2.4fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-secondary">
              {COMPANY.tagline}
            </p>
            <p className="mt-3 text-xs text-muted">
              A product of {COMPANY.legalName}
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
                        className="text-sm text-secondary transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
          © {new Date().getFullYear()} {COMPANY.legalName}. {COMPANY.productName}{" "}
          — academic tools and budgeting guidance; not a
          bank, lender, or investment platform.
        </div>
      </div>
    </footer>
  );
}
