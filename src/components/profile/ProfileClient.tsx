"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { formatMoney } from "@/lib/money";

type Profile = {
  monthlyPocketMoney: number | null;
  studentType: string;
  primaryGoal: string | null;
  currency: string;
  university: string | null;
  course: string | null;
  onboardingComplete: boolean;
};

export function ProfileClient({
  email,
  name,
  plan,
}: {
  email: string;
  name: string | null;
  plan: string;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pocket, setPocket] = useState("");
  const [goal, setGoal] = useState("");
  const [studentType, setStudentType] = useState("DAY_SCHOLAR");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/profile", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not load profile.");
      return;
    }
    const p = json.data.profile as Profile | null;
    setProfile(p);
    if (p) {
      setPocket(p.monthlyPocketMoney != null ? String(p.monthlyPocketMoney) : "");
      setGoal(p.primaryGoal ?? "");
      setStudentType(p.studentType);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyPocketMoney: pocket ? Number(pocket) : undefined,
          primaryGoal: goal || undefined,
          studentType,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "Could not save.");
        return;
      }
      setProfile(json.data.profile);
      setMsg("Saved");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="card-surface space-y-3 p-5 text-sm">
        <div>
          <p className="text-muted">Name</p>
          <p className="font-medium">{name ?? "Not set"}</p>
        </div>
        <div>
          <p className="text-muted">Email</p>
          <p className="font-medium">{email}</p>
        </div>
        <div>
          <p className="text-muted">Plan</p>
          <p className="font-medium">{plan}</p>
        </div>
        {profile?.monthlyPocketMoney != null ? (
          <div>
            <p className="text-muted">Current pocket money</p>
            <p className="font-medium">
              {formatMoney(profile.monthlyPocketMoney, profile.currency)}
            </p>
          </div>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="card-surface space-y-4 p-5">
        <h3 className="font-semibold">Update money settings</h3>
        <FormField id="pocket" label="Monthly pocket money">
          <input
            id="pocket"
            type="number"
            min={1}
            className="field-input"
            value={pocket}
            onChange={(e) => setPocket(e.target.value)}
          />
        </FormField>
        <FormField id="studentType" label="Student type">
          <select
            id="studentType"
            className="field-input"
            value={studentType}
            onChange={(e) => setStudentType(e.target.value)}
          >
            <option value="DAY_SCHOLAR">Day scholar</option>
            <option value="HOSTEL">Hostel</option>
          </select>
        </FormField>
        <FormField id="goal" label="Primary goal">
          <input
            id="goal"
            className="field-input"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </FormField>
        {error ? <p className="text-sm text-error">{error}</p> : null}
        {msg ? <p className="text-sm text-primary">{msg}</p> : null}
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
