"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

export default function LoginPage() {
  const router = useRouter();
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let json: {
        success?: boolean;
        error?: { message?: string };
        data?: { user?: { onboardingComplete?: boolean } };
      } = {};

      try {
        json = await res.json();
      } catch {
        setError(
          "Login failed because the server returned an unexpected response. Please try again shortly."
        );
        return;
      }

      if (!res.ok || !json.success) {
        const message =
          json?.error?.message ??
          (res.status >= 500
            ? "Something went wrong on our side. Please try again in a minute."
            : "Email or password is wrong. Please check and try again.");
        setError(message);
        return;
      }

      router.push(
        json.data?.user?.onboardingComplete ? "/dashboard" : "/onboarding"
      );
      router.refresh();
    } catch {
      setError(
        "Unable to reach the server. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your StudentLife AI workspace — study tools and budget in one place."
    >
      <form onSubmit={onSubmit} className="auth-form space-y-5">
        <FormField
          id="email"
          label="Email"
          hint="Use the email you signed up with."
        >
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input auth-input"
            placeholder="name@email.com"
            autoComplete="email"
          />
        </FormField>

        <FormField id="password" label="Password">
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input auth-input pr-12"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-eye absolute top-1/2 right-2.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
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
          {loading ? "Signing in…" : "Log in"}
        </Button>
      </form>

      <p className="auth-footer mt-7 flex flex-wrap items-baseline justify-center gap-x-1.5 text-center text-[0.9375rem] leading-relaxed tracking-normal text-secondary">
        <span>New here?{"\u00A0"}</span>
        <Link
          href="/signup"
          className="font-semibold tracking-normal text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
