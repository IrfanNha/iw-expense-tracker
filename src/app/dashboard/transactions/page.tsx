"use client";

import * as React from "react";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions, useDeleteTransaction, type Transaction } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/money";
import { Plus, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Trash2, Receipt, Pencil } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { DonutChart } from "@/components/charts/DonutChart";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { PercentageMode, getDefaultModeForPeriod } from "@/types/finance";
import { PercentageModeToggle } from "@/components/ui/PercentageModeToggle";
import { Calendar } from "@/components/ui/calendar";
import { Spinner } from "@/components/ui/spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

type Period = "day" | "week" | "month";

export default function TransactionsPage() {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [period, setPeriod] = React.useState<Period>("day");
  const [activeTab, setActiveTab] = React.useState<"all" | "income" | "expense">("all");
  // Percentage mode state with smart default based on period
  // Monthly → Income-based mode, Daily/Weekly → Cash flow proportion mode
  const [percentageMode, setPercentageMode] = React.useState<PercentageMode>(
    () => getDefaultModeForPeriod(period)
  );
  const [showGrouped, setShowGrouped] = React.useState(true);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [transactionToDelete, setTransactionToDelete] = React.useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const { data: transactions, isLoading: transactionsLoading } = useTransactions({ limit: 1000 });
  const deleteTransaction = useDeleteTransaction();

  // Auto-switch percentage mode when period changes
  // Monthly → Mode A (Income-based), Daily/Weekly → Mode B (Cash flow proportion)
  React.useEffect(() => {
    setPercentageMode(getDefaultModeForPeriod(period));
  }, [period]);

  // Helpers for period ranges
  const getStartOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getEndOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const getStartOfWeek = (date: Date) => {
    const d = getStartOfDay(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
  };

  const getEndOfWeek = (date: Date) => {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  const getStartOfMonth = (date: Date) => {
    const d = getStartOfDay(date);
    d.setDate(1);
    return d;
  };

  const getEndOfMonth = (date: Date) => {
    const d = getStartOfMonth(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const formatDateRangeDisplay = (date: Date, currentPeriod: Period) => {
    if (currentPeriod === "day") {
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    if (currentPeriod === "week") {
      const start = getStartOfWeek(date);
      const end = getEndOfWeek(date);
      return `${start.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      })} - ${end.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    }

    const start = getStartOfMonth(date);
    return start.toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
    });
  };

  // Filter transactions by period and type
  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return [];
    let filtered = transactions;

    const start =
      period === "day"
        ? getStartOfDay(selectedDate)
        : period === "week"
        ? getStartOfWeek(selectedDate)
        : getStartOfMonth(selectedDate);
    const end =
      period === "day"
        ? getEndOfDay(selectedDate)
        : period === "week"
        ? getEndOfWeek(selectedDate)
        : getEndOfMonth(selectedDate);

    filtered = filtered.filter((t) => {
      const d = new Date(t.occurredAt);
      return d >= start && d <= end;
    });

    // Filter by type
    if (activeTab === "income") {
      filtered = filtered.filter((t) => t.type === "INCOME");
    } else if (activeTab === "expense") {
      filtered = filtered.filter((t) => t.type === "EXPENSE");
    }

    // Exclude transfer transactions
    filtered = filtered.filter(
      (t) => t.type !== "TRANSFER_DEBIT" && t.type !== "TRANSFER_CREDIT"
    );

    // Sort by time (newest first)
    return filtered.sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
  }, [transactions, selectedDate, activeTab, period]);

  // Calculate income and expense totals for selected period
  const periodTotals = React.useMemo(() => {
    if (!filteredTransactions.length) return { income: 0, expense: 0 };

    const income = filteredTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense };
  }, [filteredTransactions]);

  // Calculate category totals for chart
  const categoryData = React.useMemo(() => {
    if (activeTab === "all" || !filteredTransactions.length) return [];

    const categoryMap = new Map<string, number>();
    filteredTransactions.forEach((t) => {
      const categoryName = t.category?.name || "Uncategorized";
      categoryMap.set(
        categoryName,
        (categoryMap.get(categoryName) || 0) + t.amount
      );
    });

    const total = Array.from(categoryMap.values()).reduce(
      (sum, val) => sum + val,
      0
    );

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, activeTab]);

  const totalAmount = categoryData.reduce((sum, item) => sum + item.value, 0);

  const handleDelete = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransaction.mutateAsync(transactionToDelete);
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to delete transaction");
      setErrorDialogOpen(true);
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-0.5 sm:mt-1">
            View and manage all your transactions
          </p>
        </div>
      </div>

      {/* Chart and Transactions */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 lg:grid-cols-[420px_1fr]">
        {/* Chart */}
        <Card className="border rounded-sm">
          <CardHeader className="px-3 py-2.5 md:px-6 md:py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm md:text-lg font-semibold">
                  {activeTab === "all"
                    ? "Expense & Savings"
                    : activeTab === "expense"
                    ? "Expense by Category"
                    : "Income by Category"}
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {formatDateRangeDisplay(selectedDate, period)}
                </CardDescription>
              </div>
              {/* Percentage Mode Toggle - Only shown for 'all' tab */}
              {activeTab === "all" && (
                <PercentageModeToggle
                  mode={percentageMode}
                  onModeChange={setPercentageMode}
                  hasIncome={periodTotals.income > 0}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-6 md:py-12">
                <Spinner className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
              </div>
            ) : activeTab === "all" ? (
              // Dual-mode financial visualization
              // Mode A (Income-based): Shows expense and savings as % of income
              // Mode B (Cash flow proportion): Shows proportion of total cash flow
              <IncomeExpenseChart
                income={periodTotals.income}
                expense={periodTotals.expense}
                mode={percentageMode}
              />
            ) : categoryData.length > 0 ? (
              <DonutChart
                data={categoryData}
                totalAmount={totalAmount}
                title={`Total ${
                  activeTab === "expense" ? "Expense" : "Income"
                }`}
              />
            ) : (
              <div className="text-center py-6 md:py-12 text-muted-foreground text-sm md:text-base">
                No {activeTab} data for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction List */}
        <Card className="border rounded-sm">
          <CardHeader className="px-3 py-2.5 md:px-6 md:py-4 space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm md:text-lg font-semibold">
                  Transactions
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  View your {period === "day" ? "daily" : period} transactions
                </CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant={showGrouped ? "secondary" : "ghost"}
                  className="h-8 w-8 md:h-9 md:w-9"
                  onClick={() => setShowGrouped((prev) => !prev)}
                  title={showGrouped ? "Show individual" : "Show grouped"}
                >
                  <Receipt className="h-4 w-4 md:h-4 md:w-4" />
                </Button>
              </div>
            </div>

            {/* Period Selector */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1 rounded-full bg-muted/60 p-1">
                <Button
                  size="sm"
                  variant={period === "day" ? "default" : "ghost"}
                  className="h-8 px-3 text-xs md:h-9 md:px-4 md:text-sm rounded-full"
                  onClick={() => setPeriod("day")}
                >
                  Day
                </Button>
                <Button
                  size="sm"
                  variant={period === "week" ? "default" : "ghost"}
                  className="h-8 px-3 text-xs md:h-9 md:px-4 md:text-sm rounded-full"
                  onClick={() => setPeriod("week")}
                >
                  Week
                </Button>
                <Button
                  size="sm"
                  variant={period === "month" ? "default" : "ghost"}
                  className="h-8 px-3 text-xs md:h-9 md:px-4 md:text-sm rounded-full"
                  onClick={() => setPeriod("month")}
                >
                  Month
                </Button>
              </div>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-center rounded-full border px-2 py-2 md:px-3 md:py-2.5 bg-muted/30">
              <div className="flex items-center gap-1.5 md:gap-2.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setSelectedDate(
                      new Date(
                        selectedDate.getTime() -
                          (period === "day"
                            ? 1
                            : period === "week"
                            ? 7
                            : 30) *
                            24 *
                            60 *
                            60 *
                            1000
                      )
                    )
                  }
                  className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-background hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4 md:h-4 md:w-4" />
                </Button>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex flex-col items-center justify-center h-auto py-1.5 px-3 md:px-4 hover:bg-muted rounded-md min-w-[120px] md:min-w-[140px]"
                      )}
                    >
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {period === "day"
                          ? "Today"
                          : period === "week"
                          ? "This week"
                          : "This month"}
                      </span>
                      <span className="text-sm md:text-base font-semibold">
                        {formatDateRangeDisplay(selectedDate, period)}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setCalendarOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setSelectedDate(
                      new Date(
                        selectedDate.getTime() +
                          (period === "day"
                            ? 1
                            : period === "week"
                            ? 7
                            : 30) *
                            24 *
                            60 *
                            60 *
                            1000
                      )
                    )
                  }
                  className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-background hover:bg-muted"
                >
                  <ChevronRight className="h-4 w-4 md:h-4 md:w-4" />
                </Button>
              </div>
            </div>

            {/* Transaction Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v as "all" | "income" | "expense");
              }}
            >
              <TabsList className="grid w-full grid-cols-3 h-9 md:h-10 rounded-full bg-muted/60">
                <TabsTrigger
                  value="all"
                  className="text-xs sm:text-sm md:text-sm rounded-full data-[state=active]:bg-background"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="expense"
                  className="flex items-center gap-1 md:gap-1.5 text-xs sm:text-sm md:text-sm rounded-full data-[state=active]:bg-background"
                >
                  <TrendingDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span>Exp</span>
                </TabsTrigger>
                <TabsTrigger
                  value="income"
                  className="flex items-center gap-1 md:gap-1.5 text-xs sm:text-sm md:text-sm rounded-full data-[state=active]:bg-background"
                >
                  <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span>Inc</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-3 md:mt-4">
                {transactionsLoading ? (
                  <div className="flex items-center justify-center py-6 md:py-12">
                    <Spinner className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-6 md:py-12">
                    <p className="text-muted-foreground mb-1 text-sm md:text-base">
                      No transactions found
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {activeTab === "all"
                        ? `No transactions in this ${period}`
                        : `No ${activeTab} transactions in this ${period}`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    {showGrouped
                      ? Object.entries(
                          filteredTransactions.reduce((acc, t) => {
                            const key = t.category?.name || "Other";
                            if (!acc[key]) {
                              acc[key] = {
                                label: key,
                                total: 0,
                                isIncome: t.type === "INCOME",
                                items: [] as typeof filteredTransactions,
                              };
                            }
                            acc[key].total +=
                              t.amount * (t.type === "INCOME" ? 1 : -1);
                            acc[key].items.push(t);
                            return acc;
                          }, {} as {
                            [key: string]: {
                              label: string;
                              total: number;
                              isIncome: boolean;
                              items: typeof filteredTransactions;
                            };
                          })
                        ).map(([key, group]) => {
                          const isPositive = group.total >= 0;
                          const IconComponent =
                            group.items[0]?.category?.icon &&
                            Icons[
                              group.items[0].category
                                .icon as keyof typeof Icons
                            ]
                              ? (Icons[
                                  group.items[0].category
                                    .icon as keyof typeof Icons
                                ] as React.ComponentType<{
                                  className?: string;
                                }>)
                              : group.isIncome
                              ? TrendingUp
                              : TrendingDown;

                          return (
                            <div
                              key={key}
                              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2.5 md:px-4 md:py-3"
                            >
                              <div className="flex items-center gap-2.5 md:gap-3">
                                <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-muted">
                                  <IconComponent
                                    className={cn(
                                      "h-4 w-4 md:h-5 md:w-5",
                                      group.isIncome
                                        ? "text-green-600"
                                        : "text-red-600"
                                    )}
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm md:text-sm font-semibold">
                                    {group.label}
                                  </span>
                                  <span className="text-xs md:text-xs text-muted-foreground">
                                    {group.items.length} transaction
                                    {group.items.length > 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p
                                  className={cn(
                                    "text-sm sm:text-base md:text-base lg:text-lg font-bold",
                                    isPositive
                                      ? "text-green-600"
                                      : "text-red-600"
                                  )}
                                >
                                  {group.total > 0 ? "+" : "-"}
                                  {formatCurrency(Math.abs(group.total))}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      : filteredTransactions.map((transaction) => {
                          const isIncome = transaction.type === "INCOME";
                          const CategoryIcon =
                            transaction.category?.icon &&
                            Icons[
                              transaction.category
                                .icon as keyof typeof Icons
                            ]
                              ? (Icons[
                                  transaction.category
                                    .icon as keyof typeof Icons
                                ] as React.ComponentType<{
                                  className?: string;
                                }>)
                              : isIncome
                              ? TrendingUp
                              : TrendingDown;

                          return (
                            <div
                              key={transaction.id}
                              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2.5 md:px-4 md:py-3"
                            >
                              <div className="flex items-center gap-2.5 md:gap-3 flex-1 min-w-0">
                                <div
                                  className={cn(
                                    "flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full",
                                    isIncome
                                      ? "bg-green-500/10 text-green-600"
                                      : "bg-red-500/10 text-red-600"
                                  )}
                                >
                                  <CategoryIcon className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <div className="flex flex-col min-w-0 gap-1">
                                  <span className="text-sm md:text-sm font-semibold">
                                    {transaction.category?.name || "Other"}
                                  </span>
                                  {transaction.account?.name && (
                                    <Badge variant="outline" className="text-xs w-fit">
                                      {transaction.account.name}
                                    </Badge>
                                  )}
                                  {transaction.note && (
                                    <span className="text-xs md:text-xs text-muted-foreground truncate">
                                      {transaction.note}
                                    </span>
                                  )}
                                  <span className="text-xs md:text-xs text-muted-foreground">
                                    {new Date(
                                      transaction.occurredAt
                                    ).toLocaleTimeString("id-ID", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0 pl-2 md:pl-4">
                                <p
                                  className={cn(
                                    "text-sm sm:text-base md:text-base lg:text-lg font-bold",
                                    isIncome
                                      ? "text-green-600"
                                      : "text-red-600"
                                  )}
                                >
                                  {isIncome ? "+" : "-"}
                                  {formatCurrency(
                                    transaction.amount,
                                    transaction.account?.currency || "IDR"
                                  )}
                                </p>
                                <div className="flex items-center gap-1">
                                  {transaction.type !== "TRANSFER_DEBIT" && 
                                   transaction.type !== "TRANSFER_CREDIT" && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditingTransaction(transaction)}
                                      className="h-7 w-7 md:h-8 md:w-8"
                                      title="Edit transaction"
                                    >
                                      <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleDelete(transaction.id)
                                    }
                                    className="h-7 w-7 md:h-8 md:w-8"
                                    title="Delete transaction"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-20 right-4 md:bottom-10 md:right-10 z-30">
        <TransactionForm
          trigger={
            <Button className="h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg" size="icon">
              <Plus className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          }
        />
      </div>

      {/* Edit Transaction Form */}
      {editingTransaction && (
        <TransactionForm
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTransaction(null);
            }
          }}
          onSuccess={() => setEditingTransaction(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
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
            <AlertDialogAction onClick={confirmDelete} disabled={deleteTransaction.isPending}>
              {deleteTransaction.isPending ? (
                <span className="flex items-center">
                  <Spinner className="mr-2 h-4 w-4" />
                  Deleting...
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