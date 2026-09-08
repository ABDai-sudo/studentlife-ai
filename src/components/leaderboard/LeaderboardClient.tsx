"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useT } from "@/components/i18n/LocaleProvider";
import { mountFetch } from "@/lib/react/mount-fetch";

type Entry = {
  rank: number;
  displayName: string;
  streakCurrent: number;
  xpTotal: number;
  academicAura: number;
  avatarPresetId: string | null;
  avatarImageUrl: string | null;
  showAvatar: boolean;
  isYou: boolean;
};

type Payload = {
  enabled: boolean;
  entries: Entry[];
  viewer: Entry | null;
  totalOptedIn: number;
};

export function LeaderboardClient({
  optedIn,
  enabled = true,
}: {
  optedIn: boolean;
  enabled?: boolean;
}) {
  const { t } = useT();
  const disabledPayload: Payload = {
    enabled: false,
    entries: [],
    viewer: null,
    totalOptedIn: 0,
  };
  const [data, setData] = useState<Payload | null>(
    enabled ? null : disabledPayload
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) return;
    return mountFetch(
      "/api/leaderboard",
      ({ ok, json }) => {
        const body = json as {
          success?: boolean;
          data?: Payload;
          error?: { message?: string };
        } | null;
        if (!ok || !body?.success || !body.data) {
          setError(body?.error?.message || "Could not load leaderboard.");
          setLoading(false);
          return;
        }
        setData(body.data);
        setError(null);
        setLoading(false);
      },
      () => {
        setError("Unable to reach the server. Check your connection.");
        setLoading(false);
      }
    );
  }, [enabled]);

  if (!enabled || data?.enabled === false) {
    return (
      <div className="text-sm text-secondary">
        {t("leaderboard.disabled")}
      </div>
    );
  }

  if (!optedIn) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">
          {t("leaderboard.hiddenTitle")}
        </p>
        <p className="text-sm text-secondary">{t("leaderboard.hiddenBody")}</p>
        <Button href="/settings#leaderboard" size="sm">
          {t("leaderboard.openSettings")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden border-t border-border">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Trophy className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold text-foreground">
            {t("leaderboard.title")}
          </h2>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : error ? (
          <p className="p-4 text-sm text-error">{error}</p>
        ) : !data?.entries.length ? (
          <p className="p-4 text-sm text-muted">{t("leaderboard.empty")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.entries.map((row) => (
              <li
                key={`${row.rank}-${row.displayName}`}
                className={`flex items-center gap-3 px-4 py-3 ${
                  row.isYou ? "bg-primary-soft/40" : ""
                }`}
              >
                <span className="w-8 shrink-0 text-sm font-semibold text-muted">
                  #{row.rank}
                </span>
                <Avatar
                  name={row.displayName}
                  size="md"
                  presetId={row.showAvatar ? row.avatarPresetId : null}
                  imageSrc={row.showAvatar ? row.avatarImageUrl : null}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {row.displayName}
                    {row.isYou ? (
                      <span className="ms-1 text-xs font-medium text-primary">
                        ({t("leaderboard.you")})
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted">
                    {t("leaderboard.streakDays", { count: row.streakCurrent })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data?.viewer && data.viewer.rank > (data.entries.at(-1)?.rank ?? 0) ? (
        <div className="flex items-center gap-3 border-t border-border py-3">
          <span className="w-8 text-sm font-semibold text-muted">
            #{data.viewer.rank}
          </span>
          <Avatar
            name={data.viewer.displayName}
            size="md"
            presetId={
              data.viewer.showAvatar ? data.viewer.avatarPresetId : null
            }
            imageSrc={
              data.viewer.showAvatar ? data.viewer.avatarImageUrl : null
            }
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {t("leaderboard.you")} — {data.viewer.displayName}
            </p>
            <p className="text-xs text-muted">
              {t("leaderboard.yourStreak", {
                count: data.viewer.streakCurrent,
              })}
            </p>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted">
        {t("leaderboard.privacyNote")}{" "}
        <Link href="/settings#leaderboard" className="text-primary underline">
          {t("leaderboard.openSettings")}
        </Link>
      </p>
    </div>
  );
}
