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
      title="Log in"
      subtitle="Open your money dashboard and student workspace."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField id="email" label="Your email" hint="Use the email you signed up with.">
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input"
            placeholder="name@email.com"
            autoComplete="email"
          />
        </FormField>

        <FormField id="password" label="Your password">
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input pr-11"
              placeholder="Type your password"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1.5 text-muted hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </FormField>

        {error ? (
          <div
            className="rounded-[10px] border border-error/20 bg-red-50 px-3.5 py-2.5 text-sm text-error"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-secondary">
        New here?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
