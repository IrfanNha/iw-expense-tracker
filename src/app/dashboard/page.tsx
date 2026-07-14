"use client";

import * as React from "react";
import { Plus } from "lucide-react";
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
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions, useDeleteTransaction, type Transaction } from "@/hooks/useTransactions";
import { useMonthlyReport } from "@/hooks/useMonthlyReport";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { usePeriodTransactions } from "@/hooks/usePeriodTransactions";
import {
  BalanceHeader,
  AccountsList,
  TransactionChart,
  TransactionList,
} from "@/components/dashboard";

export default function DashboardPage() {
  // ─── Data ────────────────────────────────────────────────────────────────────
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions({ limit: 9999 });
  const { data: report, isLoading: reportLoading } = useMonthlyReport();
  const deleteTransaction = useDeleteTransaction();

  // ─── UI Filters (period, date, tab, sort, search, view mode…) ────────────────
  const filters = useDashboardFilters();

  // ─── Derived data (filtering, grouping, totals, chart data…) ─────────────────
  const derived = usePeriodTransactions(transactions, {
    selectedDate: filters.selectedDate,
    period: filters.period,
    activeTab: filters.activeTab,
    sortOrder: filters.sortOrder,
    searchQuery: filters.searchQuery,
  });

  // ─── Aggregates ───────────────────────────────────────────────────────────────
  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) ?? 0;
  const income = report?.income ?? derived.periodTotals.income;
  const expense = report?.expense ?? derived.periodTotals.expense;
  const net = report?.net ?? (derived.periodTotals.income - derived.periodTotals.expense);

  // ─── Dialog state ─────────────────────────────────────────────────────────────
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [transactionToDelete, setTransactionToDelete] = React.useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  // ─── Handlers ─────────────────────────────────────────────────────────────────
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
      {/* Balance + Summary */}
      <BalanceHeader
        totalBalance={totalBalance}
        income={income}
        expense={expense}
        net={net}
        reportLoading={reportLoading}
        accountsLoading={accountsLoading}
      />

      {/* Main grid: Accounts (left) | Chart + Transactions (right) */}
      <div className="space-y-3 md:space-y-4 md:grid md:grid-cols-[360px_1fr] lg:grid-cols-[400px_1fr] md:gap-4 lg:gap-5 md:items-start md:px-4 lg:px-6 md:pb-6">
        {/* Accounts */}
        <AccountsList accounts={accounts} isLoading={accountsLoading} />

        {/* Chart + Transaction list */}
        <div className="space-y-3 md:space-y-4">
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

          <TransactionList
            filteredTransactions={derived.filteredTransactions}
            searchedTransactions={derived.searchedTransactions}
            groupedTransactions={derived.groupedTransactions}
            isLoading={transactionsLoading}
            periodTotals={derived.periodTotals}
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
            onShowGroupedToggle={() => filters.setShowGrouped((prev) => !prev)}
            onEdit={setEditingTransaction}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* ── Floating Add Button ─────────────────────────────────────────────── */}
      <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-30">
        <TransactionForm
          trigger={
            <Button
              className="h-12 w-12 md:h-14 md:w-14 rounded-full shadow-md"
              size="icon"
            >
              <Plus className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          }
        />
      </div>

      {/* ── Edit Transaction Form ───────────────────────────────────────────── */}
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

      {/* ── Delete Confirmation Dialog ──────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
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
