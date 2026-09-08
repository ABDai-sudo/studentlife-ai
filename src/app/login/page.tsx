"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { useT } from "@/components/i18n/LocaleProvider";
import { mapLoginFailure, safePostLoginPath } from "@/lib/auth/login-errors";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let json: {
        success?: boolean;
        error?: { code?: string; message?: string };
        data?: { user?: { onboardingComplete?: boolean } };
      } = {};

      try {
        json = await res.json();
      } catch {
        setError(t("login.error.server"));
        return;
      }

      if (!res.ok || !json.success) {
        setError(
          t(
            mapLoginFailure({
              ok: res.ok,
              status: res.status,
              code: json.error?.code,
            })
          )
        );
        return;
      }

      const nextPath = safePostLoginPath(
        new URLSearchParams(window.location.search).get("next"),
        Boolean(json.data?.user?.onboardingComplete)
      );
      router.push(nextPath);
      router.refresh();
    } catch {
      setError(t("login.error.network"));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t("login.welcome")} subtitle={t("login.tagline")}>
      <form
        method="post"
        action="/login"
        onSubmit={onSubmit}
        className="auth-form space-y-5"
      >
        <FormField id="email" label={t("login.email")}>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input auth-input"
            placeholder={t("login.emailPlaceholder")}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
          />
        </FormField>

        <FormField id="password" label={t("login.password")}>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input auth-input pr-12"
              placeholder={t("login.passwordPlaceholder")}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-eye absolute top-1/2 right-2.5 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? t("login.hidePassword") : t("login.showPassword")
              }
              aria-pressed={showPassword}
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

        <Button
          type="submit"
          size="lg"
          className="auth-submit w-full"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? t("login.submitting") : t("login.submit")}
        </Button>
      </form>

      <p className="auth-footer mt-7 flex flex-wrap items-baseline justify-center gap-x-1.5 text-center text-[0.9375rem] leading-relaxed tracking-normal text-secondary">
        <span>{t("login.newHere")}{"\u00A0"}</span>
        <Link
          href="/signup"
          className="font-semibold tracking-normal text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {t("login.createAccount")}
        </Link>
      </p>
    </AuthShell>
  );
}
