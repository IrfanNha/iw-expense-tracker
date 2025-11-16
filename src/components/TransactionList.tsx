"use client";

import * as React from "react";
import { useTransactions, useDeleteTransaction, type Transaction } from "@/hooks/useTransactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/money";
import { Trash2, TrendingUp, TrendingDown, ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionListProps {
  onDelete?: (id: string) => void;
}

export function TransactionList({ onDelete }: TransactionListProps) {
  const [activeTab, setActiveTab] = React.useState<"all" | "income" | "expense">("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 20;

  const { data: transactions, isLoading } = useTransactions({ limit: 1000 });

  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return [];
    let filtered = transactions;

    // Filter by type
    if (activeTab === "income") {
      filtered = filtered.filter((t) => t.type === "INCOME");
    } else if (activeTab === "expense") {
      filtered = filtered.filter((t) => t.type === "EXPENSE");
    }

    // Exclude transfer transactions from main list
    filtered = filtered.filter(
      (t) => t.type !== "TRANSFER_DEBIT" && t.type !== "TRANSFER_CREDIT"
    );

    // Sort by date (newest first)
    return filtered.sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
  }, [transactions, activeTab]);

  // Group by date
  const groupedTransactions = React.useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.occurredAt).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    return groups;
  }, [filteredTransactions]);

  const groupedEntries = Object.entries(groupedTransactions);
  const totalPages = Math.ceil(groupedEntries.length / itemsPerPage);
  const paginatedGroups = groupedEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const deleteTransaction = useDeleteTransaction();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction.mutateAsync(id);
        onDelete?.(id);
      } catch (error: any) {
        alert(error.message || "Failed to delete transaction");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading transactions...</div>
    );
  }

  if (filteredTransactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-2">No transactions found</p>
          <p className="text-sm text-muted-foreground">
            {activeTab === "all"
              ? "Start by adding your first transaction"
              : `No ${activeTab} transactions yet`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v as "all" | "income" | "expense");
        setCurrentPage(1);
      }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="expense" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Expense
          </TabsTrigger>
          <TabsTrigger value="income" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Income
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-6">
          {paginatedGroups.map(([date, dayTransactions]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <div className="h-px flex-1 bg-border" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {date}
                </h3>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2">
                {dayTransactions.map((transaction) => {
                  const isIncome = transaction.type === "INCOME";
                  const Icon = isIncome ? TrendingUp : TrendingDown;
                  const AccountIcon = (
                    transaction.account?.icon &&
                    Icons[transaction.account.icon as keyof typeof Icons]
                      ? Icons[transaction.account.icon as keyof typeof Icons]
                      : Icons.Wallet
                  ) as unknown as React.ComponentType<{ className?: string }>;

                  return (
                    <Card
                      key={transaction.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div
                              className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-xl",
                                isIncome
                                  ? "bg-green-500/10 text-green-600"
                                  : "bg-red-500/10 text-red-600"
                              )}
                            >
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold truncate">
                                  {transaction.category?.name || "Uncategorized"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <AccountIcon className="h-3 w-3" />
                                <span className="truncate">
                                  {transaction.account?.name}
                                </span>
                              </div>
                              {transaction.note && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                  {transaction.note}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p
                                className={cn(
                                  "text-lg font-bold",
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
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

