"use client";

import * as React from "react";
import { ArrowLeftRight, ArrowRight, Plus, Trash2 } from "lucide-react";
import * as Icons from "lucide-react";
import { TransferForm } from "@/components/forms/TransferForm";
import { useTransfers, useDeleteTransfer } from "@/hooks/useTransfer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type Transfer = NonNullable<ReturnType<typeof useTransfers>["data"]>[number];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TransferSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-20 rounded bg-muted" />
            <div className="h-2.5 w-32 rounded bg-muted" />
          </div>
        </div>
        <div className="h-6 w-16 rounded bg-muted" />
      </div>
      <div className="flex items-center gap-3 pt-3 border-t border-border/60">
        <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
        <div className="h-3 flex-1 rounded bg-muted" />
        <div className="h-4 w-4 rounded bg-muted" />
        <div className="h-3 flex-1 rounded bg-muted" />
        <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
      </div>
    </div>
  );
}

// ─── Single transfer card ─────────────────────────────────────────────────────

const TransferCard = React.memo(function TransferCard({
  transfer,
  onDelete,
}: {
  transfer: Transfer;
  onDelete: (id: string) => void;
}) {
  const FromIcon = (
    transfer.fromAccount?.icon && Icons[transfer.fromAccount.icon as keyof typeof Icons]
      ? Icons[transfer.fromAccount.icon as keyof typeof Icons]
      : Icons.Wallet
  ) as unknown as React.ComponentType<{ className?: string }>;

  const ToIcon = (
    transfer.toAccount?.icon && Icons[transfer.toAccount.icon as keyof typeof Icons]
      ? Icons[transfer.toAccount.icon as keyof typeof Icons]
      : Icons.Wallet
  ) as unknown as React.ComponentType<{ className?: string }>;

  const timeStr = new Date(transfer.createdAt).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group rounded-xl border border-border/60 bg-card p-4 transition-colors hover:bg-accent/20">
      {/* Top row: icon + label + amount + delete */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <ArrowLeftRight className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Transfer</p>
            {transfer.note && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[160px]">
                {transfer.note}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground/70 tabular-nums mt-0.5">
              {timeStr}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <p className="text-sm font-bold tabular-nums">
            {formatCurrency(transfer.amount, transfer.fromAccount?.currency || "IDR")}
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(transfer.id)}
            className="h-7 w-7 ml-1 rounded-lg text-muted-foreground hover:text-destructive md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            title="Delete transfer"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Bottom row: from → to accounts */}
      <div className="flex items-center gap-2 pt-3 border-t border-border/60">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/10">
            <FromIcon className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-xs font-medium truncate">
            {transfer.fromAccount?.name || "Unknown"}
          </p>
        </div>

        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <p className="text-xs font-medium truncate text-right">
            {transfer.toAccount?.name || "Unknown"}
          </p>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
            <ToIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── Date group divider ───────────────────────────────────────────────────────

function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="h-px flex-1 bg-border/60" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 shrink-0">
        {date}
      </span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold mb-1">No transfers yet</p>
      <p className="text-xs text-muted-foreground mb-5">
        Transfer funds between your accounts to get started
      </p>
      <TransferForm
        trigger={
          <Button size="sm" className="rounded-lg gap-2">
            <Plus className="h-3.5 w-3.5" />
            New Transfer
          </Button>
        }
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TransferPage() {
  const { data: transfers, isLoading } = useTransfers();
  const deleteTransfer = useDeleteTransfer();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [transferToDelete, setTransferToDelete] = React.useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleDelete = React.useCallback((id: string) => {
    setTransferToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = React.useCallback(async () => {
    if (!transferToDelete) return;
    try {
      await deleteTransfer.mutateAsync(transferToDelete);
      setDeleteDialogOpen(false);
      setTransferToDelete(null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to delete transfer";
      setErrorMessage(msg);
      setErrorDialogOpen(true);
      setDeleteDialogOpen(false);
      setTransferToDelete(null);
    }
  }, [transferToDelete, deleteTransfer]);

  // Group by date label
  const groupedTransfers = React.useMemo(() => {
    if (!transfers) return [];
    const groups: Record<string, Transfer[]> = {};
    transfers.forEach((t) => {
      const label = new Date(t.createdAt).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!groups[label]) groups[label] = [];
      groups[label].push(t);
    });
    return Object.entries(groups);
  }, [transfers]);

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 pt-4 md:px-6 md:pt-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Transfers</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Move funds between your accounts
          </p>
        </div>
        <TransferForm
          trigger={
            <Button size="sm" className="rounded-lg gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Transfer</span>
              <span className="sm:hidden">New</span>
            </Button>
          }
        />
      </div>

      {/* Content */}
      <div className="px-4 pb-6 md:px-6 md:pb-8 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <TransferSkeleton />
            <TransferSkeleton />
            <TransferSkeleton />
          </div>
        ) : groupedTransfers.length > 0 ? (
          <div className="space-y-4">
            {groupedTransfers.map(([date, dayTransfers]) => (
              <div key={date} className="space-y-2">
                <DateDivider date={date} />
                {dayTransfers.map((transfer) => (
                  <TransferCard
                    key={transfer.id}
                    transfer={transfer}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              This will revert the account balances. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteTransfer.isPending}
            >
              {deleteTransfer.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Deleting…
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialogOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
