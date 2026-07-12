"use client";

import { SessionUser } from "@/lib/auth/types";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogOut, Menu, Search } from "lucide-react";
import Link from "next/link";
import { hasPermission } from "@/lib/auth/permissions";

interface TopbarProps {
  user: SessionUser;
}

export function Topbar({ user }: TopbarProps) {
  const mobileNav = [
    ["Dashboard", "/dashboard", "read:dashboard"],
    ["Vehicles", "/vehicles", "read:vehicles"],
    ["Drivers", "/drivers", "read:drivers"],
    ["Trips", "/trips", "read:trips"],
    ["Maintenance", "/maintenance", "read:maintenance"],
    ["Fuel & Expenses", "/finance", "read:finance"],
    ["Reports", "/reports", "read:reports"],
    ["Compliance", "/compliance", "read:compliance"],
    ["Settings", "/settings", "read:settings"],
  ] as const;
  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 sm:px-6">
      <details className="relative md:hidden">
        <summary
          aria-label="Open navigation"
          className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border"
        >
          <Menu className="h-4 w-4" />
        </summary>
        <nav className="shadow-organic absolute left-0 top-12 z-[1000] grid w-56 gap-1 rounded-2xl border bg-card p-2">
          {mobileNav
            .filter(([, , permission]) => hasPermission(user, permission))
            .map(([name, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl px-3 py-2 text-sm hover:bg-muted"
              >
                {name}
              </Link>
            ))}
        </nav>
      </details>
      <label className="relative hidden max-w-md flex-1 sm:block">
        <span className="sr-only">Search TransitOps</span>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-10 w-full rounded-full border bg-background pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Search operations..."
        />
      </label>
      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-xs capitalize text-muted-foreground">
            {user.roleSlug.replaceAll("_", " ")}
          </p>
        </div>
        <a
          href="/logout"
          aria-label="Log out"
          className="grid h-10 w-10 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}
