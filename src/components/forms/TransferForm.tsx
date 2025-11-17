"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AccountSelect } from "@/components/forms/AccountSelect";
import { useCreateTransfer } from "@/hooks/useTransfer";
import { useAccounts } from "@/hooks/useAccounts";
import { parseInputToCents } from "@/lib/money";
import { transferSchema } from "@/lib/validators";

const formSchema = z.object({
  fromAccountId: z.string().min(1, "From account is required"),
  toAccountId: z.string().min(1, "To account is required"),
  amount: z.string().min(1, "Amount is required"),
  note: z.string().optional(),
  occurredAt: z.string().optional(),
}).refine((data) => data.fromAccountId !== data.toAccountId, {
  message: "From and to accounts must be different",
  path: ["toAccountId"],
});

type FormData = z.infer<typeof formSchema>;

interface TransferFormProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function TransferForm({ trigger, onSuccess }: TransferFormProps) {
  const [open, setOpen] = React.useState(false);
  const { data: accounts } = useAccounts();
  const createTransfer = useCreateTransfer();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromAccountId: "",
      toAccountId: "",
      amount: "",
      note: "",
      occurredAt: new Date().toISOString().split("T")[0],
    },
  });

  const fromAccountId = form.watch("fromAccountId");
  const fromAccount = accounts?.find((acc) => acc.id === fromAccountId);

  const onSubmit = async (data: FormData) => {
    try {
      const amountInCents = parseInputToCents(data.amount);
      
      await createTransfer.mutateAsync({
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: amountInCents,
        note: data.note || undefined,
        occurredAt: data.occurredAt ? new Date(data.occurredAt).toISOString() : undefined,
      });

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Transfer error:", error);
      // Error is handled by React Query
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Money</DialogTitle>
          <DialogDescription>
            Transfer money between your accounts
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fromAccountId">From Account</Label>
            <AccountSelect
              value={form.watch("fromAccountId")}
              onValueChange={(value) => form.setValue("fromAccountId", value)}
              excludeAccountId={form.watch("toAccountId")}
              placeholder="Select source account"
            />
            {form.formState.errors.fromAccountId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.fromAccountId.message}
              </p>
            )}
            {fromAccount && (
              <p className="text-xs text-muted-foreground">
                Available: {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: fromAccount.currency,
                }).format(fromAccount.balance / 100)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="toAccountId">To Account</Label>
            <AccountSelect
              value={form.watch("toAccountId")}
              onValueChange={(value) => form.setValue("toAccountId", value)}
              excludeAccountId={form.watch("fromAccountId")}
              placeholder="Select destination account"
            />
            {form.formState.errors.toAccountId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.toAccountId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              {...form.register("amount")}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Input
              id="note"
              placeholder="Transfer note"
              {...form.register("note")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="occurredAt">Date</Label>
            <Input
              id="occurredAt"
              type="date"
              {...form.register("occurredAt")}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTransfer.isPending}
            >
              {createTransfer.isPending ? "Transferring..." : "Transfer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

