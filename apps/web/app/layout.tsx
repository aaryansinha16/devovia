import React from "react";
import "./globals.css";
import "@repo/ui/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "../lib/auth-context";
import { ThemeProvider } from "../lib/theme-context";
import Header from "../components/header";
import SessionNotification from "../components/session-notification";
import CursorManager from "../components/cursor-manager";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Devovia",
  description: "A platform for developers",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className} suppressHydrationWarning={true}>
        <ThemeProvider>
          <AuthProvider>
            <CursorManager />
            <div className="relative min-h-screen flex flex-col">
              <SessionNotification />
              <header>
                {/* Skip rendering header on auth pages */}
                <div className="hidden has-[main:not(:has(.auth-container))] block">
                  {/* @ts-ignore */}
                  <Header />
                </div>
              </header>
              <main className="flex-1">{children}</main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
