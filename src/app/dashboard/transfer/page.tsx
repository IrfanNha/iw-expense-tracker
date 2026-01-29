"use client";

import * as React from "react";
import { TransferForm } from "@/components/forms/TransferForm";
import { useTransfers, useDeleteTransfer } from "@/hooks/useTransfer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/money";
import { Trash2, ArrowRight, ArrowLeftRight, Plus } from "lucide-react";
import * as Icons from "lucide-react";
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

export default function TransferPage() {
  const { data: transfers, isLoading } = useTransfers();
  const deleteTransfer = useDeleteTransfer();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [transferToDelete, setTransferToDelete] = React.useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  const handleDelete = (id: string) => {
    setTransferToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!transferToDelete) return;
    try {
      await deleteTransfer.mutateAsync(transferToDelete);
      setDeleteDialogOpen(false);
      setTransferToDelete(null);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to delete transfer");
      setErrorDialogOpen(true);
      setDeleteDialogOpen(false);
      setTransferToDelete(null);
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
      <div className="p-4 pb-6 sm:pb-0 bg-white sm:bg-transparent dark:bg-card dark:md:bg-background flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Transfers</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Transfer money between your accounts
          </p>
        </div>
        <TransferForm
          trigger={
            <Button size="sm" className="gap-2 rounded-sm">
              <Plus className="h-4 w-4" />
              New Transfer
            </Button>
          }
        />
      </div>

      {isLoading ? (
        <div className="text-center p-4 py-8 md:py-12 text-muted-foreground text-sm">Loading transfers...</div>
      ) : transfers && transfers.length > 0 ? (
        <div className="p-4 space-y-4 md:space-y-6">
          {Object.entries(groupedTransfers).map(([date, dayTransfers]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <div className="h-px flex-1 bg-border" />
                <h3 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {date}
                </h3>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2 md:space-y-3">
                {dayTransfers.map((transfer) => {
                  const FromIcon = (transfer.fromAccount?.icon && Icons[transfer.fromAccount.icon as keyof typeof Icons]
                    ? Icons[transfer.fromAccount.icon as keyof typeof Icons]
                    : Icons.Wallet) as unknown as React.ComponentType<{ className?: string }>;
                  const ToIcon = (transfer.toAccount?.icon && Icons[transfer.toAccount.icon as keyof typeof Icons]
                    ? Icons[transfer.toAccount.icon as keyof typeof Icons]
                    : Icons.Wallet) as unknown as React.ComponentType<{ className?: string }>;

                  return (
                    <Card key={transfer.id} className="hover:shadow-md transition-all group rounded-sm">
                      <CardContent className="md:p-6">
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <ArrowLeftRight className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base md:text-lg">Transfer</h3>
                              {transfer.note && (
                                <p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">{transfer.note}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 md:h-8 md:w-8 md:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            onClick={() => handleDelete(transfer.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 pt-3 md:pt-4 border-t">
                          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                              <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                <FromIcon className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs md:text-sm text-muted-foreground">From</p>
                                <p className="font-semibold text-sm md:text-base truncate">{transfer.fromAccount?.name || "Unknown"}</p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                              <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                <ToIcon className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs md:text-sm text-muted-foreground">To</p>
                                <p className="font-semibold text-sm md:text-base truncate">{transfer.toAccount?.name || "Unknown"}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-left sm:text-right flex-shrink-0">
                            <p className="text-xl md:text-2xl font-bold">
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
          <CardContent className="py-12 md:py-16 text-center">
            <div className="mx-auto h-12 w-12 md:h-16 md:w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ArrowLeftRight className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
            </div>
            <p className="text-base md:text-lg font-medium mb-2">No transfers yet</p>
            <p className="text-xs md:text-sm text-muted-foreground mb-6">
              Transfer money between your accounts to get started
            </p>
            <TransferForm
              trigger={
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Transfer
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transfer? This will revert the account balances. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
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
