"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { formatMoney } from "@/lib/money";
import { useT } from "@/components/i18n/LocaleProvider";
import { broadcastIdentityChange } from "@/lib/avatar/identity-events";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { getExplanationLanguages } from "@/lib/i18n/languages-registry";
import {
  ProfileIdentityCard,
  type IdentityStats,
} from "@/components/profile/ProfileIdentityCard";
import type { AvatarFrameId } from "@/lib/avatar/presets";

type Profile = {
  monthlyPocketMoney: number | null;
  studentType: string;
  primaryGoal: string | null;
  currency: string;
  university: string | null;
  course: string | null;
  institutionName: string | null;
  boardOrUniversity: string | null;
  classOrSemester: string | null;
  preferredExplanationLang: string | null;
  studyGoal: string | null;
  dailyStudyMinutes: number | null;
  weakSubjects: string | null;
  onboardingComplete: boolean;
  displayName: string | null;
  avatarPresetId: string | null;
  avatarStatus: string | null;
  leaderboardOptIn: boolean;
  xpTotal: number;
  level: number;
  academicAura: number;
};

function fieldsFromProfile(p: Profile | null) {
  return {
    pocket: p?.monthlyPocketMoney != null ? String(p.monthlyPocketMoney) : "",
    goal: p?.primaryGoal ?? "",
    studentType: p?.studentType || "DAY_SCHOLAR",
    institutionName: p?.institutionName || p?.university || "",
    boardOrUniversity: p?.boardOrUniversity || "",
    course: p?.course || "",
    classOrSemester: p?.classOrSemester || "",
    preferredLang: p?.preferredExplanationLang || "English",
    studyGoal: p?.studyGoal || "",
    dailyMinutes:
      p?.dailyStudyMinutes != null ? String(p.dailyStudyMinutes) : "",
    weakSubjects: p?.weakSubjects || "",
  };
}

