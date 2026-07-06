"use client";

/**
 * TransactionItem
 *
 * Single row for an individual transaction in the list view.
 * Shows icon, category, account badge, note, time, amount, edit & delete actions.
 */
import * as React from "react";
import * as Icons from "lucide-react";
import { TrendingUp, TrendingDown, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/money";
import type { Transaction } from "@/hooks/useTransactions";

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const TRANSFER_TYPES = new Set(["TRANSFER_DEBIT", "TRANSFER_CREDIT"]);

export const TransactionItem = React.memo(function TransactionItem({
  transaction,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const isIncome = transaction.type === "INCOME";
  const isTransfer = TRANSFER_TYPES.has(transaction.type);

  const CategoryIcon = (
    transaction.category?.icon &&
    Icons[transaction.category.icon as keyof typeof Icons]
      ? Icons[transaction.category.icon as keyof typeof Icons]
      : isIncome
      ? TrendingUp
      : TrendingDown
  ) as unknown as React.ComponentType<{ className?: string }>;

  const timeStr = new Date(transaction.occurredAt).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-colors hover:bg-accent/30">
      {/* Left: icon + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            isIncome
              ? "bg-emerald-500/10 dark:bg-emerald-500/15"
              : "bg-rose-500/10 dark:bg-rose-500/15"
          )}
        >
          <CategoryIcon
            className={cn(
              "h-5 w-5",
              isIncome
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            )}
          />
        </div>

        <div className="flex flex-col min-w-0 gap-0.5">
          <span className="text-sm font-semibold leading-tight truncate">
            {transaction.category?.name || "Other"}
          </span>

          <div className="flex items-center flex-wrap gap-1">
            {transaction.account?.name && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 font-normal border-border/60"
              >
                {transaction.account.name}
              </Badge>
            )}
            {transaction.note && (
              <span className="text-xs text-muted-foreground truncate max-w-[140px] md:max-w-[200px]">
                {transaction.note}
              </span>
            )}
          </div>

          <span className="text-[10px] text-muted-foreground/70 tabular-nums">
            {timeStr}
          </span>
        </div>
      </div>

      {/* Right: amount + actions */}
      <div className="flex flex-col items-end gap-1 shrink-0 pl-2">
        <p
          className={cn(
            "text-sm md:text-base font-bold tabular-nums",
            isIncome
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          )}
        >
          {isIncome ? "+" : "–"}
          {formatCurrency(transaction.amount, transaction.account?.currency || "IDR")}
        </p>

        {/* Action buttons — always visible on mobile, hover-reveal on desktop */}
        <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {!isTransfer && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(transaction)}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
              title="Edit transaction"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(transaction.id)}
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
            title="Delete transaction"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
});
