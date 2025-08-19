"use client";
import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "../lib/theme-context";
import { useAuth } from "../lib/auth-context";
import { ThemeToggle } from "./ui/theme-toggle";
import { VerticalNavbar } from "./vertical-navbar";
import {
  IconBrandGithub,
  IconBrandX,
  IconExchange,
  IconHome,
  IconNewSection,
  IconTerminal2,
} from "@tabler/icons-react";

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
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
      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L21 5.25l-.813 2.846a4.5 4.5 0 0 0-3.09 3.09L14.25 12l2.846.813a4.5 4.5 0 0 0 3.09 3.09L21 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09Z"
    />
  </svg>
);

export const NAV_LINKS: NavLink[] = [
  { href: "#features", label: "Features" },
  { href: "#why-devovia", label: "Why Devovia?" },
  { href: "#early-access", label: "Early Access" },
  { href: "/blogs", label: "Blogs" },
];

export interface NavLink {
  href: string;
  label: string;
}

const Navbar: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Animation configuration
  const finalSizePx = 60; // the size of the circle when collapsed
  const finalTopPx = 20; // how far down when "max" scrolled
  const finalRightPx = 20; // how far from right when "max" scrolled
  const maxScrollPx = 400; // after this scrollY, fraction caps at 1

  // Animation state
  const [navStyles, setNavStyles] = useState({
    width: "90%",
    height: "84px",
    top: "20px",
    left: "0",
    right: "0",
    marginLeft: "auto",
    marginRight: "auto",
    borderRadius: "20px",
  });

  // Function to position dropdown menu relative to the circle button
  const positionDropdown = () => {
    if (typeof window !== "undefined") {
      const navbarWidth = 280; // Width of the vertical navbar
      const circleLeft = window.innerWidth - finalSizePx - finalRightPx;
      const centeredLeft = circleLeft - navbarWidth / 2 + finalSizePx / 2;

      return {
        top: `${finalTopPx + finalSizePx + 8}px`, // 8px gap below circle
        left: `${Math.max(20, centeredLeft - 110)}px`, // Ensure it doesn't go off-screen
        width: `${navbarWidth}px`,
      };
    }
    return {};
  };

  // Track dropdown position as state
  const [dropdownPosition, setDropdownPosition] = useState(positionDropdown());

  useEffect(() => {
    const handleScroll = () => {
      // Set basic scrolled state for background color changes
      setIsScrolled(window.scrollY > 20);

      // Calculate animation values
      const scrollY = window.scrollY;
      // fraction from 0 → 1 (clamped)
      const t = Math.min(scrollY / maxScrollPx, 1);

      if (typeof window !== "undefined") {
        if (t < 1) {
          // Not fully collapsed yet - animated transition
          setIsCollapsed(false);
          setIsDropdownOpen(false); // Always close dropdown when expanding

          const fullW = window.innerWidth;
          const newW = fullW * 0.9 * (1 - t) + finalSizePx * t;
          const newH = 84 * (1 - t) + finalSizePx * t; // Height from 4rem (64px) to finalSizePx

          // Calculate border radius for circle morph effect (20px → 50%)
          const radius = t < 1 ? `${20 * (1 - t) + 50 * t}px` : "50%";

          // compute horizontal: from center → right=finalRightPx
          const centeredLeft = (fullW - newW) / 2;
          const rightAlignedLeft = fullW - newW - finalRightPx;
          const newLeft = centeredLeft * (1 - t) + rightAlignedLeft * t;

          // Update all styles at once for better performance
          setNavStyles({
            width: `${newW}px`,
            height: `${newH}px`,
            top: `${finalTopPx * (t || 1)}px`,
            left: `${newLeft}px`,
            right: "auto",
            marginLeft: "0",
            marginRight: "0",
            borderRadius: radius,
          });
        } else {
          // Fully collapsed - circle state
          setIsCollapsed(true);

          setNavStyles({
            width: `${finalSizePx}px`,
            height: `${finalSizePx}px`,
            top: `${finalTopPx}px`,
            left: `${window.innerWidth - finalSizePx - finalRightPx}px`,
            right: "auto",
            marginLeft: "0",
            marginRight: "0",
            borderRadius: "50%",
          });

          // Update dropdown position
          setDropdownPosition(positionDropdown());
        }
      }
    };

    const handleResize = () => {
      handleScroll(); // Recalculate positions on resize
      if (isCollapsed) {
        setDropdownPosition(positionDropdown());
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    handleScroll(); // Call on mount to set initial state

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [isCollapsed]);

  // Updated background classes for glassmorphism
  const headerClasses = isScrolled
    ? "bg-white/75 dark:bg-slate-900/75 backdrop-blur-sm shadow-sm dark:shadow-slate-800/50"
    : "bg-white/20 dark:bg-slate-950/20 backdrop-blur-sm"; // slate-950 for richer dark, or use slate-900/20

  const mobileMenuBgClass = isMobileMenuOpen
    ? "bg-white/95 dark:bg-slate-900/90 backdrop-blur-lg shadow-md" // Slightly more opaque for readability
    : "";

  // Handle circle button click - toggle dropdown
  const handleCircleClick = () => {
    if (isCollapsed) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  return (
    <>
      {/* Main Navbar */}
      <header
        id="site-header"
        ref={navbarRef}
        className={`fixed z-50 transition-all duration-300 ease-in-out rounded-lg overflow-hidden ${headerClasses}`}
        style={{
          ...navStyles,
          transform: "translateZ(0)", // hardware acceleration
        }}
        onClick={handleCircleClick}
      >
        {/* Regular Navbar Content - shown when not collapsed */}
        {!isCollapsed && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 header-container">
            <div className="flex items-center justify-between h-16 md:h-20">
              <div className="flex items-center space-x-2">
                <Link href="/" className="flex items-center space-x-2">
                  <img
                    src={theme === "dark" ? "/logo-dark.svg" : "/logo.svg"}
                    alt="Devovia Logo"
                    className="h-10 w-auto"
                  />
                </Link>
              </div>

              <nav
                id="desktop-navigation"
                className="hidden md:flex space-x-6 lg:space-x-8 items-center main-nav"
              >
                {NAV_LINKS.map((link: NavLink) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors duration-300 px-3 py-2 rounded-md text-sm font-medium nav-link"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="hidden md:flex items-center space-x-4 header-actions">
                <ThemeToggle />
                <div className="flex space-x-2">
                  {user ? (
                    <Link
                      href="/dashboard"
                      className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className="md:hidden flex items-center mobile-header-actions">
                <ThemeToggle />
                <button
                  id="mobile-menu-toggle"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="ml-2 inline-flex items-center justify-center p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-500"
                  aria-controls="mobile-menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? (
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Circle Content - shown when collapsed */}
        {isCollapsed && (
          <div className="w-full h-full flex justify-center items-center">
            <img
              src={
                theme === "dark"
                  ? "/favicon-devovia.png"
                  : "/favicon-devovia.png"
              }
              alt="Devovia Logo"
              className="h-10 w-auto"
            />
          </div>
        )}
      </header>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isCollapsed && isDropdownOpen && (
          <VerticalNavbar
            navLinks={NAV_LINKS}
            position={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
            onClose={() => setIsDropdownOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div
          className={`md:hidden mobile-menu-panel ${mobileMenuBgClass}`}
          id="mobile-menu"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NAV_LINKS.map((link: NavLink) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-sky-500 dark:hover:text-sky-400 block px-3 py-2 rounded-md text-base font-medium nav-link-mobile"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center px-5">
              <a
                id="mobile-get-started-btn"
                href="#early-access"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-sky-500 cta-button"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
