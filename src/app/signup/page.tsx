"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

export default function SignupPage() {
  const router = useRouter();
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
        setError(
          "Signup failed because the server returned an unexpected response. Please try again shortly."
        );
        return;
      }

      if (!res.ok || !json.success) {
        const message =
          json?.error?.message ??
          (res.status >= 500
            ? "We couldn’t create your account right now. The server may be unavailable—please try again later."
            : "Could not create account");
        setError(message);
        return;
      }

      router.push("/dashboard");
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
      title="Create free account"
      subtitle="Start with a student budget. Add classes whenever you need."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField id="name" label="Your name" hint="Example: Riya or Alex">
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-input"
            placeholder="Type your name"
            autoComplete="name"
          />
        </FormField>

        <FormField id="email" label="Your email" hint="We will use this to log you in.">
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

        <FormField
          id="password"
          label="Make a password"
          hint="Use 8+ characters with letters and a number. Example: Study123"
        >
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input pr-11"
              placeholder="Type a new password"
              autoComplete="new-password"
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
          {loading ? "Creating account…" : "Create free account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
