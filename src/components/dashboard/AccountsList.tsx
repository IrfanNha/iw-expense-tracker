"use client";

/**
 * AccountsList
 *
 * Displays all user accounts with icon, name, type, and balance.
 * Supports expand/collapse when > 5 accounts.
 * Includes skeleton loading state.
 */
import * as React from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/money";
import type { Account } from "@/hooks/useAccounts";

// ─── Type order ────────────────────────────────────────────────────────────────

const TYPE_ORDER: Record<string, number> = {
  CASH: 0,
  BANK: 1,
  CARD: 2,
  OTHER: 3,
  E_WALLET: 4,
};

function sortAccounts(accounts: Account[]): Account[] {
  return [...accounts].sort(
    (a, b) => (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99)
  );
}

// ─── Type badge colors ─────────────────────────────────────────────────────────

const TYPE_BADGE_CLASS: Record<string, string> = {
  CASH: "text-emerald-600 dark:text-emerald-400",
  BANK: "text-sky-600 dark:text-sky-400",
  CARD: "text-violet-600 dark:text-violet-400",
  E_WALLET: "text-orange-600 dark:text-orange-400",
  OTHER: "text-muted-foreground",
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AccountSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3.5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 rounded bg-muted" />
          <div className="h-2.5 w-16 rounded bg-muted" />
        </div>
      </div>
      <div className="h-4 w-24 rounded bg-muted" />
    </div>
  );
}

// ─── Single account row ────────────────────────────────────────────────────────

const AccountRow = React.memo(function AccountRow({ account }: { account: Account }) {
  const IconComponent = (
    account.icon && Icons[account.icon as keyof typeof Icons]
      ? Icons[account.icon as keyof typeof Icons]
      : Icons.Wallet
  ) as unknown as React.ComponentType<{ className?: string }>;

  const typeLabel = account.type.toLowerCase().replace("_", " ");
  const typeClass = TYPE_BADGE_CLASS[account.type] ?? "text-muted-foreground";

  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3.5 transition-colors hover:bg-accent/30">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <IconComponent className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">
            {account.name}
          </p>
          <p className={cn("text-xs capitalize mt-0.5 font-medium", typeClass)}>
            {typeLabel}
          </p>
        </div>
      </div>
      <p className="text-sm md:text-base font-semibold tabular-nums shrink-0">
        {formatCurrency(account.balance, account.currency)}
      </p>
    </div>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────

interface AccountsListProps {
  accounts: Account[] | undefined;
  isLoading: boolean;
}

export const AccountsList = React.memo(function AccountsList({
  accounts,
  isLoading,
}: AccountsListProps) {
  const [expanded, setExpanded] = React.useState(false);

  const sorted = React.useMemo(
    () => (accounts ? sortAccounts(accounts) : []),
    [accounts]
  );
  const visible = expanded ? sorted : sorted.slice(0, 5);
  const hiddenCount = sorted.length - 5;

  return (
    <div className="bg-background md:border md:border-border/60 md:rounded-xl md:sticky md:top-4 md:self-start">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4 border-b border-border/60">
        <h2 className="text-sm font-semibold">Accounts</h2>
        <Link href="/dashboard/accounts">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs font-medium text-primary hover:text-primary"
          >
            Manage
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="p-3 md:p-4 space-y-2">
        {isLoading ? (
          <>
            <AccountSkeleton />
            <AccountSkeleton />
            <AccountSkeleton />
          </>
        ) : sorted.length > 0 ? (
          <>
            {visible.map((account) => (
              <AccountRow key={account.id} account={account} />
            ))}
            {sorted.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded((prev) => !prev)}
              >
                {expanded
                  ? "Show less"
                  : `Show ${hiddenCount} more account${hiddenCount > 1 ? "s" : ""}`}
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <Icons.Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No accounts yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Add an account to start tracking
            </p>
            <Link href="/dashboard/accounts">
              <Button size="sm" className="h-8 text-xs">
                Create Account
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
});
