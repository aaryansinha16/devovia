"use client";

import Link from "next/link";
import Image from "next/image";
import UserMenu from "./user-menu";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.svg"
              alt="Devovia"
              width={120}
              height={36}
              className="h-9 w-auto"
            />
          </Link>

          <nav className="hidden md:flex gap-6">
            <Link
              href="/tools"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Tools
            </Link>
            <Link
              href="/snippets"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Snippets
            </Link>
            <Link
              href="/projects"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Projects
            </Link>
            <Link
              href="/blog"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Blog
            </Link>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <UserMenu />
          </nav>
        </div>
      </div>
    </header>
  );
}
