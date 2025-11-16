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
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs md:text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-lg md:text-xl lg:text-2xl font-bold">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All accounts
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs md:text-sm font-medium">Income</CardTitle>
            <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-lg md:text-xl lg:text-2xl font-bold text-green-600">
              {reportLoading ? "..." : formatCurrency(report?.income || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs md:text-sm font-medium">Expense</CardTitle>
            <TrendingDown className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-600" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-lg md:text-xl lg:text-2xl font-bold text-red-600">
              {reportLoading ? "..." : formatCurrency(report?.expense || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs md:text-sm font-medium">Net</CardTitle>
            <ArrowLeftRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className={`text-lg md:text-xl lg:text-2xl font-bold ${
              (report?.net || 0) >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {reportLoading ? "..." : formatCurrency(report?.net || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts */}
      <Card>
        <CardHeader className="px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg md:text-xl">Accounts</CardTitle>
              <CardDescription className="text-xs md:text-sm">Your financial accounts</CardDescription>
            </div>
            <Link href="/dashboard/accounts">
              <Button variant="outline" size="sm">Manage</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
          {accountsLoading ? (
            <div className="text-center py-6 text-muted-foreground text-sm">Loading accounts...</div>
          ) : accounts && accounts.length > 0 ? (
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.slice(0, 6).map((account) => {
                const IconComponent = account.icon && Icons[account.icon as keyof typeof Icons]
                  ? Icons[account.icon as keyof typeof Icons]
                  : Icons.Wallet;
                
                return (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <IconComponent className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">{account.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{account.type.toLowerCase().replace("_", " ")}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-sm md:text-base">
                        {formatCurrency(account.balance, account.currency)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-3 text-sm">No accounts yet</p>
              <Link href="/dashboard/accounts">
                <Button size="sm">Create Account</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Section */}
      <Card>
        <CardHeader className="px-4 py-3 md:px-6 md:py-4">
          <CardTitle className="text-lg md:text-xl">Transactions</CardTitle>
          <CardDescription className="text-xs md:text-sm">View your daily transactions</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
          {/* Date Navigation */}
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousDay}
              className="h-9 w-9 md:h-10 md:w-10"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <div className="text-center min-w-[150px] md:min-w-[200px]">
              <p className="text-sm md:text-base lg:text-lg font-semibold">
                {formatDateDisplay(selectedDate)}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextDay}
              className="h-9 w-9 md:h-10 md:w-10"
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>

          {/* Transaction Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as "all" | "income" | "expense");
          }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="text-xs md:text-sm">All</TabsTrigger>
              <TabsTrigger value="expense" className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                <TrendingDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Expense</span>
                <span className="sm:hidden">Exp</span>
              </TabsTrigger>
              <TabsTrigger value="income" className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Income</span>
                <span className="sm:hidden">Inc</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 md:mt-6">
              {transactionsLoading ? (
                <div className="text-center py-8 md:py-12 text-muted-foreground text-sm">
                  Loading transactions...
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <p className="text-muted-foreground mb-2 text-sm">No transactions found</p>
                  <p className="text-xs text-muted-foreground">
                    {activeTab === "all"
                      ? `No transactions on ${formatDateDisplay(selectedDate)}`
                      : `No ${activeTab} transactions on ${formatDateDisplay(selectedDate)}`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransactions.map((transaction) => {
                    const isIncome = transaction.type === "INCOME";
                    const Icon = isIncome ? TrendingUp : TrendingDown;
                    const AccountIcon =
                      transaction.account?.icon &&
                      Icons[transaction.account.icon as keyof typeof Icons]
                        ? Icons[transaction.account.icon as keyof typeof Icons]
                        : Icons.Wallet;

                    return (
                      <Card
                        key={transaction.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-3 md:p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                              <div
                                className={cn(
                                  "flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-xl flex-shrink-0",
                                  isIncome
                                    ? "bg-green-500/10 text-green-600"
                                    : "bg-red-500/10 text-red-600"
                                )}
                              >
                                <Icon className="h-5 w-5 md:h-6 md:w-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm md:text-base truncate">
                                    {transaction.category?.name || "Uncategorized"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground mt-0.5">
                                  <AccountIcon className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {transaction.account?.name}
                                  </span>
                                </div>
                                {transaction.note && (
                                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                                    {transaction.note}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                              <div className="text-right">
                                <p
                                  className={cn(
                                    "text-base md:text-lg font-bold whitespace-nowrap",
                                    isIncome ? "text-green-600" : "text-red-600"
                                  )}
                                >
                                  {isIncome ? "+" : "-"}
                                  {formatCurrency(
                                    transaction.amount,
                                    transaction.account?.currency || "IDR"
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
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
                                className="h-7 w-7 md:h-8 md:w-8"
                              >
                                <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
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
  );
}

