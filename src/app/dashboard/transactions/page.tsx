"use client";

/**
 * /dashboard/transactions
 *
 * Reuses the same hooks + components as /dashboard — no code duplication.
 * All filtering, grouping, sorting, search logic lives in shared hooks.
 */
import * as React from "react";
import { Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { useTransactions, useDeleteTransaction, type Transaction } from "@/hooks/useTransactions";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { usePeriodTransactions } from "@/hooks/usePeriodTransactions";
import { TransactionChart, TransactionList } from "@/components/dashboard";

export default function TransactionsPage() {
  // ─── Data ─────────────────────────────────────────────────────────────────
  const { data: transactions, isLoading: transactionsLoading } = useTransactions({ limit: 1000 });
  const deleteTransaction = useDeleteTransaction();

  // ─── Shared filter state ───────────────────────────────────────────────────
  const filters = useDashboardFilters();

  // ─── Derived data ──────────────────────────────────────────────────────────
  const derived = usePeriodTransactions(transactions, {
    selectedDate: filters.selectedDate,
    period: filters.period,
    activeTab: filters.activeTab,
    sortOrder: filters.sortOrder,
    searchQuery: filters.searchQuery,
  });

  // ─── Dialog state ──────────────────────────────────────────────────────────
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [transactionToDelete, setTransactionToDelete] = React.useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleDelete = React.useCallback((id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = React.useCallback(async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransaction.mutateAsync(transactionToDelete);
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to delete transaction";
      setErrorMessage(msg);
      setErrorDialogOpen(true);
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  }, [transactionToDelete, deleteTransaction]);

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 pt-4 md:px-6 md:pt-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            View and manage all your transactions
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="tabular-nums">
            {derived.filteredTransactions.length} records
          </span>
        </div>
      </div>

      {/* Chart + Transactions — two-column on desktop, stacked on mobile */}
      <div className="space-y-3 md:space-y-4 md:grid md:grid-cols-[380px_1fr] lg:grid-cols-[420px_1fr] md:gap-4 lg:gap-5 md:items-start md:px-4 lg:px-6 md:pb-6">
        {/* Chart — sticky on desktop */}
        <div className="md:sticky md:top-4 md:self-start">
          <TransactionChart
            activeTab={filters.activeTab}
            period={filters.period}
            selectedDate={filters.selectedDate}
            periodTotals={derived.periodTotals}
            categoryData={derived.categoryData}
            totalAmount={derived.totalAmount}
            percentageMode={filters.percentageMode}
            onModeChange={filters.setPercentageMode}
            isLoading={transactionsLoading}
          />
        </div>

        {/* Transaction list */}
        <TransactionList
          filteredTransactions={derived.filteredTransactions}
          searchedTransactions={derived.searchedTransactions}
          groupedTransactions={derived.groupedTransactions}
          isLoading={transactionsLoading}
          period={filters.period}
          onPeriodChange={filters.setPeriod}
          selectedDate={filters.selectedDate}
          onDateSelect={filters.setSelectedDate}
          onNavigate={filters.navigateDate}
          calendarOpen={filters.calendarOpen}
          onCalendarOpenChange={filters.setCalendarOpen}
          activeTab={filters.activeTab}
          onTabChange={filters.setActiveTab}
          sortOrder={filters.sortOrder}
          onSortChange={filters.setSortOrder}
          searchQuery={filters.searchQuery}
          onSearchQueryChange={filters.setSearchQuery}
          searchOpen={filters.searchOpen}
          onSearchOpenChange={filters.setSearchOpen}
          searchInputRef={filters.searchInputRef}
          showGrouped={filters.showGrouped}
          onShowGroupedToggle={() => filters.setShowGrouped((p) => !p)}
          onEdit={setEditingTransaction}
          onDelete={handleDelete}
        />
      </div>

      {/* ── Floating Add Button ─────────────────────────────────────────────── */}
      <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-30">
        <TransactionForm
          trigger={
            <Button
              className="h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg shadow-primary/20"
              size="icon"
            >
              <Plus className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          }
        />
      </div>

      {/* ── Edit Transaction ────────────────────────────────────────────────── */}
      {editingTransaction && (
        <TransactionForm
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => {
            if (!open) setEditingTransaction(null);
          }}
          onSuccess={() => setEditingTransaction(null)}
        />
      )}

      {/* ── Delete Confirmation ─────────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteTransaction.isPending}
            >
              {deleteTransaction.isPending ? (
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

      {/* ── Error Dialog ────────────────────────────────────────────────────── */}
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