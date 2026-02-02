"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpsertBudget } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import { Loader2, Tag } from "lucide-react";
import * as Icons from "lucide-react";

interface EditBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  editingBudget?: {
    id: string;
    categoryId: string;
    amount: number;
  } | null;
}

export function EditBudgetDialog({
  open,
  onOpenChange,
  year,
  month,
  editingBudget,
}: EditBudgetDialogProps) {
  // Form state - initialize from editing budget or empty
  const [categoryId, setCategoryId] = useState<string>(
    editingBudget?.categoryId ?? ""
  );
  const [amount, setAmount] = useState<string>(
    editingBudget?.amount?.toString() ?? ""
  );
  const [error, setError] = useState<string>("");

  const { data: categories, isLoading: loadingCategories } = useCategories();
  const upsertBudget = useUpsertBudget();

  // Filter expense categories only
  const expenseCategories = categories?.filter((cat) => !cat.isIncome) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!categoryId) {
      setError("Please select a category");
      return;
    }

    // Parse amount - remove any non-digit characters and convert to number
    const cleanedAmount = amount.replace(/\D/g, "");
    const amountNum = Number(cleanedAmount);
    
    if (!cleanedAmount || amountNum <= 0 || isNaN(amountNum)) {
      setError("Please enter a valid budget amount");
      return;
    }

    try {
      await upsertBudget.mutateAsync({
        categoryId,
        year,
        month,
        amount: amountNum,
      });

      onOpenChange(false);
      setCategoryId("");
      setAmount("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save budget"
      );
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits - store the raw number without formatting
    const value = e.target.value.replace(/\D/g, "");
    setAmount(value);
    setError("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setCategoryId("");
    setAmount("");
    setError("");
  };

  const monthName = new Date(year, month - 1).toLocaleDateString("id-ID", {
    month: "long",
  });

  // Use key to force re-render and reset form when switching between create/edit
  const dialogKey = editingBudget?.id ?? "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" key={dialogKey}>
        <DialogHeader>
          <DialogTitle>
            {editingBudget ? "Edit Budget" : "Create Budget"}
          </DialogTitle>
          <DialogDescription>
            Set a monthly budget for {monthName} {year} to track your spending.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Category Selection */}
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={categoryId}
                onValueChange={(value) => {
                  setCategoryId(value);
                  setError("");
                }}
                disabled={!!editingBudget || loadingCategories}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => {
                    // Get icon component from lucide-react
                    const IconComponent = (cat.icon &&
                    Icons[cat.icon as keyof typeof Icons]
                      ? Icons[cat.icon as keyof typeof Icons]
                      : Tag) as unknown as React.ComponentType<{ className?: string }>;

                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{cat.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {!editingBudget && expenseCategories.length === 0 && !loadingCategories && (
                <p className="text-xs text-muted-foreground">
                  No expense categories available. Please create one first.
                </p>
              )}
            </div>

            {/* Amount Input */}
            <div className="grid gap-2">
              <Label htmlFor="amount">Budget Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="350000"
                  value={amount}
                  onChange={handleAmountChange}
                  className="pl-10"
                  required
                />
              </div>
              {amount && (
                <p className="text-xs text-muted-foreground">
                  = {Number(amount).toLocaleString("id-ID")} IDR
                </p>
              )}
            </div>

            {/* Period Info */}
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Period:</span>
                <span className="font-medium">
                  {monthName} {year}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={upsertBudget.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={upsertBudget.isPending || loadingCategories}>
              {upsertBudget.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingBudget ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
