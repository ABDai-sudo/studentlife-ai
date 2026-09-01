"use client";

import Link from "next/link";
import { Menu, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Sidebar } from "@/components/app/Sidebar";
import { ThemeQuickToggle } from "@/components/theme/ThemeQuickToggle";
import { useT } from "@/components/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/dictionaries/en";
import { mountFetch } from "@/lib/react/mount-fetch";
import { displayAvatarStatus } from "@/lib/avatar/presets";
import {
  IDENTITY_CHANGE_EVENT,
  type IdentityChangeDetail,
} from "@/lib/avatar/identity-events";
import { useHeaderIdentity } from "@/components/app/HeaderIdentity";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  titleKey?: MessageKey;
  subtitleKey?: MessageKey;
  userName?: string;
  /** Server-resolved display name (leaderboard / social) */
  displayName?: string | null;
  avatarPresetId?: string | null;
  avatarStatus?: string | null;
};

export function AppHeader({
  title,
  subtitle,
  titleKey,
  subtitleKey,
  userName = "Student",
  displayName: displayNameProp = null,
  avatarPresetId: avatarPresetIdProp = null,
  avatarStatus: avatarStatusProp = null,
}: AppHeaderProps) {
  const identity = useHeaderIdentity();
  const initialName =
    displayNameProp?.trim() || identity?.displayName?.trim() || userName;
  const [open, setOpen] = useState(false);
  const [live, setLive] = useState<{
    avatarPresetId: string | null;
    avatarStatus: string | null;
    displayName: string;
    level: number | null;
  } | null>(null);
  const { t } = useT();

  const avatarPresetId =
    live?.avatarPresetId ?? avatarPresetIdProp ?? identity?.avatarPresetId ?? null;
  const avatarStatus =
    live?.avatarStatus ?? avatarStatusProp ?? identity?.avatarStatus ?? null;
  const displayName = live?.displayName ?? initialName;
  const level = live?.level ?? null;

  const resolvedTitle = titleKey ? t(titleKey) : title;
  const resolvedSubtitle = subtitleKey ? t(subtitleKey) : subtitle;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    return mountFetch("/api/profile", ({ ok, json }) => {
      const body = json as {
        success?: boolean;
        data?: {
          profile?: {
            avatarPresetId?: string | null;
            avatarStatus?: string | null;
            displayName?: string | null;
            level?: number | null;
          } | null;
          user?: { name?: string | null };
        };
      } | null;
      if (!ok || !body?.success) return;
      const p = body.data?.profile;
      setLive({
        avatarPresetId: p?.avatarPresetId ?? null,
        avatarStatus: p?.avatarStatus ?? null,
        displayName:
          p?.displayName?.trim() || body.data?.user?.name || userName,
        level: typeof p?.level === "number" ? p.level : null,
      });
    });
  }, [userName]);

  useEffect(() => {
    function onIdentity(event: Event) {
      const detail = (event as CustomEvent<IdentityChangeDetail>).detail;
      if (!detail) return;
      setLive((prev) => ({
        avatarPresetId:
          "avatarPresetId" in detail
            ? (detail.avatarPresetId ?? null)
            : (prev?.avatarPresetId ?? avatarPresetIdProp),
        avatarStatus:
          "avatarStatus" in detail
            ? (detail.avatarStatus ?? null)
            : (prev?.avatarStatus ?? avatarStatusProp),
        displayName: detail.displayName?.trim()
          ? detail.displayName.trim()
          : (prev?.displayName ?? initialName),
        level: prev?.level ?? null,
      }));
    }
    window.addEventListener(IDENTITY_CHANGE_EVENT, onIdentity);
    return () => window.removeEventListener(IDENTITY_CHANGE_EVENT, onIdentity);
  }, [avatarPresetIdProp, avatarStatusProp, initialName]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full min-w-0 items-center gap-3 overflow-x-clip border-b border-border bg-surface px-4 lg:px-6">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-transform active:scale-95 lg:hidden"
          aria-label={open ? t("actions.close") : t("settings.openNav")}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-foreground">
            {resolvedTitle}
          </h1>
          {resolvedSubtitle ? (
            <p className="hidden truncate text-xs text-muted sm:block">
              {resolvedSubtitle}
            </p>
          ) : null}
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-2">
          <ThemeQuickToggle />
          <Link
            href="/settings"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-secondary transition-colors hover:bg-surface-secondary"
            aria-label={t("nav.settings")}
            title={t("nav.settings")}
          >
            <Settings className="h-4 w-4" />
          </Link>

          <Link
            href="/dashboard/profile"
            className="inline-flex max-w-[9.75rem] min-w-0 items-center gap-2 rounded-lg border border-border bg-surface py-1 ps-1 pe-2 transition-colors hover:bg-surface-secondary sm:max-w-[14rem]"
            aria-label={t("header.profileMenu", { name: displayName })}
            title={t("header.profileMenu", { name: displayName })}
          >
            <Avatar name={displayName} presetId={avatarPresetId} />
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold leading-tight text-foreground sm:text-sm">
                {displayName}
              </span>
              <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[0.65rem] leading-tight text-muted">
                {level != null ? (
                  <span className="shrink-0 rounded-md bg-primary-soft px-1.5 py-px font-semibold text-primary">
                    {t("header.levelShort", { level })}
                  </span>
                ) : null}
                {avatarStatus ? (
                  <span className="truncate">{displayAvatarStatus(avatarStatus)}</span>
                ) : null}
              </span>
            </span>
          </Link>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/30"
            aria-label={t("actions.close")}
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-xl">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
