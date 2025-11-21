"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSelect } from "@/components/forms/AccountSelect";
import { AmountInput } from "@/components/forms/AmountInput";
import { useCreateTransaction, useUpdateTransaction, type Transaction } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { parseInputToCents, formatNumber } from "@/lib/money";
import { transactionSchema } from "@/lib/validators";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = transactionSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

type FormData = z.infer<typeof formSchema> & { amount: string };

interface TransactionFormProps {
  trigger?: React.ReactNode;
  transaction?: Transaction | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TransactionForm({ 
  trigger, 
  transaction, 
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess 
}: TransactionFormProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isEditMode = !!transaction;
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [activeTab, setActiveTab] = React.useState<"income" | "expense">(
    transaction?.type === "INCOME" ? "income" : "expense"
  );
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountId: transaction?.accountId || "",
      categoryId: transaction?.categoryId || "",
      amount: transaction ? String(transaction.amount / 100) : "",
      type: (transaction?.type === "INCOME" || transaction?.type === "EXPENSE") 
        ? transaction.type 
        : "EXPENSE",
      note: transaction?.note || "",
      occurredAt: transaction
        ? new Date(transaction.occurredAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    },
  });

  React.useEffect(() => {
    if (transaction && open && (transaction.type === "INCOME" || transaction.type === "EXPENSE")) {
      form.reset({
        accountId: transaction.accountId,
        categoryId: transaction.categoryId || "",
        amount: String(transaction.amount / 100),
        type: transaction.type,
        note: transaction.note || "",
        occurredAt: new Date(transaction.occurredAt).toISOString().split("T")[0],
      });
      setActiveTab(transaction.type === "INCOME" ? "income" : "expense");
    } else if (!open && !transaction) {
      form.reset({
        accountId: "",
        categoryId: "",
        amount: "",
        type: "EXPENSE",
        note: "",
        occurredAt: new Date().toISOString().split("T")[0],
      });
      setActiveTab("expense");
    }
  }, [open, transaction, form]);

  const selectedAccountId = form.watch("accountId");
  const selectedAccount = accounts?.find((acc) => acc.id === selectedAccountId);
  const incomeCategories = categories?.filter((cat) => cat.isIncome) || [];
  const expenseCategories = categories?.filter((cat) => !cat.isIncome) || [];
  const filteredCategories = activeTab === "income" ? incomeCategories : expenseCategories;

  React.useEffect(() => {
    if (!isEditMode) {
      form.setValue("type", activeTab === "income" ? "INCOME" : "EXPENSE");
      form.setValue("categoryId", ""); // Reset category when tab changes (only in create mode)
    }
  }, [activeTab, form, isEditMode]);

  const onSubmit = async (data: FormData) => {
    try {
      const amountInCents = parseInputToCents(data.amount);
      
      if (isEditMode && transaction) {
        // For edit, preserve the original time if only date is changed
        let occurredAtValue: string | undefined;
        if (data.occurredAt) {
          const selectedDate = new Date(data.occurredAt);
          const originalDate = new Date(transaction.occurredAt);
          // Keep the original time, only update the date
          selectedDate.setHours(
            originalDate.getHours(),
            originalDate.getMinutes(),
            originalDate.getSeconds(),
            originalDate.getMilliseconds()
          );
          occurredAtValue = selectedDate.toISOString();
        }
        
        await updateTransaction.mutateAsync({
          id: transaction.id,
          transaction: {
            accountId: data.accountId,
            categoryId: data.categoryId || undefined,
            amount: amountInCents,
            type: data.type,
            note: data.note || undefined,
            occurredAt: occurredAtValue,
          },
        });
      } else {
        // For new transactions, combine the selected date with current time
        let occurredAtValue: string | undefined;
        if (data.occurredAt) {
          const selectedDate = new Date(data.occurredAt);
          const now = new Date();
          // Set the time to current time but keep the selected date
          selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
          occurredAtValue = selectedDate.toISOString();
        }
        
        await createTransaction.mutateAsync({
          accountId: data.accountId,
          categoryId: data.categoryId || undefined,
          amount: amountInCents,
          type: data.type,
          note: data.note || undefined,
          occurredAt: occurredAtValue,
        });
      }
      
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by React Query
    }
  };

  // Auto-open dialog when transaction is provided (edit mode)
  React.useEffect(() => {
    if (transaction && controlledOpen === undefined && !open) {
      setOpen(true);
    }
  }, [transaction, open, controlledOpen, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update transaction details"
              : "Record a new income or expense transaction"}
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          value={activeTab} 
          onValueChange={(v) => !isEditMode && setActiveTab(v as "income" | "expense")} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger 
              value="expense" 
              className="flex items-center gap-2"
              disabled={isEditMode}
            >
              <TrendingDown className="h-4 w-4" />
              Expense
            </TabsTrigger>
            <TabsTrigger 
              value="income" 
              className="flex items-center gap-2"
              disabled={isEditMode}
            >
              <TrendingUp className="h-4 w-4" />
              Income
            </TabsTrigger>
          </TabsList>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value={activeTab} className="space-y-6 mt-0">
              {/* Account Selection */}
              <div className="space-y-2">
                <Label htmlFor="accountId">Account</Label>
                <AccountSelect
                  value={form.watch("accountId")}
                  onValueChange={(value) => form.setValue("accountId", value)}
                  placeholder="Select account"
                />
                {form.formState.errors.accountId && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.accountId.message}
                  </p>
                )}
              </div>

              {/* Amount Input */}
              <AmountInput
                value={form.watch("amount")}
                onChange={(value) => form.setValue("amount", value)}
                currency={selectedAccount?.currency || "IDR"}
                error={form.formState.errors.amount?.message}
              />

              {/* Categories Grid */}
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => {
                      const Icon = (category.icon && Icons[category.icon as keyof typeof Icons]
                        ? Icons[category.icon as keyof typeof Icons]
                        : Icons.Tag) as unknown as React.ComponentType<{ className?: string }>;
                      const isSelected = form.watch("categoryId") === category.id;

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => form.setValue("categoryId", category.id)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                              : "hover:bg-accent hover:border-primary/50"
                          )}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="text-xs font-medium text-center line-clamp-2">
                            {category.name}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-8 text-sm text-muted-foreground">
                      No {activeTab} categories yet. Create one first!
                    </div>
                  )}
                </div>
                {form.formState.errors.categoryId && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.categoryId.message}
                  </p>
                )}
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Input
                  id="note"
                  placeholder="Add a note..."
                  {...form.register("note")}
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="occurredAt">Date</Label>
                <Input
                  id="occurredAt"
                  type="date"
                  {...form.register("occurredAt")}
                />
              </div>
            </TabsContent>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTransaction.isPending || updateTransaction.isPending}
                className={cn(
                  activeTab === "income"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                )}
              >
                {createTransaction.isPending || updateTransaction.isPending
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                  ? "Update Transaction"
                  : activeTab === "income"
                  ? "Add Income"
                  : "Add Expense"}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

