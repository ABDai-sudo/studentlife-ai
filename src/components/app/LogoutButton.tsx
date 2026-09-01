"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/LocaleProvider";

export function LogoutButton() {
  const router = useRouter();
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        setError(t("errors.generic"));
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError(t("errors.network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error ? (
        <p className="mb-3 text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        onClick={logout}
        disabled={loading}
      >
        {loading ? t("loading.generic") : t("actions.signOut")}
      </Button>
    </div>
  );
}
