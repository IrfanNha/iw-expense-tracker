"use client";

import { useState } from "react";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  type Account,
} from "@/hooks/useAccounts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconPicker } from "@/components/features/IconPicker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { accountSchema } from "@/lib/validators";
import { formatCurrency } from "@/lib/money";
import * as Icons from "lucide-react";
import { Plus, Pencil, Trash2, Wallet } from "lucide-react";
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

const formSchema = accountSchema;

type FormData = z.infer<typeof formSchema>;

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "CASH",
      currency: "IDR",
      icon: "",
    },
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
    } catch (error) {
      // Error handled by React Query
    }
  };

  const handleEdit = (account: Account) => {
    setEditingId(account.id);
    form.reset({
      name: account.name,
      type: account.type,
      currency: account.currency,
      icon: account.icon || "",
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    setAccountToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    try {
      await deleteAccount.mutateAsync(accountToDelete);
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to delete account");
      setErrorDialogOpen(true);
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    }
  };

  const totalBalance =
    accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;

  return (
    <div className="space-y-4 md:space-y-6">
      
      {/* Add Accounts and Total Balance */}
      <div className="p-4 bg-white sm:border sm:rounded-sm dark:bg-card dark:md:bg-background">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Accounts
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Manage your financial accounts
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) {
              setEditingId(null);
              form.reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 rounded-sm">
              <Plus className="h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md min-h-screen max-h-screen md:max-h-[90vh] overflow-y-auto rounded-none space-y-4 md:space-y-5">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Account" : "Create Account"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update account details"
                  : "Add a new financial account"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="e.g., Cash, Bank Account"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Account Type</Label>
                <Select
                  value={form.watch("type")}
                  onValueChange={(value) => form.setValue("type", value as any)}
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  {...form.register("currency")}
                  placeholder="IDR"
                />
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <IconPicker
                  value={form.watch("icon")}
                  onValueChange={(value) => form.setValue("icon", value)}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    setEditingId(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAccount.isPending || updateAccount.isPending}
                >
                  {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Balance Card */}
      <Card className="shadow-none rounded-sm bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">
                Total Balance
              </p>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold mt-1">
                {formatCurrency(totalBalance)}
              </p>
            </div>
            <div className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Wallet className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-8 md:py-12 text-muted-foreground text-sm">
          Loading accounts...
        </div>
      ) : accounts && accounts.length > 0 ? (
        <div className="p-4 bg-white sm:border sm:rounded-sm dark:bg-card dark:md:bg-background grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const IconComponent =
              (account.icon && Icons[account.icon as keyof typeof Icons]
                ? Icons[account.icon as keyof typeof Icons]
                : Icons.Wallet) as unknown as React.ComponentType<{ className?: string }>;

            return (
              <Card
                key={account.id}
                className="shadow-none rounded-sm hover:shadow-md transition-all group"
              >
                <CardContent className=" md:p-6">
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-sm md:rounded-sm
                       bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                        <IconComponent className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base md:text-lg truncate">
                          {account.name}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground capitalize">
                          {account.type.toLowerCase().replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 md:h-8 md:w-8"
                        onClick={() => handleEdit(account)}
                      >
                        <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="pt-3 md:pt-4 border-t">
                    <p className="text-xl md:text-2xl font-bold">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="shadow-none">
          <CardContent className="py-12 md:py-16 text-center">
            <div className="mx-auto h-12 w-12 md:h-16 md:w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Wallet className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
            </div>
            <p className="text-base md:text-lg font-medium mb-2">
              No accounts yet
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mb-6">
              Create your first account to start tracking your finances
            </p>
            <Button onClick={() => setOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this account? This cannot be undone if it has transactions.
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
