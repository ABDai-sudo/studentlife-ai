import type { ReactNode } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export function LegalShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <Navbar />
      <main className="flex-1 border-b border-border">
        <div className="container-shell py-12 sm:py-16">
          <div className="mx-auto max-w-2xl">
            <p className="text-sm font-semibold text-primary">{subtitle}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <div className="mt-8 space-y-5 text-sm leading-relaxed text-secondary">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
