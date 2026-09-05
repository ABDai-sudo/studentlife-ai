"use client";

import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { LoginCampusScene } from "@/components/auth/LoginCampusScene";
import { LoginHeroAvatar } from "@/components/auth/LoginHeroAvatar";
import { LoginPreferenceBar } from "@/components/auth/LoginPreferenceBar";
import { LoginPreviewSwitcher } from "@/components/auth/LoginPreviewSwitcher";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { useT } from "@/components/i18n/LocaleProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import { getLoginGreetingKey } from "@/lib/avatar/login-greeting";
import {
  rememberLoginContext,
  resolveLoginPreview,
  readLoginContext,
  subscribeLoginContext,
  getServerLoginContextSnapshot,
  type LoginPresentationId,
} from "@/lib/avatar/login-preview";
import { mapLoginFailure, safePostLoginPath } from "@/lib/auth/login-errors";

function useLoginKeyboardClass() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const sync = () => {
      const overlap = window.innerHeight - viewport.height;
      document.documentElement.classList.toggle("login-keyboard", overlap > 120);
    };

    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
      document.documentElement.classList.remove("login-keyboard");
    };
  }, []);
}

export function CinematicLogin() {
  const router = useRouter();
  const { t } = useT();
  const { personality } = useTheme();
  useLoginKeyboardClass();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const remembered = useSyncExternalStore(
    subscribeLoginContext,
    readLoginContext,
    getServerLoginContextSnapshot
  );
  const presentation: LoginPresentationId = remembered.presentation ?? "neutral";

  const preview = useMemo(
    () => resolveLoginPreview(presentation, remembered),
    [presentation, remembered]
  );

  const broMode =
    personality === "CAMPUS_BRO" || Boolean(remembered.broModeHint);
  const examWeek = Boolean(remembered.examWeekHint);

  const speechKey = getLoginGreetingKey({
    phase: success ? "success" : "idle",
    broMode,
    examWeek,
  });

  function selectPresentation(next: LoginPresentationId) {
    rememberLoginContext({ presentation: next });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
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
        data?: { user?: { name?: string | null; onboardingComplete?: boolean } };
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

      setSuccess(true);
      rememberLoginContext({
        savedDisplayName: json.data?.user?.name ?? null,
        presentation: "custom",
      });

      const nextPath = safePostLoginPath(
        new URLSearchParams(window.location.search).get("next"),
        Boolean(json.data?.user?.onboardingComplete)
      );
      router.push(nextPath);
      router.refresh();
    } catch {
      setError(t("login.error.network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-cinematic auth-shell" data-login-success={success ? "true" : "false"}>
      <section className="login-form-pane">
        <div className="login-card">
          <p className="login-product">StudentLife AI</p>
          <h1 className="login-title">{t("login.welcome")}</h1>
          <p className="login-tagline">{t("login.tagline")}</p>

          <form
            method="post"
            action="/login"
            onSubmit={onSubmit}
            className="auth-form login-form space-y-5"
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
              {!loading ? (
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              ) : null}
            </Button>
          </form>

          <p className="auth-footer login-footer mt-7 flex flex-wrap items-baseline justify-center gap-x-1.5 text-center text-[0.9375rem] leading-relaxed text-secondary">
            <span>{t("login.newHere")}{"\u00A0"}</span>
            <Link
              href="/signup"
              className="font-semibold tracking-normal text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t("login.createAccount")}
            </Link>
          </p>
        </div>
        <LoginPreferenceBar />
      </section>

      <aside className="login-visual" aria-label={t("login.visual.label")}>
        <LoginCampusScene />
        <div
          className={`login-hero${success ? " is-ack" : ""}`}
          data-login-presentation={preview.presentation}
        >
          <div className="login-hero-avatar" key={preview.artworkSrc}>
            <LoginHeroAvatar
              name={preview.displayName}
              src={preview.artworkSrc}
            />
          </div>
          <p className="login-speech" aria-live="polite">
            {t(speechKey)}
          </p>
          <LoginPreviewSwitcher
            value={presentation}
            onChange={selectPresentation}
          />
        </div>
      </aside>
    </div>
  );
}
