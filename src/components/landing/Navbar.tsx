"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

type MenuLink = { href: string; label: string };

const productLinks: MenuLink[] = [
  { href: "#product", label: "Product overview" },
  { href: "#ai-tutor", label: "AI Tutor" },
  { href: "#assignments", label: "Assignment Helper" },
  { href: "#exam-prep", label: "Exam Prep" },
  { href: "#games", label: "Games & Streaks" },
  { href: "#budget", label: "Student Budget" },
];

const aiTutorLinks: MenuLink[] = [
  { href: "#ai-tutor", label: "Ask Anything" },
  { href: "#ai-tutor", label: "Explain Notes" },
  { href: "#assignments", label: "Upload a Question" },
  { href: "#ai-tutor", label: "Create Study Plan" },
];

const examPrepLinks: MenuLink[] = [
  { href: "#exam-prep", label: "Question Generator" },
  { href: "#exam-prep", label: "Mock Tests" },
  { href: "#games", label: "Quiz Rush" },
  { href: "#exam-prep", label: "Viva Practice" },
];

const budgetLinks: MenuLink[] = [
  { href: "#budget", label: "Money Dashboard" },
  { href: "#budget", label: "Expenses" },
  { href: "#budget", label: "Safe Daily Spend" },
  { href: "#budget", label: "Savings Goals" },
  { href: "#budget", label: "AI Money Coach" },
];

type OpenMenu = "product" | "tutor" | "exam" | "budget" | null;

function subscribeScroll(onStoreChange: () => void) {
  window.addEventListener("scroll", onStoreChange, { passive: true });
  return () => window.removeEventListener("scroll", onStoreChange);
}

function getScrollSnapshot() {
  return window.scrollY > 8;
}

function getServerScrollSnapshot() {
  return false;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    getScrollSnapshot,
    getServerScrollSnapshot
  );
  const [menu, setMenu] = useState<OpenMenu>(null);
  const navRef = useRef<HTMLDivElement>(null);

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
          ? "border-border bg-surface"
          : "border-transparent bg-background"
      }`}
    >
      <nav className="container-shell flex h-16 items-center justify-between gap-3">
        <Logo />

        <div className="hidden items-center gap-0.5 xl:flex" ref={navRef}>
          <NavDropdown
            label="Product"
            open={menu === "product"}
            onToggle={() => toggle("product")}
            links={productLinks}
            onPick={() => setMenu(null)}
          />
          <NavDropdown
            label="AI Tutor"
            open={menu === "tutor"}
            onToggle={() => toggle("tutor")}
            links={aiTutorLinks}
            onPick={() => setMenu(null)}
          />
          <a
            href="#assignments"
            className="rounded-lg px-2.5 py-2 text-sm font-medium text-secondary hover:bg-surface-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Assignments
          </a>
          <NavDropdown
            label="Exam Prep"
            open={menu === "exam"}
            onToggle={() => toggle("exam")}
            links={examPrepLinks}
            onPick={() => setMenu(null)}
          />
          <a
            href="#games"
            className="rounded-lg px-2.5 py-2 text-sm font-medium text-secondary hover:bg-surface-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Games & Streaks
          </a>
          <NavDropdown
            label="Budget"
            open={menu === "budget"}
            onToggle={() => toggle("budget")}
            links={budgetLinks}
            onPick={() => setMenu(null)}
          />
          <a
            href="#pricing"
            className="rounded-lg px-2.5 py-2 text-sm font-medium text-secondary hover:bg-surface-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Pricing
          </a>
          <Link
            href="/support"
            className="rounded-lg px-2.5 py-2 text-sm font-medium text-secondary hover:bg-surface-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Resources
          </Link>
        </div>

        <div className="hidden items-center gap-2 xl:flex">
          <Button href="/login" variant="ghost" size="sm">
            Log in
          </Button>
          <Button href="/signup" size="sm">
            Create account
          </Button>
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <Button href="/signup" size="sm">
            Create account
          </Button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition-colors hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div
          id="mobile-nav"
          className="max-h-[min(80vh,32rem)] overflow-y-auto border-t border-border bg-surface xl:hidden"
        >
          <div className="container-shell space-y-4 py-4">
            <MobileGroup title="Product" links={productLinks} onPick={() => setOpen(false)} />
            <MobileGroup title="AI Tutor" links={aiTutorLinks} onPick={() => setOpen(false)} />
            <a
              href="#assignments"
              className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-surface-secondary"
              onClick={() => setOpen(false)}
            >
              Assignments
            </a>
            <MobileGroup title="Exam Prep" links={examPrepLinks} onPick={() => setOpen(false)} />
            <a
              href="#games"
              className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-surface-secondary"
              onClick={() => setOpen(false)}
            >
              Games & Streaks
            </a>
            <MobileGroup title="Budget" links={budgetLinks} onPick={() => setOpen(false)} />
            <a
              href="#pricing"
              className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-surface-secondary"
              onClick={() => setOpen(false)}
            >
              Pricing
            </a>
            <Link
              href="/support"
              className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-surface-secondary"
              onClick={() => setOpen(false)}
            >
              Resources
            </Link>
            <div className="grid gap-2 border-t border-border pt-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border text-sm font-semibold transition-colors hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Create account
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
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-secondary hover:bg-surface-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-expanded={open}
        onClick={onToggle}
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-md">
          {links.map((link) => (
            <a
              key={`${label}-${link.label}`}
              href={link.href}
              className="block rounded-lg px-3 py-2 text-sm text-secondary hover:bg-surface-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
