"use client";

import * as React from "react";
import { TransferForm } from "@/components/TransferForm";
import { useTransfers, useDeleteTransfer } from "@/hooks/useTransfer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/money";
import { Trash2, ArrowRight, ArrowLeftRight, Plus } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

export default function TransferPage() {
  const { data: transfers, isLoading } = useTransfers();
  const deleteTransfer = useDeleteTransfer();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this transfer? This will revert the account balances.")) {
      try {
        await deleteTransfer.mutateAsync(id);
      } catch (error: any) {
        alert(error.message || "Failed to delete transfer");
      }
    }
  };

  // Group transfers by date
  const groupedTransfers = React.useMemo(() => {
    if (!transfers) return {};
    const groups: Record<string, typeof transfers> = {};
    transfers.forEach((transfer) => {
      const date = new Date(transfer.createdAt).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transfer);
    });
    return groups;
  }, [transfers]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Transfers</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Transfer money between your accounts
          </p>
        </div>
        <TransferForm
          trigger={
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Transfer
            </Button>
          }
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading transfers...</div>
      ) : transfers && transfers.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedTransfers).map(([date, dayTransfers]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <div className="h-px flex-1 bg-border" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {date}
                </h3>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-3">
                {dayTransfers.map((transfer) => {
                  const FromIcon = transfer.fromAccount?.icon && Icons[transfer.fromAccount.icon as keyof typeof Icons]
                    ? Icons[transfer.fromAccount.icon as keyof typeof Icons]
                    : Icons.Wallet;
                  const ToIcon = transfer.toAccount?.icon && Icons[transfer.toAccount.icon as keyof typeof Icons]
                    ? Icons[transfer.toAccount.icon as keyof typeof Icons]
                    : Icons.Wallet;

                  return (
                    <Card key={transfer.id} className="hover:shadow-lg transition-all group">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <ArrowLeftRight className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">Transfer</h3>
                              {transfer.note && (
                                <p className="text-sm text-muted-foreground mt-1">{transfer.note}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(transfer.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <FromIcon className="h-5 w-5 text-red-600" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">From</p>
                                <p className="font-semibold">{transfer.fromAccount?.name || "Unknown"}</p>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <ToIcon className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">To</p>
                                <p className="font-semibold">{transfer.toAccount?.name || "Unknown"}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-2xl font-bold">
                              {formatCurrency(transfer.amount, transfer.fromAccount?.currency || "IDR")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(transfer.createdAt).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ArrowLeftRight className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-2">No transfers yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Transfer money between your accounts to get started
            </p>
            <TransferForm
              trigger={
                <Button size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Transfer
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
