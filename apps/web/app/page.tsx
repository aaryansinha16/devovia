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

export default function HomePage() {
  // Add the cursor:none style only on the landing page
  useEffect(() => {
    // Save the original cursor styles
    const originalBodyCursor = document.body.style.cursor;
    
    // Apply cursor:none to body
    document.body.style.cursor = "none";
    
    // Apply cursor:none to all interactive elements
    const interactiveElements = document.querySelectorAll(
      'a, button, [role="button"], input[type="submit"], input[type="button"], label[for], select, textarea'
    );
    interactiveElements.forEach((el) => {
      (el as HTMLElement).style.cursor = "none";
    });

    // Cleanup function to restore original cursor styles
    return () => {
      document.body.style.cursor = originalBodyCursor;
      interactiveElements.forEach((el) => {
        (el as HTMLElement).style.cursor = "";
      });
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
