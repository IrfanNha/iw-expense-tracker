"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Wallet,
  CreditCard,
  ArrowLeftRight,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/accounts", label: "Accounts", icon: Wallet },
  { href: "/dashboard/categories", label: "Categories", icon: CreditCard },
  { href: "/dashboard/transfer", label: "Transfer", icon: ArrowLeftRight },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden shadow-lg">
      <div className="h-full max-w-screen-sm mx-auto">
        <div className="flex items-center justify-around h-full px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 items-center justify-center rounded-lg p-3 transition-all duration-300 ease-out",
                  "active:scale-95 hover:bg-accent/50",
                  "relative group",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
                aria-label={item.label}
              >
                <Icon 
                strokeWidth={1.5}
                  className={cn(
                    "h-5 w-5 transition-all duration-300 ease-out",
                    isActive && "scale-110",
                    "group-hover:scale-105"
                  )} 
                />
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

