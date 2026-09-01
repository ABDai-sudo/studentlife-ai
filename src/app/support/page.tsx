import { COMPANY } from "@/lib/company";
import { LegalShell } from "@/components/legal/LegalShell";
import { Button } from "@/components/ui/Button";

export default function SupportPage() {
  return (
    <LegalShell title="Support" subtitle={`${COMPANY.productName} · Help`}>
      <p>
        Need help with login, expenses, or your account? We reply as soon as we
        can — usually within 24 hours on working days.
      </p>

      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-sm font-semibold text-foreground">Email support</p>
        <p className="mt-1 text-sm text-secondary">{COMPANY.supportEmail}</p>
        <Button
          href={`mailto:${COMPANY.supportEmail}?subject=StudentLife%20AI%20support`}
          className="mt-4"
          size="sm"
        >
          Email us
        </Button>
      </div>

      <h2 className="text-base font-semibold text-foreground">Quick tips</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Forgot password? Email support and we will help you reset access.</li>
        <li>Money numbers look wrong? Check pocket money in Profile, then log expenses.</li>
        <li>Money Coach answers use your logged spending — add a few expenses first.</li>
      </ul>

      <h2 className="text-base font-semibold text-foreground">Company</h2>
      <p>
        {COMPANY.productName} is a product of {COMPANY.legalName}. Version{" "}
        {COMPANY.version}.
      </p>
    </LegalShell>
  );
}
