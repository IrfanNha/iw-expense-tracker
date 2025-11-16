"use client";

import * as React from "react";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions, useDeleteTransaction, type Transaction } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/money";
import { Plus, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e"
];

export default function TransactionsPage() {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [activeTab, setActiveTab] = React.useState<"all" | "income" | "expense">("expense");
  const { data: transactions, isLoading: transactionsLoading } = useTransactions({ limit: 1000 });
  const deleteTransaction = useDeleteTransaction();

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

  // Calculate category totals for chart
  const categoryData = React.useMemo(() => {
    if (!filteredTransactions.length) return [];
    
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
  }, [filteredTransactions]);

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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            View and manage all your transactions
          </p>
        </div>
        <TransactionForm
          trigger={
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </Button>
          }
        />
      </div>

      {/* Date Navigation */}
      <Card>
        <CardHeader className="px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-center gap-3 md:gap-4">
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
        </CardHeader>
      </Card>

      {/* Chart and Transactions */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Donut Chart */}
        <Card className="lg:col-span-1">
          <CardHeader className="px-4 py-3 md:px-6 md:py-4">
            <CardTitle className="text-base md:text-lg">
              {activeTab === "expense" ? "Expense" : activeTab === "income" ? "Income" : "All"} by Category
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {formatDateDisplay(selectedDate)}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
            {transactionsLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
            ) : categoryData.length > 0 ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold">
                    {formatCurrency(totalAmount)}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Total {activeTab === "expense" ? "Expense" : activeTab === "income" ? "Income" : ""}
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {categoryData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-xs md:text-sm">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="font-semibold">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No {activeTab === "expense" ? "expense" : activeTab === "income" ? "income" : ""} data for this date
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="px-4 py-3 md:px-6 md:py-4">
              <CardTitle className="text-base md:text-lg">Transaction List</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
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
      </div>
    </div>
  );
}
