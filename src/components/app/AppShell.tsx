import type { ReactNode } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { Sidebar } from "@/components/app/Sidebar";

export function AppShell({
  title,
  subtitle,
  userName,
  children,
}: {
  title: string;
  subtitle?: string;
  userName?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <Sidebar />
      </div>
      <div className="flex min-h-full flex-1 flex-col lg:pl-64">
        <AppHeader title={title} subtitle={subtitle} userName={userName} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
