"use client";

import { useEffect } from "react";
import Navbar from "../components/navbar";
import HeroSection from "../components/landing/hero-section";
import FeaturesSection from "../components/landing/features-section";
import ValuePropositionSection from "../components/landing/value-section";
import CTASection from "../components/landing/cta-section";
import Footer from "../components/footer";
import { FloatingDockDemo } from "@repo/ui/components";
import CursorBlobEffect from "../components/cursor-blob-effect";
import { resetAllCursorStyles, hideDefaultCursor } from "../lib/cursor-manager";

export default function HomePage() {
  // Add the cursor:none style only on the landing page
  useEffect(() => {
    // First, reset any lingering cursor styles from previous visits
    resetAllCursorStyles();
    
    // Then, hide the default cursor for this page only
    hideDefaultCursor();
    
    // Cleanup function to restore original cursor styles when leaving this page
    return () => {
      resetAllCursorStyles();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Navbar />

      <div
        className="fixed bottom-4 left-0 right-0 z-50"
      >
        <FloatingDockDemo />
      </div>

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      <ValuePropositionSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />

      {/* Custom cursor effect only for landing page */}
      <CursorBlobEffect />
    </div>
  );
}
