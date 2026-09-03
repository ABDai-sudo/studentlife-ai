"use client";

import { createContext, useContext, type ReactNode } from "react";

type AppFlags = {
  campusCircle: boolean;
};

const AppFlagsContext = createContext<AppFlags>({ campusCircle: false });

export function AppFlagsProvider({
  campusCircle,
  children,
}: {
  campusCircle: boolean;
  children: ReactNode;
}) {
  return (
    <AppFlagsContext.Provider value={{ campusCircle }}>
      {children}
    </AppFlagsContext.Provider>
  );
}

export function useAppFlags(): AppFlags {
  return useContext(AppFlagsContext);
}
