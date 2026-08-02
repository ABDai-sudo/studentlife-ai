import { AcademicHub } from "@/components/landing/AcademicHub";
import { AIFinancialCoach } from "@/components/landing/AIFinancialCoach";
import { CanIAffordIt } from "@/components/landing/CanIAffordIt";
import { CTASection } from "@/components/landing/CTASection";
import { ExpenseTracking } from "@/components/landing/ExpenseTracking";
import { FinancialHealthScore } from "@/components/landing/FinancialHealthScore";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { MoneyProblemsSection } from "@/components/landing/MoneyProblemsSection";
import { MonthlyReports } from "@/components/landing/MonthlyReports";
import { Navbar } from "@/components/landing/Navbar";
import { PocketMoneyMode } from "@/components/landing/PocketMoneyMode";
import { PricingSection } from "@/components/landing/PricingSection";
import { ProductOverview } from "@/components/landing/ProductOverview";
import { SafeDailySpending } from "@/components/landing/SafeDailySpending";
import { SavingsGoals } from "@/components/landing/SavingsGoals";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ProductOverview />
        <MoneyProblemsSection />
        <PocketMoneyMode />
        <AIFinancialCoach />
        <SafeDailySpending />
        <ExpenseTracking />
        <SavingsGoals />
        <CanIAffordIt />
        <FinancialHealthScore />
        <MonthlyReports />
        <AcademicHub />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
