"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/money";
import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight, Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import * as Icons from "lucide-react";
import { TransactionForm } from "@/components/TransactionForm";
import { TransferForm } from "@/components/TransferForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteTransaction } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";
import * as React from "react";
import Link from "next/link";
import { DonutChart } from "@/components/DonutChart";
import { IncomeExpenseChart } from "@/components/IncomeExpenseChart";

async function fetchMonthlyReport() {
  const res = await fetch("/api/reports/monthly");
  if (!res.ok) throw new Error("Failed to fetch report");
  return res.json();
}

export default function DashboardPage() {
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ["reports", "monthly"],
    queryFn: fetchMonthlyReport,
  });

  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [activeTab, setActiveTab] = React.useState<"all" | "income" | "expense">("all");
  const { data: transactions, isLoading: transactionsLoading } = useTransactions({ limit: 1000 });
  const deleteTransaction = useDeleteTransaction();

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;

  // Format date for display
  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Format date for filtering (YYYY-MM-DD)
  const formatDateForFilter = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Navigate dates
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  // Filter transactions by date and type
  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return [];
    let filtered = transactions;

    // Filter by date
    const selectedDateStr = formatDateForFilter(selectedDate);
    filtered = filtered.filter((t) => {
      const transactionDate = formatDateForFilter(new Date(t.occurredAt));
      return transactionDate === selectedDateStr;
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
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
  }, [transactions, selectedDate, activeTab]);

  // Calculate income and expense totals for selected date
  const dayTotals = React.useMemo(() => {
    if (!transactions) return { income: 0, expense: 0 };
    const selectedDateStr = formatDateForFilter(selectedDate);
    const dayTransactions = transactions.filter((t) => {
      const transactionDate = formatDateForFilter(new Date(t.occurredAt));
      return transactionDate === selectedDateStr && 
             t.type !== "TRANSFER_DEBIT" && 
             t.type !== "TRANSFER_CREDIT";
    });

    const income = dayTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expense };
  }, [transactions, selectedDate]);

  // Calculate category totals for chart (only for income/expense tabs)
  const categoryData = React.useMemo(() => {
    if (activeTab === "all" || !filteredTransactions.length) return [];
    
    const categoryMap = new Map<string, number>();
    filteredTransactions.forEach((t) => {
      const categoryName = t.category?.name || "Uncategorized";
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + t.amount);
    });

    const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);
    
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, activeTab]);

  const totalAmount = categoryData.reduce((sum, item) => sum + item.value, 0);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction.mutateAsync(id);
      } catch (error: any) {
        alert(error.message || "Failed to delete transaction");
      }
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Overview of your finances</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <TransactionForm
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Transaction</span>
                <span className="sm:hidden">Add</span>
              </Button>
            }
          />
          <TransferForm
            trigger={
              <Button size="sm" className="gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                Transfer
              </Button>
            }
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight">Total Balance</CardTitle>
            <Wallet className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold leading-tight">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
              All accounts
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight">Income</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-green-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-green-600 leading-tight">
              {reportLoading ? "..." : formatCurrency(report?.income || 0)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight">Expense</CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-red-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-red-600 leading-tight">
              {reportLoading ? "..." : formatCurrency(report?.expense || 0)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight">Net</CardTitle>
            <ArrowLeftRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold leading-tight ${
              (report?.net || 0) >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {reportLoading ? "..." : formatCurrency(report?.net || 0)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts */}
      <Card>
        <CardHeader className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl">Accounts</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm">Your financial accounts</CardDescription>
            </div>
            <Link href="/dashboard/accounts">
              <Button variant="outline" size="sm" className="h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm">Manage</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6">
          {accountsLoading ? (
            <div className="text-center py-4 sm:py-6 text-muted-foreground text-xs sm:text-sm">Loading accounts...</div>
          ) : accounts && accounts.length > 0 ? (
            <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.slice(0, 6).map((account) => {
                const IconComponent = account.icon && Icons[account.icon as keyof typeof Icons]
                  ? (Icons[account.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>)
                  : Icons.Wallet;
                
                return (
                  <div
                    key={account.id}
                    className="flex items-center gap-2 sm:gap-3 rounded-lg border p-2 sm:p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm md:text-base truncate">{account.name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground capitalize">{account.type.toLowerCase().replace("_", " ")}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-xs sm:text-sm md:text-base">
                        {formatCurrency(account.balance, account.currency)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 sm:py-6">
              <p className="text-muted-foreground mb-2 sm:mb-3 text-xs sm:text-sm">No accounts yet</p>
              <Link href="/dashboard/accounts">
                <Button size="sm" className="h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm">Create Account</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Section */}
      <div className="grid gap-3 md:gap-4 lg:grid-cols-3">
        {/* Chart Section */}
        <Card className="lg:col-span-1">
          <CardHeader className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
            <CardTitle className="text-sm sm:text-base md:text-lg">
              {activeTab === "all" ? "Income vs Expense" : activeTab === "expense" ? "Expense by Category" : "Income by Category"}
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs md:text-sm">
              {formatDateDisplay(selectedDate)}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6">
            {transactionsLoading ? (
              <div className="text-center py-8 text-muted-foreground text-xs">Loading...</div>
            ) : activeTab === "all" ? (
              <IncomeExpenseChart income={dayTotals.income} expense={dayTotals.expense} />
            ) : categoryData.length > 0 ? (
              <DonutChart
                data={categoryData}
                totalAmount={totalAmount}
                title={`Total ${activeTab === "expense" ? "Expense" : "Income"}`}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground text-xs">
                No {activeTab} data for this date
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
              <CardTitle className="text-sm sm:text-base md:text-lg">Transactions</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm">View your daily transactions</CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6">
              {/* Date Navigation */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousDay}
                  className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                </Button>
                <div className="text-center min-w-[120px] sm:min-w-[150px] md:min-w-[200px]">
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold">
                    {formatDateDisplay(selectedDate)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextDay}
                  className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
                >
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                </Button>
              </div>

              {/* Transaction Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => {
                setActiveTab(v as "all" | "income" | "expense");
              }}>
                <TabsList className="grid w-full grid-cols-3 h-8 sm:h-9 md:h-10">
                  <TabsTrigger value="all" className="text-[10px] sm:text-xs md:text-sm">All</TabsTrigger>
                  <TabsTrigger value="expense" className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs md:text-sm">
                    <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Expense</span>
                    <span className="sm:hidden">Exp</span>
                  </TabsTrigger>
                  <TabsTrigger value="income" className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs md:text-sm">
                    <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Income</span>
                    <span className="sm:hidden">Inc</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-3 sm:mt-4 md:mt-6">
                  {transactionsLoading ? (
                    <div className="text-center py-6 sm:py-8 md:py-12 text-muted-foreground text-xs sm:text-sm">
                      Loading transactions...
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 md:py-12">
                      <p className="text-muted-foreground mb-2 text-xs sm:text-sm">No transactions found</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {activeTab === "all"
                          ? `No transactions on ${formatDateDisplay(selectedDate)}`
                          : `No ${activeTab} transactions on ${formatDateDisplay(selectedDate)}`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2">
                      {filteredTransactions.map((transaction) => {
                        const isIncome = transaction.type === "INCOME";
                        const Icon = isIncome ? TrendingUp : TrendingDown;
                        const AccountIcon =
                          transaction.account?.icon &&
                          Icons[transaction.account.icon as keyof typeof Icons]
                            ? (Icons[transaction.account.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>)
                            : Icons.Wallet;

                        return (
                          <Card
                            key={transaction.id}
                            className="hover:shadow-md transition-shadow"
                          >
                            <CardContent className="p-2 sm:p-3 md:p-4">
                              <div className="flex items-center justify-between gap-2 sm:gap-3">
                                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                                  <div
                                    className={cn(
                                      "flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-lg md:rounded-xl flex-shrink-0",
                                      isIncome
                                        ? "bg-green-500/10 text-green-600"
                                        : "bg-red-500/10 text-red-600"
                                    )}
                                  >
                                    <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                      <p className="font-semibold text-xs sm:text-sm md:text-base truncate">
                                        {transaction.category?.name || "Uncategorized"}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5">
                                      <AccountIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                      <span className="truncate">
                                        {transaction.account?.name}
                                      </span>
                                    </div>
                                    {transaction.note && (
                                      <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                                        {transaction.note}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-shrink-0">
                                  <div className="text-right">
                                    <p
                                      className={cn(
                                        "text-sm sm:text-base md:text-lg font-bold whitespace-nowrap",
                                        isIncome ? "text-green-600" : "text-red-600"
                                      )}
                                    >
                                      {isIncome ? "+" : "-"}
                                      {formatCurrency(
                                        transaction.amount,
                                        transaction.account?.currency || "IDR"
                                      )}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                                      {new Date(transaction.occurredAt).toLocaleTimeString("id-ID", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(transaction.id)}
                                    className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8"
                                  >
                                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

