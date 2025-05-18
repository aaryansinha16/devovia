"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { Avatar, Button } from "@repo/ui";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close the menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push("/");
  };

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/login">
          <Button variant="outline" size="sm">
            Log in
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm">Sign up</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center gap-2 rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Avatar
          src={user.avatar}
          alt={user.name || user.username}
          fallback={user.name?.[0] || user.username?.[0] || "U"}
          className="h-8 w-8 cursor-pointer"
        />
        <span className="sr-only md:not-sr-only md:text-sm font-medium">
          {user.name || user.username}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-card rounded-md shadow-lg overflow-hidden z-10 border border-border">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium">{user.name || user.username}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {user.email}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/dashboard"
              className="block px-4 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/settings/profile"
              className="block px-4 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Profile Settings
            </Link>
            <Link
              href="/settings/security"
              className="block px-4 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Security Settings
            </Link>
          </div>

          <div className="py-1 border-t border-border">
            <button
              className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
