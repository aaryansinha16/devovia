"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { ThemeToggle } from "../../components/ui/theme-toggle";
import { DashboardSidebar } from "@repo/ui/components";
import { 
  IconHome2, 
  IconNotebook,
  IconUserCircle, 
  IconSettings,
  IconLogout,
} from "@tabler/icons-react";
import { resetAllCursorStyles, registerGlobalCursorFix } from "../../lib/cursor-manager";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Ensure cursor is always visible in dashboard
  useEffect(() => {
    // Reset any lingering cursor styles
    resetAllCursorStyles();
    
    // Register global fix for cursor disappearing on button hover
    registerGlobalCursorFix();
    
    return () => {
      resetAllCursorStyles();
    };
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated, don't render anything (will redirect)
  if (!user) {
    return null;
  }

  const navigationLinks = [
    {
      href: "/dashboard",
      icon: <IconHome2 />,
      label: "Home",
      isActive: pathname === "/dashboard",
    },
    {
      href: "/dashboard/blogs",
      icon: <IconNotebook />,
      label: "Blogs",
      isActive: pathname.startsWith("/dashboard/blogs"),
    },
    {
      href: "/dashboard/profile",
      icon: <IconUserCircle />,
      label: "Profile",
      isActive: pathname === "/dashboard/profile",
    },
    {
      href: "/dashboard/settings",
      icon: <IconSettings />,
      label: "Settings",
      isActive: pathname === "/dashboard/settings",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar links={navigationLinks} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <nav className="bg-card shadow border-b border-border sticky top-0 z-10">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-foreground">
                  {pathname === "/dashboard" && "Dashboard"}
                  {pathname.startsWith("/dashboard/blogs") && "Blogs"}
                  {pathname === "/dashboard/profile" && "Profile"}
                  {pathname === "/dashboard/settings" && "Settings"}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-foreground hover:text-primary hover:bg-secondary"
                >
                  <IconLogout size={18} />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
