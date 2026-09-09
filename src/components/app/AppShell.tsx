import type { ReactNode } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { Sidebar } from "@/components/app/Sidebar";
import type { MessageKey } from "@/lib/i18n/dictionaries/en";
import type { AvatarPresence } from "@/lib/avatar/contextual-status";

export function AppShell({
  title,
  subtitle,
  titleKey,
  subtitleKey,
  userName,
  displayName,
  avatarPresetId,
  avatarImageUrl,
  avatarStatus,
  avatarPresence,
  children,
}: {
  title: string;
  subtitle?: string;
  titleKey?: MessageKey;
  subtitleKey?: MessageKey;
  userName?: string;
  displayName?: string | null;
  avatarPresetId?: string | null;
  avatarImageUrl?: string | null;
  avatarStatus?: string | null;
  avatarPresence?: AvatarPresence | null;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full min-w-0 w-full overflow-x-clip bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <Sidebar />
      </div>
      <div className="flex min-h-full min-w-0 w-full flex-1 flex-col lg:pl-64">
        <AppHeader
          title={title}
          subtitle={subtitle}
          titleKey={titleKey}
          subtitleKey={subtitleKey}
          userName={userName}
          displayName={displayName}
          avatarPresetId={avatarPresetId}
          avatarImageUrl={avatarImageUrl}
          avatarStatus={avatarStatus}
          avatarPresence={avatarPresence}
        />
        <main className="min-w-0 w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
