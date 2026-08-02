import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

type ModulePageProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  children?: ReactNode;
};

export async function ModulePage({
  title,
  subtitle,
  icon,
  emptyTitle,
  emptyDescription,
  children,
}: ModulePageProps) {
  const user = await requireUser();

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      userName={user.name ?? "Student"}
    >
      {children ?? (
        <EmptyState
          icon={icon}
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Button href="/dashboard" variant="secondary" size="sm">
              Back to overview
            </Button>
          }
        />
      )}
    </AppShell>
  );
}