export function ProfileClient({
  email,
  name,
  plan,
  initialProfile,
  streakCurrent = 0,
  cosmeticFrame = "none",
}: {
  email: string;
  name: string | null;
  plan: string;
  initialProfile: Profile | null;
  streakCurrent?: number;
  cosmeticFrame?: AvatarFrameId;
}) {
  const initial = fieldsFromProfile(initialProfile);
  const { t } = useT();
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [pocket, setPocket] = useState(initial.pocket);
  const [goal, setGoal] = useState(initial.goal);
  const [studentType, setStudentType] = useState(initial.studentType);
  const [institutionName, setInstitutionName] = useState(initial.institutionName);
  const [boardOrUniversity, setBoardOrUniversity] = useState(
    initial.boardOrUniversity
  );
  const [course, setCourse] = useState(initial.course);
  const [classOrSemester, setClassOrSemester] = useState(initial.classOrSemester);
  const [preferredLang, setPreferredLang] = useState(initial.preferredLang);
  const [studyGoal, setStudyGoal] = useState(initial.studyGoal);
  const [dailyMinutes, setDailyMinutes] = useState(initial.dailyMinutes);
  const [weakSubjects, setWeakSubjects] = useState(initial.weakSubjects);
  const [displayNameDraft, setDisplayNameDraft] = useState(
    initialProfile?.displayName ?? ""
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [identitySave, setIdentitySave] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [identityError, setIdentityError] = useState<string | null>(null);

  const identity: IdentityStats = {
    displayName: profile?.displayName ?? null,
    avatarPresetId: profile?.avatarPresetId ?? null,
    avatarStatus: profile?.avatarStatus ?? null,
    xpTotal: profile?.xpTotal ?? 0,
    level: profile?.level ?? 1,
    academicAura: profile?.academicAura ?? 50,
    streakCurrent,
    cosmeticFrame,
    leaderboardOptIn: profile?.leaderboardOptIn ?? false,
    studyGoal: profile?.studyGoal ?? null,
  };

  async function patchSocial(partial: Record<string, unknown>) {
    setSaving(true);
    setIdentitySave("saving");
    setIdentityError(null);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const message = json?.error?.message || t("errors.generic");
        setError(message);
        setIdentityError(message);
        setIdentitySave("error");
        return;
      }
      setProfile(json.data.profile);
      setMsg(t("toast.saved"));
      setIdentitySave("saved");
      const p = json.data.profile as {
        avatarPresetId?: string | null;
        avatarStatus?: string | null;
        displayName?: string | null;
      } | undefined;
      if (p) {
        broadcastIdentityChange({
          avatarPresetId: p.avatarPresetId,
          avatarStatus: p.avatarStatus,
          displayName: p.displayName,
        });
      }
    } catch {
      const message = t("errors.network");
      setError(message);
      setIdentityError(message);
      setIdentitySave("error");
    } finally {
      setSaving(false);
    }
  }

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
          institutionName: institutionName || "",
          university: institutionName || "",
          boardOrUniversity: boardOrUniversity || "",
          course: course || "",
          classOrSemester: classOrSemester || "",
          preferredExplanationLang: preferredLang || "",
          studyGoal: studyGoal || "",
          dailyStudyMinutes: dailyMinutes ? Number(dailyMinutes) : null,
          weakSubjects: weakSubjects || "",
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "Could not save.");
        return;
      }
      setProfile(json.data.profile);
      setMsg(t("profile.saved"));
    } catch {
      setError(t("errors.network"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <ProfileIdentityCard
        userName={name ?? "Student"}
        identity={identity}
        saving={saving}
        saveState={identitySave}
        saveError={identityError}
        displayNameDraft={displayNameDraft}
        onDisplayNameChange={setDisplayNameDraft}
        onDisplayNameBlur={() => {
          if (displayNameDraft !== (profile?.displayName ?? "")) {
            void patchSocial({ displayName: displayNameDraft });
          }
        }}
        onPresetChange={(id) => patchSocial({ avatarPresetId: id })}
        onStatusChange={(status) => patchSocial({ avatarStatus: status })}
      />

      <div className="space-y-3 border-t border-border pt-6 text-sm">
        <div>
          <p className="text-muted">{t("settings.name")}</p>
          <p className="font-medium">{name ?? "Not set"}</p>
        </div>
        <div>
          <p className="text-muted">{t("settings.email")}</p>
          <p className="font-medium">{email}</p>
        </div>
        <div>
          <p className="text-muted">{t("settings.plan")}</p>
          <p className="font-medium">{plan}</p>
        </div>
        {profile?.monthlyPocketMoney != null ? (
          <div>
            <p className="text-muted">{t("money.pocketMoney")}</p>
            <p className="font-medium">
              {formatMoney(profile.monthlyPocketMoney, profile.currency)}
            </p>
          </div>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="space-y-4 border-t border-border pt-6">
        <h3 className="font-semibold">{t("profile.academicContext")}</h3>
        <p className="text-xs text-muted">{t("profile.academicHint")}</p>
        <FormField id="institution" label={t("profile.institution")}>
          <input
            id="institution"
            className="field-input"
            value={institutionName}
            onChange={(e) => setInstitutionName(e.target.value)}
          />
        </FormField>
        <FormField id="board" label={t("profile.board")}>
          <input
            id="board"
            className="field-input"
            value={boardOrUniversity}
            onChange={(e) => setBoardOrUniversity(e.target.value)}
          />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="course" label={t("profile.course")}>
            <input
              id="course"
              className="field-input"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
          </FormField>
          <FormField id="semester" label={t("profile.semester")}>
            <input
              id="semester"
              className="field-input"
              value={classOrSemester}
              onChange={(e) => setClassOrSemester(e.target.value)}
            />
          </FormField>
        </div>
        <FormField id="lang" label={t("profile.explanationLanguage")}>
          <LanguageSelector
            id="lang"
            value={preferredLang}
            options={getExplanationLanguages()}
            onlyReadySelectable={false}
            searchPlaceholder={t("settings.languageSearch")}
            comingSoonLabel={t("settings.languageComingSoon")}
            onChange={setPreferredLang}
          />
        </FormField>
        <FormField id="studyGoal" label={t("profile.studyGoal")}>
          <input
            id="studyGoal"
            className="field-input"
            value={studyGoal}
            onChange={(e) => setStudyGoal(e.target.value)}
          />
        </FormField>
        <FormField id="daily" label={t("profile.dailyMinutes")}>
          <input
            id="daily"
            type="number"
            min={10}
            max={720}
            className="field-input"
            value={dailyMinutes}
            onChange={(e) => setDailyMinutes(e.target.value)}
          />
        </FormField>
        <FormField id="weak" label={t("profile.weakSubjects")}>
          <input
            id="weak"
            className="field-input"
            placeholder="Comma separated"
            value={weakSubjects}
            onChange={(e) => setWeakSubjects(e.target.value)}
          />
        </FormField>

        <h3 className="pt-2 font-semibold">{t("profile.moneySettings")}</h3>
        <FormField id="pocket" label={t("money.pocketMoney")}>
          <input
            id="pocket"
            type="number"
            min={1}
            className="field-input"
            value={pocket}
            onChange={(e) => setPocket(e.target.value)}
          />
        </FormField>
        <FormField id="goal" label={t("profile.primaryGoal")}>
          <input
            id="goal"
            className="field-input"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </FormField>
        <FormField id="type" label={t("profile.studentType")}>
          <select
            id="type"
            className="field-input"
            value={studentType}
            onChange={(e) => setStudentType(e.target.value)}
          >
            <option value="DAY_SCHOLAR">Day scholar</option>
            <option value="HOSTEL">Hostel</option>
          </select>
        </FormField>
        <Button type="submit" disabled={saving}>
          {saving ? t("loading.generic") : t("actions.save")}
        </Button>
        {msg ? <p className="text-sm text-primary">{msg}</p> : null}
        {error ? (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
