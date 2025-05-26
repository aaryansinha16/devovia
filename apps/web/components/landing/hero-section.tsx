import React, { useState, useEffect } from "react";
import { Button } from "@repo/ui";
import AnimatedElement from "../animated-element";
import { FlipWords, TextHoverEffect } from "@repo/ui/components";

export const ArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
    />
  </svg>
);

const HeroSection: React.FC = () => {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const fadeOutDistance = window.innerHeight * 0.7; // 70% of viewport height
      const calculatedOpacity = Math.max(
        0,
        Math.min(1, 1 - scrollY / fadeOutDistance),
      );
      setOpacity(calculatedOpacity);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section
      id="hero-section"
      className="relative min-h-screen flex items-center justify-center pt-20 pb-10 md:pt-24 md:pb-16 bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 overflow-hidden sticky top-0 z-1 hero-banner"
      style={{
        opacity: opacity,
        willChange: "opacity", // Performance hint for the browser
      }}
    >
      {/* Background elements: These will fade along with the parent section */}
      <div
        id="hero-background-elements"
        className="absolute inset-0 -z-10 overflow-hidden"
      >
        {/* Pulse Glows with theme-aware text colors */}
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 md:w-1/3 md:h-1/3 text-sky-500/70 dark:text-sky-400/70 rounded-full blur-[100px] animate-pulse-glow animation-delay-0 hero-glow hero-glow-sky"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 md:w-1/3 md:h-1/3 text-purple-500/70 dark:text-purple-400/70 rounded-full blur-[100px] animate-pulse-glow animation-delay-[2000ms] hero-glow hero-glow-purple"></div>

        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 animate-subtle-float hero-central-orb"
          style={{ animationDuration: "8s" }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-sky-400/20 to-indigo-400/20 dark:from-sky-500/20 dark:to-indigo-500/20 blur-2xl opacity-70 dark:opacity-50"></div>
        </div>

        {/* New decorative shapes */}
        {/* <OrganicBlob 
          className="w-56 h-56 md:w-80 md:h-80 text-sky-500 dark:text-sky-700 top-[10%] left-[5%] animate-float-subtle opacity-20 dark:opacity-10 hero-bg-shape hero-bg-shape-blob1"
          style={{ animationDuration: '15s', animationDelay: '0.5s' }}
        />
        <FloatingLines
          className="w-32 h-32 md:w-48 md:h-48 text-indigo-500 dark:text-indigo-700 bottom-[15%] right-[10%] animate-float-subtle opacity-30 dark:opacity-20 hero-bg-shape hero-bg-shape-lines1"
          style={{ animationDuration: '12s', animationDirection: 'reverse', transform: 'rotate(45deg)' }}
        />
        <GeometricGrid 
            className="hidden lg:block w-28 h-28 md:w-36 md:h-36 text-slate-400 dark:text-slate-600 top-[60%] left-[40%] animate-spin-slow opacity-40 dark:opacity-30 hero-bg-shape hero-bg-shape-grid1"
            style={{ animationDuration: '30s' }}
        /> */}
      </div>

      {/* Content: This will also fade along with the parent section */}
      <div
        id="hero-content-wrapper"
        className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 hero-content"
      >
        <AnimatedElement
          animationClassName="animate-[fadeInUp_0.8s_ease-out_forwards]"
          as="h1"
          id="hero-main-heading"
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight hero-title"
        >
          <span className="block text-slate-800 dark:text-slate-100">
            Devovia: Your Developer
          </span>
          <span className="block text-sky-500 dark:text-sky-400">
            <FlipWords
              words={[
                "Command Center",
                "AI Center",
                "Workflow Center",
                "Query Center",
                "Toolkit Center",
              ]}
            />
          </span>
        </AnimatedElement>

        <AnimatedElement
          animationClassName="animate-[fadeInUp_0.8s_ease-out_forwards]"
          delay="[animation-delay:200ms]"
          as="p"
          id="hero-subtitle"
          className="mt-6 max-w-lg mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300 sm:max-w-2xl hero-description"
        >
          Streamline your workflow with powerful tools for code snippets,
          project templates, CI/CD pipelines, and more. Build, share, and
          innovate—faster.
        </AnimatedElement>

        <AnimatedElement
          animationClassName="animate-[fadeInUp_0.8s_ease-out_forwards]"
          delay="[animation-delay:400ms]"
          id="hero-cta-buttons"
          className="mt-10 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 hero-actions"
        >
          <Button
            href="#early-access"
            variant="primary"
            size="lg"
            rightIcon={<ArrowRightIcon className="w-5 h-5" />}
            id="hero-cta-primary"
          >
            Get Early Access
          </Button>
          <Button
            href="#features"
            variant="outline"
            size="lg"
            id="hero-cta-secondary"
          >
            Explore Features
          </Button>
        </AnimatedElement>

        {/* <div className="h-[40rem] flex items-center justify-center">
          <TextHoverEffect text="ACET" />
        </div> */}
      </div>
    </section>
  );
};

export default HeroSection;
