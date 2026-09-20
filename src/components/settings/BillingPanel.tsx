"use client";

import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/LocaleProvider";
import { mountFetch } from "@/lib/react/mount-fetch";

type Snapshot = {
  provider: "none" | "dev" | "stripe";
  configured: boolean;
  plan: string;
  entitled: boolean;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  lastPaymentError: string | null;
  configCode: string | null;
};

export function BillingPanel() {
  const { t } = useT();
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return mountFetch(
      "/api/billing/subscription",
      (result) => {
        const json = result.json as {
          success?: boolean;
          data?: Snapshot;
          error?: { message?: string };
        } | null;
        if (!result.ok || !json?.success || !json.data) {
          setError(json?.error?.message || t("errors.loadFailed"));
          return;
        }
        setData(json.data);
        setError(null);
      },
      () => setError(t("errors.network"))
    );
  }, [t]);

  async function refreshSnapshot() {
    const res = await fetch("/api/billing/subscription", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (json?.success) setData(json.data as Snapshot);
  }

  async function post(body: Record<string, string>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (json?.error?.code === "PAYMENT_PROVIDER_CONFIG_REQUIRED") {
        setError(t("settings.billingConfigRequired"));
        return;
      }
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || t("errors.generic"));
        return;
      }
      if (json.data?.checkoutUrl) {
        window.location.assign(json.data.checkoutUrl);
        return;
      }
      await refreshSnapshot();
    } catch {
      setError(t("errors.network"));
    } finally {
      setBusy(false);
    }
  }

  async function simulate(type: string) {
    setBusy(true);
    try {
      await fetch("/api/billing/dev/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, plan: "PRO_MONTHLY" }),
      });
      await refreshSnapshot();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="billing" className="border-t border-border pt-8">
      <div className="flex items-start gap-3">
        <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">{t("settings.billing")}</h2>
          <p className="mt-0.5 text-xs text-muted">{t("settings.billingDesc")}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        <p className="text-secondary">
          {data
            ? `${data.plan} · ${data.status}${data.cancelAtPeriodEnd ? " · cancel at period end" : ""}`
            : "…"}
        </p>
        {data?.currentPeriodEnd ? (
          <p className="text-xs text-muted">
            {t("settings.billingPeriod", {
              date: data.currentPeriodEnd.slice(0, 10),
            })}
          </p>
        ) : null}
        {data?.lastPaymentError ? (
          <p className="text-xs text-error">{data.lastPaymentError}</p>
        ) : null}
        {error ? <p className="text-sm text-error">{error}</p> : null}
        {!data?.configured ? (
          <p className="text-xs text-muted">{t("settings.billingConfigRequired")}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={busy || data?.entitled === true}
            onClick={() => void post({ action: "checkout", plan: "PRO_MONTHLY" })}
          >
            {t("settings.upgradeMonthly")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy || data?.entitled === true}
            onClick={() => void post({ action: "checkout", plan: "PRO_YEARLY" })}
          >
            {t("settings.upgradeYearly")}
          </Button>
          {data?.entitled && !data.cancelAtPeriodEnd ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => void post({ action: "cancel" })}
            >
              {t("settings.cancelRenewal")}
            </Button>
          ) : null}
          {data?.cancelAtPeriodEnd ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => void post({ action: "resume" })}
            >
              {t("settings.resumePlan")}
            </Button>
          ) : null}
        </div>
        {data?.provider === "dev" ? (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void simulate("checkout.completed")}>
              Dev: activate
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void simulate("payment.failed")}>
              Dev: fail payment
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void simulate("subscription.cancelled")}>
              Dev: cancel
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
