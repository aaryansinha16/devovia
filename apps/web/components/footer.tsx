import Link from "next/link";
import React from "react";
import { useTheme } from "../lib/theme-context";

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

const Footer: React.FC = () => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="site-footer"
      style={{ zIndex: 1000 }}
      className="bg-slate-50 dark:bg-slate-900 relative border-t border-slate-200 dark:border-slate-700 main-footer"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 footer-container">
        <div className="flex flex-col md:flex-row justify-between items-center footer-content">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <img
                src={theme === "dark" ? "/logo-dark.svg" : "/logo.svg"}
                alt="Devovia Logo"
                className="h-10 w-auto"
              />
            </Link>
          </div>
          <p
            id="copyright-text"
            className="text-sm text-slate-500 dark:text-slate-400"
          >
            &copy; {currentYear} Devovia. All rights reserved.
          </p>
          <div
            id="footer-links"
            className="flex space-x-4 mt-4 md:mt-0 legal-links"
          >
            <a
              href="#"
              className="text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors footer-link"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors footer-link"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
