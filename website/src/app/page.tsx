"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";

import { ThemeProvider }    from "@/components/ThemeProvider";
import { Header }           from "@/components/Header";
import { HeroSection }      from "@/components/HeroSection";
import { SocialProof }      from "@/components/SocialProof";
import { PainSection }      from "@/components/PainSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { BenefitsSection }  from "@/components/BenefitsSection";
import { PricingSection }   from "@/components/PricingSection";
import { FaqSection }       from "@/components/FaqSection";
import { CtaSection }       from "@/components/CtaSection";
import { Footer }           from "@/components/Footer";
import { CheckoutModal }    from "@/components/CheckoutModal";

export default function LandingPage() {
  const [plans,       setPlans]       = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loginUrl,    setLoginUrl]    = useState("/login");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    fetch(getBackendUrl("/api/public/plans"))
      .then((res) => res.json())
      .then((data) => { if (data.success) setPlans(data.data); })
      .catch(() => toast.error("Falha ao carregar planos"))
      .finally(() => setLoading(false));

    if (typeof window !== "undefined") {
      const host = window.location.host;
      if (host.startsWith("planos.")) {
        setLoginUrl(`${window.location.protocol}//${host.replace("planos.", "")}/login`);
      }
    }
  }, []);

  const scrollToPricing = () =>
    document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" });

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <Header loginUrl={loginUrl} />

        <main className="flex-1 flex flex-col w-full">
          <HeroSection      onScrollToPricing={scrollToPricing} />
          <SocialProof />
          <PainSection />
          <HowItWorksSection />
          <BenefitsSection />
          <PricingSection
            plans={plans}
            loading={loading}
            onSelectPlan={(plan) => setSelectedPlan(plan)}
          />
          <FaqSection />
          <CtaSection onScrollToPricing={scrollToPricing} />
        </main>

        <Footer />

        {selectedPlan && (
          <CheckoutModal
            plan={selectedPlan}
            loginUrl={loginUrl}
            onClose={() => setSelectedPlan(null)}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
