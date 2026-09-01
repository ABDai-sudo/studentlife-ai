import { COMPANY } from "@/lib/company";
import { LegalShell } from "@/components/legal/LegalShell";

export default function PrivacyPage() {
  return (
        <LegalShell title="Privacy" subtitle={`${COMPANY.productName} · Data practices`}>
      <p>
        {COMPANY.productName} is made by {COMPANY.legalName}. We build student
        budgeting and study tools — not a bank, lender, credit, or investment
        service.
      </p>

      <h2 className="text-base font-semibold text-foreground">What we store</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Account details (name, email, password hash)</li>
        <li>Money data you enter (pocket money, expenses, budgets, goals)</li>
        <li>Study data you enter (classes, notes, homework, exams)</li>
        <li>Basic product analytics to fix bugs and improve the app</li>
      </ul>

      <h2 className="text-base font-semibold text-foreground">What we do not do</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>We do not sell your personal data</li>
        <li>We do not access your bank account</li>
        <li>We do not offer loans, credit cards, or investment products</li>
      </ul>

      <h2 className="text-base font-semibold text-foreground">Your control</h2>
      <p>
        You can update profile settings in the app. For account help or data
        questions, email{" "}
        <a
          href={`mailto:${COMPANY.supportEmail}`}
          className="font-medium text-primary hover:underline"
        >
          {COMPANY.supportEmail}
        </a>
        .
      </p>

      <p className="text-xs text-muted">
        Last updated: August 2026 · {COMPANY.legalName}
      </p>
    </LegalShell>
  );
}
