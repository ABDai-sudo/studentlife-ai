"use client";

import Link from "next/link";
import { Check, Eye, EyeOff } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { useT } from "@/components/i18n/LocaleProvider";

type Step = 1 | 2 | 3;

function passwordChecks(password: string) {
  return {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /[0-9]/.test(password),
  };
}

export default function SignupPage() {
  const router = useRouter();
  const { t } = useT();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const checks = useMemo(() => passwordChecks(password), [password]);
  const passwordReady = checks.length && checks.letter && checks.number;

  const progressLabels = [
    t("signup.step1"),
    t("signup.step2"),
    t("signup.step3"),
  ];

  function goNext(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (step === 1) {
      if (!email.trim() || !passwordReady) {
        setError(t("signup.error.passwordRules"));
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
    }
  }

  async function createAccount(e: FormEvent) {
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
        setStep(1);
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

  const title =
    step === 1
      ? t("signup.step1Title")
      : step === 2
        ? t("signup.step2Title")
        : t("signup.step3Title");
  const subtitle =
    step === 1
      ? t("signup.step1Subtitle")
      : step === 2
        ? t("signup.step2Subtitle")
        : t("signup.step3Subtitle");

  return (
    <AuthShell
      title={title}
      subtitle={subtitle}
      progress={{ step, labels: progressLabels }}
    >
      {step < 3 ? (
        <form onSubmit={goNext} className="auth-form space-y-5" noValidate>
          {step === 1 ? (
            <>
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
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="email"
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
                      showPassword
                        ? t("login.hidePassword")
                        : t("login.showPassword")
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

              <ul className="auth-password-rules" aria-live="polite">
                {(
                  [
                    ["length", t("signup.rule.length")],
                    ["letter", t("signup.rule.letter")],
                    ["number", t("signup.rule.number")],
                  ] as const
                ).map(([key, label]) => (
                  <li
                    key={key}
                    data-met={checks[key] ? "true" : "false"}
                    className="auth-password-rule"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                    {label}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <FormField
              id="name"
              label={t("signup.name")}
              hint={t("signup.nameHint")}
            >
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field-input auth-input"
                placeholder={t("signup.namePlaceholder")}
                autoComplete="name"
                maxLength={100}
              />
            </FormField>
          )}

          {error ? (
            <div
              className="auth-alert rounded-xl border border-error/25 bg-error-soft px-4 py-3 text-[0.9375rem] leading-relaxed text-error"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button type="submit" size="lg" className="auth-submit w-full sm:flex-1">
              {t("signup.continue")}
            </Button>
            {step > 1 ? (
              <Button
                type="button"
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => {
                  setError(null);
                  setStep((s) => (s === 2 ? 1 : s) as Step);
                }}
              >
                {t("signup.back")}
              </Button>
            ) : null}
          </div>
        </form>
      ) : (
        <form onSubmit={createAccount} className="auth-form space-y-5">
          <div className="auth-summary">
            <div>
              <p className="auth-summary-label">{t("login.email")}</p>
              <p className="auth-summary-value">{email}</p>
            </div>
            <div>
              <p className="auth-summary-label">{t("signup.name")}</p>
              <p className="auth-summary-value">
                {name.trim() || t("signup.nameOptional")}
              </p>
            </div>
            <p className="auth-summary-note">{t("signup.step3Note")}</p>
          </div>

          {error ? (
            <div
              className="auth-alert rounded-xl border border-error/25 bg-error-soft px-4 py-3 text-[0.9375rem] leading-relaxed text-error"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button
              type="submit"
              size="lg"
              className="auth-submit w-full sm:flex-1"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? t("signup.submitting") : t("signup.submit")}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={loading}
              onClick={() => {
                setError(null);
                setStep(2);
              }}
            >
              {t("signup.back")}
            </Button>
          </div>
        </form>
      )}

      <p className="auth-footer mt-7 flex flex-wrap items-baseline justify-center gap-x-1.5 text-center text-[0.9375rem] leading-relaxed tracking-normal text-secondary sm:justify-start">
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
