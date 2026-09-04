"use client";

import { createContext, useContext, type ReactNode } from "react";
import type {
  AvatarPresence,
  AvatarStatusSource,
} from "@/lib/avatar/contextual-status";

export type HeaderIdentity = {
  displayName: string | null;
  avatarPresetId: string | null;
  avatarStatus: string | null;
  avatarPresence?: AvatarPresence | null;
  avatarStatusSource?: AvatarStatusSource | null;
  avatarStatusLive?: boolean;
};

const HeaderIdentityContext = createContext<HeaderIdentity | null>(null);

export function HeaderIdentityProvider({
  value,
  children,
}: {
  value: HeaderIdentity;
  children: ReactNode;
}) {
  return (
    <HeaderIdentityContext.Provider value={value}>
      {children}
    </HeaderIdentityContext.Provider>
  );
}

export function useHeaderIdentity() {
  return useContext(HeaderIdentityContext);
}
