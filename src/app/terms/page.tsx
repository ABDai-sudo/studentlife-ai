import { COMPANY } from "@/lib/company";
import { LegalShell } from "@/components/legal/LegalShell";

export default function TermsPage() {
  return (
    <LegalShell title="Terms of use" subtitle={`${COMPANY.productName} · Legal`}>
      <p>
        By using {COMPANY.productName}, you agree to use the app for personal
        student budgeting and study organization only.
      </p>

      <h2 className="text-base font-semibold text-foreground">Service</h2>
      <p>
        We provide software tools based on numbers you enter. Guidance from
        Money Coach or Study Tutor is educational only — not banking, credit,
        tax, legal, or investment advice.
      </p>

      <h2 className="text-base font-semibold text-foreground">Your responsibility</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Keep your password private</li>
        <li>Enter honest expense and school data</li>
        <li>Do not misuse the service or try to harm other users</li>
      </ul>

      <h2 className="text-base font-semibold text-foreground">Accounts</h2>
      <p>
        Free features are available now. Paid Student Pro (full AI) is planned
        and will be announced clearly before any charges.
      </p>

      <h2 className="text-base font-semibold text-foreground">Contact</h2>
      <p>
        Questions:{" "}
        <a
          href={`mailto:${COMPANY.supportEmail}`}
          className="font-medium text-primary hover:underline"
        >
          {COMPANY.supportEmail}
        </a>
      </p>

      <p className="text-xs text-muted">
        Last updated: August 2026 · {COMPANY.legalName}
      </p>
    </LegalShell>
  );
}
