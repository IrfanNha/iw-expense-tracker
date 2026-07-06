"use client";

import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Wallet,
  CreditCard,
  TrendingUp,
  ArrowLeftRight,
  Menu,
  LogOut,
  Home,
  Settings,
  FileText,
  Receipt,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Spinner } from "@/components/ui/spinner";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Logo } from "@/components/layout/Logo";

// ─── Sidebar nav sections ─────────────────────────────────────────────────────
const SIDEBAR_SECTIONS = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/dashboard/accounts", label: "Accounts", icon: Wallet },
      { href: "/dashboard/transactions", label: "Transactions", icon: TrendingUp },
      { href: "/dashboard/transfer", label: "Transfer", icon: ArrowLeftRight },
      { href: "/dashboard/bills", label: "Bills", icon: Receipt },
      { href: "/dashboard/budgets", label: "Budgets", icon: PieChart },
    ],
  },
  {
    title: "Manage",
    items: [
      { href: "/dashboard/categories", label: "Categories", icon: CreditCard },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/dashboard/reports/annual", label: "Annual Report", icon: FileText },
    ],
  },
  {
    title: "Preferences",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
] as const;

// ─── Sidebar nav item ─────────────────────────────────────────────────────────
const SidebarNavItem = React.memo(function SidebarNavItem({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors relative",
        isActive
          ? "bg-foreground text-background font-medium"
          : "text-foreground/70 hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-150",
          isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
        )}
        strokeWidth={isActive ? 2 : 1.75}
      />
      <span className="flex-1 leading-none truncate">{label}</span>
    </Link>
  );
});

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
const DesktopSidebar = React.memo(function DesktopSidebar({
  pathname,
  session,
  onSignOut,
}: {
  pathname: string;
  session: { user?: { name?: string | null; email?: string | null } } | null;
  onSignOut: () => void;
}) {
  const initial = session?.user?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="flex h-full flex-col bg-background">
      {/* ── Brand ── */}
      <div className="flex items-center gap-2 px-4 py-[18px] shrink-0">
        <Logo width={22} height={22} />
        <span className="text-[13px] font-semibold tracking-tight">Irfanwork Expense</span>
      </div>

      {/* thin divider */}
      <div className="mx-4 border-t border-border/60 shrink-0" />

      {/* ── User card ── */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 bg-muted/50">
          {/* Avatar */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground text-[11px] font-bold select-none">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold truncate leading-tight">
              {session?.user?.name ?? "Guest"}
            </p>
            {session?.user?.email && (
              <p className="text-[10.5px] text-muted-foreground truncate mt-0.5 leading-tight">
                {session.user.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav
        className="flex-1 overflow-y-auto sidebar-scroll px-3 pt-1 pb-2 space-y-4"
        aria-label="Main navigation"
      >
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-2.5 mb-1 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-foreground/50 select-none">
              {section.title}
            </p>
            <div className="space-y-px">
              {section.items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={pathname === item.href}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* thin divider */}
      <div className="mx-4 border-t border-border/60 shrink-0" />

      {/* ── Footer ── */}
      <div className="px-3 py-3 shrink-0 space-y-px">
        {/* Theme row */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg">
          <span className="text-[12px] text-muted-foreground">Appearance</span>
          <ThemeToggle />
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={onSignOut}
          className={cn(
            "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px]",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/8",
            "transition-colors"
          )}
        >
          <LogOut
            className="h-4 w-4 shrink-0 opacity-60 group-hover:opacity-90 transition-opacity"
            strokeWidth={1.75}
          />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
});

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const handleSignOut = React.useCallback(
    () => signOut({ callbackUrl: "/login" }),
    []
  );

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-muted-foreground/5">
        <header className="px-4 py-3 bg-background border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo width={22} height={22} />
              <h1 className="text-base font-semibold tracking-tight">Irfanwork Expense</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[260px] p-0">
                  <SheetHeader>
                    <VisuallyHidden>
                      <SheetTitle>Navigation Menu</SheetTitle>
                    </VisuallyHidden>
                  </SheetHeader>
                  <DesktopSidebar
                    pathname={pathname}
                    session={session}
                    onSignOut={handleSignOut}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>
        <main className="flex-1 pb-20 md:pb-4">{children}</main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen relative">
      <aside className="fixed left-0 top-0 h-screen w-[220px] border-r border-border/60 bg-background z-40 flex flex-col">
        <DesktopSidebar
          pathname={pathname}
          session={session}
          onSignOut={handleSignOut}
        />
      </aside>
      <main className="flex-1 ml-[220px] p-4 md:p-6">{children}</main>
    </div>
  );
}
