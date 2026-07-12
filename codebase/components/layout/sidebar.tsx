"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Truck,
  Users,
  Map,
  Wrench,
  DollarSign,
  FileText,
  LogOut,
} from "lucide-react";
import { SessionUser } from "@/lib/auth/types";
import { hasPermission } from "@/lib/auth/permissions";
import { LeafMark, PersonAvatar } from "@/components/botanics";

interface SidebarProps {
  user: SessionUser;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      permission: "read:dashboard" as const,
    },
    {
      name: "Vehicles",
      href: "/vehicles",
      icon: Truck,
      permission: "read:vehicles" as const,
    },
    {
      name: "Drivers",
      href: "/drivers",
      icon: Users,
      permission: "read:drivers" as const,
    },
    {
      name: "Trips",
      href: "/trips",
      icon: Map,
      permission: "read:trips" as const,
    },
    {
      name: "Maintenance",
      href: "/maintenance",
      icon: Wrench,
      permission: "read:maintenance" as const,
    },
    {
      name: "Fuel & Expenses",
      href: "/finance",
      icon: DollarSign,
      permission: "read:finance" as const,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: FileText,
      permission: "read:reports" as const,
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    hasPermission(user, item.permission)
  );

  return (
    <div className="hidden h-full w-[232px] flex-col border-r border-border/70 bg-card md:flex">
      <div className="flex items-center gap-3 px-6 pb-4 pt-6">
        <span className="shadow-moss grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <LeafMark className="h-5 w-5 text-primary-foreground" />
        </span>
        <div>
          <h2 className="font-heading text-xl font-bold leading-tight text-primary">
            TransitOps
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Operations Control Centre
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-3">
        <nav className="grid gap-1 px-3" aria-label="Primary">
          {visibleNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-full px-4 text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "shadow-moss bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:translate-x-0.5 hover:bg-primary/10 hover:text-primary"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-border/70 bg-accent/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center space-x-3">
            <PersonAvatar name={user.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {user.name}
              </p>
              <p className="truncate text-xs capitalize text-muted-foreground">
                {user.roleSlug.replace("_", " ")}
              </p>
            </div>
          </div>
          <a
            href="/logout"
            title="Log out"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Log out</span>
          </a>
        </div>
      </div>
    </div>
  );
}
