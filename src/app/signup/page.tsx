"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { useT } from "@/components/i18n/LocaleProvider";

export default function SignupPage() {
  const router = useRouter();
  const { t } = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, email, password }),
      });

      let json: {
        success?: boolean;
        error?: { message?: string; details?: unknown };
      } = {};

      try {
        json = await res.json();
      } catch {
        setError(t("signup.error.unexpected"));
        return;
      }

      if (!res.ok || !json.success) {
        const message =
          json?.error?.message ??
          (res.status >= 500
            ? t("login.error.server")
            : t("signup.error.generic"));
        setError(message);
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError(t("login.error.network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t("signup.title")} subtitle={t("signup.subtitle")}>
      <form method="post" action="/signup" onSubmit={onSubmit} className="auth-form space-y-5">
        <FormField id="name" label={t("signup.name")} hint={t("signup.nameHint")}>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-input auth-input"
            placeholder={t("signup.namePlaceholder")}
            autoComplete="name"
          />
        </FormField>

        <FormField
          id="email"
          label={t("login.email")}
          hint={t("signup.emailHint")}
        >
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input auth-input"
            placeholder={t("login.emailPlaceholder")}
            autoComplete="email"
          />
        </FormField>

        <FormField
          id="password"
          label={t("login.password")}
          hint={t("signup.passwordHint")}
        >
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input auth-input pr-12"
              placeholder={t("signup.passwordPlaceholder")}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-eye absolute top-1/2 right-2.5 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? t("login.hidePassword") : t("login.showPassword")
              }
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </FormField>

        {error ? (
          <div
            className="rounded-xl border border-error/25 bg-error-soft px-4 py-3 text-[0.9375rem] leading-relaxed text-error"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <Button type="submit" size="lg" className="auth-submit w-full" disabled={loading}>
          {loading ? t("signup.submitting") : t("signup.submit")}
        </Button>
      </form>

      <p className="auth-footer mt-7 flex flex-wrap items-baseline justify-center gap-x-1.5 text-center text-[0.9375rem] leading-relaxed tracking-normal text-secondary">
        <span>{t("signup.hasAccount")}{"\u00A0"}</span>
        <Link
          href="/login"
          className="font-semibold tracking-normal text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {t("signup.logIn")}
        </Link>
      </p>
    </AuthShell>
  );
}
