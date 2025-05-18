"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../lib/auth-context";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();

  // If user is not authenticated, redirect or show login prompt
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p className="mb-4">Please log in to access your account settings.</p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "Profile", href: "/settings/profile" },
    { name: "Account", href: "/settings/account" },
    { name: "Security", href: "/settings/security" },
    { name: "Notifications", href: "/settings/notifications" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded-md transition-colors ${
                    isActive ? "bg-primary text-white" : "hover:bg-accent"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
