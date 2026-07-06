"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Home,
  Wallet,
  Receipt,
  ArrowLeftRight,
  LayoutGrid,
  CreditCard,
  TrendingUp,
  PieChart,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Logo } from "@/components/layout/Logo";
import { Separator } from "@/components/ui/separator";

// ─── Constants (defined once, outside component) ──────────────────────────────
const PRIMARY_NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/budgets", label: "Budgets", icon: PieChart },
  { href: "/dashboard/bills", label: "Bills", icon: Receipt },
  { href: "/dashboard/transfer", label: "Transfer", icon: ArrowLeftRight },
] as const;

const DRAWER_SECTIONS = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: Home }],
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

// ─── Memoized Drawer nav item ──────────────────────────────────────────────────
const DrawerNavItem = React.memo(function DrawerNavItem({
  href,
  label,
  icon: Icon,
  isActive,
  onClose,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClose: () => void;
}) {
  return (
    <SheetClose asChild>
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
          "active:scale-[0.98]",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-foreground/70 hover:bg-accent hover:text-foreground"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <span className="flex-1 leading-none">{label}</span>
        {isActive && (
          <ChevronRight className="h-3.5 w-3.5 text-primary opacity-60" />
        )}
      </Link>
    </SheetClose>
  );
});

// ─── Memoized Drawer section ───────────────────────────────────────────────────
const DrawerSection = React.memo(function DrawerSection({
  title,
  items,
  pathname,
  onClose,
}: {
  title: string;
  items: readonly { href: string; label: string; icon: React.ElementType }[];
  pathname: string;
  onClose: () => void;
}) {
  return (
    <div>
      <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <DrawerNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={pathname === item.href}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  );
});

// ─── Memoized Primary nav item ─────────────────────────────────────────────────
const PrimaryNavItem = React.memo(function PrimaryNavItem({
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
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center rounded-xl p-2.5 gap-0.5 transition-colors",
        "active:scale-95 relative group",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon
        strokeWidth={1.5}
        className={cn(
          "h-5 w-5 transition-transform duration-200",
          isActive ? "scale-110" : "group-hover:scale-105"
        )}
      />
      {isActive && (
        <span
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
          aria-hidden="true"
        />
      )}
    </Link>
  );
});

// ─── Main component ────────────────────────────────────────────────────────────
export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = React.useState(false);
  const [shouldRender, setShouldRender] = React.useState(false);

  // Stable handlers — prevent re-render of memoized children
  const handleClose = React.useCallback(() => setOpen(false), []);
  const handleSignOut = React.useCallback(
    () => signOut({ callbackUrl: "/login" }),
    []
  );

  // Close drawer when route changes (back-button navigation)
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Defer rendering of navigation list to prevent animation stutter on mobile
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setShouldRender(true), 50);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const isMoreActive = !PRIMARY_NAV.some((n) => n.href === pathname);

  return (
    <>
      {/* ── Bottom Nav Bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden shadow-lg"
        aria-label="Bottom navigation"
      >
        <div className="h-full max-w-screen-sm mx-auto">
          <div className="flex items-center justify-around px-2 py-2">
            {PRIMARY_NAV.map((item) => (
              <PrimaryNavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={pathname === item.href}
              />
            ))}

            {/* "More" trigger */}
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={open}
              aria-haspopup="dialog"
              onClick={() => setOpen(true)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center rounded-xl p-2.5 gap-0.5 transition-colors",
                "active:scale-95 relative group",
                isMoreActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <LayoutGrid
                strokeWidth={1.5}
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isMoreActive ? "scale-110" : "group-hover:scale-105"
                )}
              />
              {isMoreActive && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Navigation Drawer ── */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          aria-describedby={undefined}
          className="p-0 rounded-t-2xl max-h-[85dvh] flex flex-col border-0"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/25" aria-hidden="true" />
          </div>

          <SheetHeader className="px-5 pt-1 pb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <Logo width={22} height={22} />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-sm font-semibold truncate text-left leading-snug">
                  {session?.user?.name ?? "IW Expense"}
                </SheetTitle>
                {session?.user?.email && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {session.user.email}
                  </p>
                )}
              </div>
              <ThemeToggle />
            </div>
          </SheetHeader>

          <Separator className="shrink-0" />

          {/* Scrollable nav list */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-5 min-h-[300px]">
            {shouldRender ? (
              DRAWER_SECTIONS.map((section) => (
                <DrawerSection
                  key={section.title}
                  title={section.title}
                  items={section.items}
                  pathname={pathname}
                  onClose={handleClose}
                />
              ))
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent opacity-50" />
              </div>
            )}
          </div>

          <Separator className="shrink-0" />

          {/* Footer: logout */}
          <div className="px-4 py-3 shrink-0 pb-[env(safe-area-inset-bottom,12px)]">
            <button
              type="button"
              onClick={handleSignOut}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                "text-destructive/80 hover:bg-destructive/10 hover:text-destructive",
                "transition-colors active:scale-[0.98]"
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <LogOut className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="flex-1 text-left leading-none font-medium">Sign Out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
