"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

type MenuLink = { href: string; label: string };

const productLinks: MenuLink[] = [
  { href: "#product", label: "Financial Dashboard" },
  { href: "#expenses", label: "Expense Tracker" },
  { href: "#goals", label: "Savings Goals" },
  { href: "#health", label: "Financial Health" },
  { href: "#academics", label: "Student Workspace" },
];

const coachLinks: MenuLink[] = [
  { href: "#coach", label: "Spending Insights" },
  { href: "#safe-spend", label: "Safe Daily Budget" },
  { href: "#afford", label: "Can I Afford It?" },
  { href: "#goals", label: "Goal Planning" },
  { href: "#reports", label: "Monthly Review" },
];

const budgetLinks: MenuLink[] = [
  { href: "#pocket-money", label: "Monthly Budget" },
  { href: "#pocket-money", label: "Pocket Money Mode" },
  { href: "#expenses", label: "Expense Categories" },
  { href: "#reports", label: "Subscription Tracker" },
  { href: "#goals", label: "Emergency Fund" },
];

const studentLinks: MenuLink[] = [
  { href: "#academics", label: "Subjects" },
  { href: "#academics", label: "Notes" },
  { href: "#academics", label: "Assignments" },
  { href: "#academics", label: "Timetable" },
  { href: "#academics", label: "Exams" },
  { href: "#academics", label: "Attendance" },
];

type OpenMenu = "product" | "coach" | "budget" | "student" | null;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState<OpenMenu>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setMenu(null);
      }
    }
    function onClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, []);

  function toggle(next: OpenMenu) {
    setMenu((current) => (current === next ? null : next));
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        scrolled
          ? "border-border bg-surface/90 backdrop-blur-xl"
          : "border-transparent bg-surface/70 backdrop-blur-md"
      }`}
    >
      <nav className="container-shell flex h-16 items-center justify-between">
        <Logo />

        <div className="hidden items-center gap-1 lg:flex" ref={navRef}>
          <NavDropdown
            label="Product"
            open={menu === "product"}
            onToggle={() => toggle("product")}
            links={productLinks}
            onPick={() => setMenu(null)}
          />
          <NavDropdown
            label="AI Money Coach"
            open={menu === "coach"}
            onToggle={() => toggle("coach")}
            links={coachLinks}
            onPick={() => setMenu(null)}
          />
          <NavDropdown
            label="Budget Tools"
            open={menu === "budget"}
            onToggle={() => toggle("budget")}
            links={budgetLinks}
            onPick={() => setMenu(null)}
          />
          <NavDropdown
            label="Student Tools"
            open={menu === "student"}
            onToggle={() => toggle("student")}
            links={studentLinks}
            onPick={() => setMenu(null)}
          />
          <a
            href="#pricing"
            className="rounded-lg px-3 py-2 text-sm font-medium text-secondary hover:bg-surface-secondary hover:text-foreground"
          >
            Pricing
          </a>
          <a
            href="#problems"
            className="rounded-lg px-3 py-2 text-sm font-medium text-secondary hover:bg-surface-secondary hover:text-foreground"
          >
            Resources
          </a>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Button href="/login" variant="ghost" size="sm">
            Log in
          </Button>
          <Button href="/signup" size="sm">
            Start free
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </nav>

      {open ? (
        <div
          id="mobile-nav"
          className="max-h-[80vh] overflow-y-auto border-t border-border bg-surface lg:hidden"
        >
          <div className="container-shell space-y-4 py-4">
            <MobileGroup title="Product" links={productLinks} onPick={() => setOpen(false)} />
            <MobileGroup title="AI Money Coach" links={coachLinks} onPick={() => setOpen(false)} />
            <MobileGroup title="Budget Tools" links={budgetLinks} onPick={() => setOpen(false)} />
            <MobileGroup title="Student Tools" links={studentLinks} onPick={() => setOpen(false)} />
            <a
              href="#pricing"
              className="block rounded-lg px-3 py-2.5 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              Pricing
            </a>
            <a
              href="#problems"
              className="block rounded-lg px-3 py-2.5 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              Resources
            </a>
            <div className="grid gap-2 border-t border-border pt-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-border text-sm font-semibold"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white"
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function NavDropdown({
  label,
  open,
  onToggle,
  links,
  onPick,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  links: MenuLink[];
  onPick: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-secondary hover:bg-surface-secondary hover:text-foreground"
        aria-expanded={open}
        onClick={onToggle}
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-md">
          {links.map((link) => (
            <a
              key={`${label}-${link.label}`}
              href={link.href}
              className="block rounded-lg px-3 py-2 text-sm text-secondary hover:bg-surface-secondary hover:text-foreground"
              onClick={onPick}
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MobileGroup({
  title,
  links,
  onPick,
}: {
  title: string;
  links: MenuLink[];
  onPick: () => void;
}) {
  return (
    <div>
      <p className="px-3 text-xs font-semibold text-muted">{title}</p>
      <div className="mt-1 space-y-0.5">
        {links.map((link) => (
          <a
            key={`${title}-${link.label}`}
            href={link.href}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-secondary"
            onClick={onPick}
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
