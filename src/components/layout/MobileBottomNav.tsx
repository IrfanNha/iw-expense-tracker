"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Wallet,
  CreditCard,
  TrendingUp,
  ArrowLeftRight,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/accounts", label: "Accounts", icon: Wallet },
  { href: "/dashboard/categories", label: "Categories", icon: CreditCard },
  { href: "/dashboard/transactions", label: "Transactions", icon: TrendingUp },
  { href: "/dashboard/transfer", label: "Transfer", icon: ArrowLeftRight },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden shadow-lg safe-area-inset-bottom">
      <div className="overflow-x-auto scrollbar-hide h-full">
        <div className="flex items-center gap-1.5 px-3 py-2 min-w-max h-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-[70px] max-w-[90px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-xs transition-all duration-200",
                  "active:scale-95",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon 
                  className={cn(
                    "h-5 w-5 transition-transform duration-200 shrink-0",
                    isActive && "scale-110"
                  )} 
                />
                <span className="truncate font-medium leading-tight text-center w-full">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

