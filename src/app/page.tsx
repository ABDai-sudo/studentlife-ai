import { AssignmentHelperSection } from "@/components/landing/AssignmentHelperSection";
import { AITutorSection } from "@/components/landing/AITutorSection";
import { CTASection } from "@/components/landing/CTASection";
import { EmergencyModeSection } from "@/components/landing/EmergencyModeSection";
import { ExamPrepSection } from "@/components/landing/ExamPrepSection";
import { Footer } from "@/components/landing/Footer";
import { GamificationSection } from "@/components/landing/GamificationSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { Navbar } from "@/components/landing/Navbar";
import { PersonalityModesSection } from "@/components/landing/PersonalityModesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { ProductOverview } from "@/components/landing/ProductOverview";
import { StudentBudgetSection } from "@/components/landing/StudentBudgetSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { WeeklyRecapSection } from "@/components/landing/WeeklyRecapSection";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ProductOverview />
        <AITutorSection />
        <AssignmentHelperSection />
        <ExamPrepSection />
        <GamificationSection />
        <EmergencyModeSection />
        <PersonalityModesSection />
        <StudentBudgetSection />
        <WeeklyRecapSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
