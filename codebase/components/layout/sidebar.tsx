"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Truck, Users, Map, Wrench, DollarSign, FileText, ShieldCheck, Settings, LogOut } from "lucide-react";
import { SessionUser } from "@/lib/auth/types";
import { hasPermission } from "@/lib/auth/permissions";

interface SidebarProps {
  user: SessionUser;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "read:dashboard" as const },
    { name: "Vehicles", href: "/vehicles", icon: Truck, permission: "read:vehicles" as const },
    { name: "Drivers", href: "/drivers", icon: Users, permission: "read:drivers" as const },
    { name: "Trips", href: "/trips", icon: Map, permission: "read:trips" as const },
    { name: "Maintenance", href: "/maintenance", icon: Wrench, permission: "read:maintenance" as const },
    { name: "Finance", href: "/finance", icon: DollarSign, permission: "read:finance" as const },
    { name: "Reports", href: "/reports", icon: FileText, permission: "read:reports" as const },
    { name: "Compliance", href: "/compliance", icon: ShieldCheck, permission: "read:compliance" as const },
    { name: "Settings", href: "/settings", icon: Settings, permission: "read:settings" as const },
  ];

  const visibleNavItems = navItems.filter(item => hasPermission(user, item.permission));

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border">
      <div className="p-6">
        <h2 className="text-2xl font-heading font-bold text-primary">TransitOps</h2>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-2">
          {visibleNavItems.map((item, index) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Button
                key={index}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "justify-start",
                  isActive ? "bg-primary/10 text-primary hover:bg-primary/20 font-medium" : "hover:bg-accent/50 text-foreground"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-border bg-accent/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {user.roleSlug.replace('_', ' ')}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" asChild>
            <a href="/logout" title="Log out">
              <LogOut className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
