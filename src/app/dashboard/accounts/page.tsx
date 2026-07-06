"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Wallet } from "lucide-react";
import * as Icons from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  type Account,
} from "@/hooks/useAccounts";
import { accountSchema } from "@/lib/validators";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { IconPicker } from "@/components/features/IconPicker";

// ─── Type config ───────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  CASH: "text-emerald-600 dark:text-emerald-400",
  BANK: "text-sky-600 dark:text-sky-400",
  CARD: "text-violet-600 dark:text-violet-400",
  E_WALLET: "text-orange-600 dark:text-orange-400",
  OTHER: "text-muted-foreground",
};

const TYPE_BG: Record<string, string> = {
  CASH: "bg-emerald-500/10",
  BANK: "bg-sky-500/10",
  CARD: "bg-violet-500/10",
  E_WALLET: "bg-orange-500/10",
  OTHER: "bg-muted",
};

// ─── Schema ────────────────────────────────────────────────────────────────────

type FormData = z.infer<typeof accountSchema>;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AccountSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 rounded bg-muted" />
            <div className="h-2.5 w-16 rounded bg-muted" />
          </div>
        </div>
        <div className="flex gap-1">
          <div className="h-7 w-7 rounded-lg bg-muted" />
          <div className="h-7 w-7 rounded-lg bg-muted" />
        </div>
      </div>
      <div className="pt-3 border-t border-border/60">
        <div className="h-5 w-32 rounded bg-muted" />
      </div>
    </div>
  );
}

// ─── Account card ─────────────────────────────────────────────────────────────

const AccountCard = React.memo(function AccountCard({
  account,
  onEdit,
  onDelete,
}: {
  account: Account;
  onEdit: (a: Account) => void;
  onDelete: (id: string) => void;
}) {
  const IconComponent = (
    account.icon && Icons[account.icon as keyof typeof Icons]
      ? Icons[account.icon as keyof typeof Icons]
      : Icons.Wallet
  ) as unknown as React.ComponentType<{ className?: string }>;

  const typeLabel = account.type.toLowerCase().replace("_", " ");
  const iconBg = TYPE_BG[account.type] ?? "bg-muted";
  const typeColor = TYPE_COLOR[account.type] ?? "text-muted-foreground";

  return (
    <div className="group rounded-xl border border-border/60 bg-card p-4 transition-colors hover:bg-accent/20">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", iconBg)}>
            <IconComponent className={cn("h-5 w-5", typeColor)} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">{account.name}</p>
            <p className={cn("text-xs capitalize mt-0.5 font-medium", typeColor)}>
              {typeLabel}
            </p>
          </div>
        </div>

        {/* Actions — hover reveal on desktop */}
        <div className="flex gap-0.5 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(account)}
            title="Edit account"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(account.id)}
            title="Delete account"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="pt-3 border-t border-border/60">
        <p className="text-base font-bold tabular-nums">
          {formatCurrency(account.balance, account.currency)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
          {account.currency}
        </p>
      </div>
    </div>
  );
});

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <Wallet className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold mb-1">No accounts yet</p>
      <p className="text-xs text-muted-foreground mb-5">
        Create your first account to start tracking finances
      </p>
      <Button size="sm" className="rounded-lg gap-2" onClick={onAdd}>
        <Plus className="h-3.5 w-3.5" />
        Create Account
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [accountToDelete, setAccountToDelete] = React.useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) ?? 0;

  const form = useForm<FormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: "", type: "CASH", currency: "IDR", icon: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (editingId) {
        await updateAccount.mutateAsync({ id: editingId, ...data });
        setEditingId(null);
      } else {
        await createAccount.mutateAsync(data);
      }
      form.reset();
      setOpen(false);
    } catch {
      // Error handled by React Query
    }
  };

  const handleEdit = React.useCallback((account: Account) => {
    setEditingId(account.id);
    form.reset({
      name: account.name,
      type: account.type,
      currency: account.currency,
      icon: account.icon || "",
    });
    setOpen(true);
  }, [form]);

  const handleDelete = React.useCallback((id: string) => {
    setAccountToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = React.useCallback(async () => {
    if (!accountToDelete) return;
    try {
      await deleteAccount.mutateAsync(accountToDelete);
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to delete account";
      setErrorMessage(msg);
      setErrorDialogOpen(true);
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    }
  }, [accountToDelete, deleteAccount]);

  const handleDialogClose = (o: boolean) => {
    setOpen(o);
    if (!o) { setEditingId(null); form.reset(); }
  };

  const isPending = createAccount.isPending || updateAccount.isPending;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 pt-4 md:px-6 md:pt-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Manage your financial accounts
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-lg gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Account</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
              <DialogTitle className="text-base font-semibold">
                {editingId ? "Edit Account" : "Create Account"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {editingId ? "Update account details" : "Add a new financial account"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Account Name</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="e.g., Cash, BCA Savings"
                    className="rounded-lg border-border/60"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Account Type</Label>
                  <Select
                    value={form.watch("type")}
                    onValueChange={(v) => form.setValue("type", v as FormData["type"])}
                  >
                    <SelectTrigger className="rounded-lg border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK">Bank</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    {...form.register("currency")}
                    placeholder="IDR"
                    className="rounded-lg border-border/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Icon</Label>
                  <IconPicker
                    value={form.watch("icon")}
                    onValueChange={(v) => form.setValue("icon", v)}
                  />
                </div>
              </div>

              <div className="flex gap-2 px-6 pb-6 pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => handleDialogClose(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="flex-1 rounded-lg"
                >
                  {isPending && <Spinner className="mr-2 h-3.5 w-3.5" />}
                  {editingId ? "Save Changes" : "Create Account"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total balance strip */}
      {!isLoading && accounts && accounts.length > 0 && (
        <div className="mx-4 md:mx-6 rounded-xl border border-border/60 bg-card px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Total Balance
            </p>
            <p className="text-xl font-bold tabular-nums mt-0.5">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-6 md:px-6 md:pb-8">
        {isLoading ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <AccountSkeleton />
            <AccountSkeleton />
            <AccountSkeleton />
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <EmptyState onAdd={() => setOpen(true)} />
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This cannot be undone if the account has transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteAccount.isPending}>
              {deleteAccount.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Deleting…
                </span>
              ) : "Delete"}
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
