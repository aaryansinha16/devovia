"use client";

import Navbar from "../components/navbar";
import HeroSection from "../components/landing/hero-section";
import FeaturesSection from "../components/landing/features-section";
import ValuePropositionSection from "../components/landing/value-section";
import CTASection from "../components/landing/cta-section";
import Footer from "../components/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      <ValuePropositionSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
