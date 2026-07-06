"use client";

/**
 * TransferForm — redesigned dialog.
 * Clean, mature fintech style matching the established design language.
 * Logic is unchanged — same zod schema, same submit flow.
 */
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowDown, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { AccountSelect } from "@/components/forms/AccountSelect";
import { AmountInput } from "@/components/forms/AmountInput";
import { useCreateTransfer } from "@/hooks/useTransfer";
import { useAccounts } from "@/hooks/useAccounts";
import { parseInputToCents, formatCurrency } from "@/lib/money";

// ─── Schema (identical to original) ──────────────────────────────────────────

const formSchema = z
  .object({
    fromAccountId: z.string().min(1, "From account is required"),
    toAccountId: z.string().min(1, "To account is required"),
    amount: z.string().min(1, "Amount is required"),
    note: z.string().optional(),
    occurredAt: z.string().optional(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
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

  const handleClose = () => {
    setOpen(false);
    form.reset();
  };

  const onSubmit = async (data: FormData) => {
    try {
      const amountInCents = parseInputToCents(data.amount);
      await createTransfer.mutateAsync({
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: amountInCents,
        note: data.note || undefined,
        occurredAt: data.occurredAt
          ? new Date(data.occurredAt).toISOString()
          : undefined,
      });
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch {
      // Error handled by React Query
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="w-full max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <DialogTitle className="text-base font-semibold">Transfer Money</DialogTitle>
          <DialogDescription className="text-xs">
            Move funds between your accounts
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="px-6 py-5 space-y-5">
            {/* Amount */}
            <AmountInput
              value={form.watch("amount")}
              onChange={(v) => form.setValue("amount", v)}
              currency={fromAccount?.currency || "IDR"}
              error={form.formState.errors.amount?.message}
            />

            {/* From → To with visual connector */}
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  From
                </Label>
                <AccountSelect
                  value={form.watch("fromAccountId")}
                  onValueChange={(v) => form.setValue("fromAccountId", v)}
                  excludeAccountId={form.watch("toAccountId")}
                  placeholder="Select source account"
                />
                {form.formState.errors.fromAccountId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.fromAccountId.message}
                  </p>
                )}
                {fromAccount && (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Available:{" "}
                    <span className="font-medium">
                      {formatCurrency(fromAccount.balance, fromAccount.currency)}
                    </span>
                  </p>
                )}
              </div>

              {/* Arrow connector */}
              <div className="flex items-center justify-center py-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-muted/50">
                  <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  To
                </Label>
                <AccountSelect
                  value={form.watch("toAccountId")}
                  onValueChange={(v) => form.setValue("toAccountId", v)}
                  excludeAccountId={form.watch("fromAccountId")}
                  placeholder="Select destination account"
                />
                {form.formState.errors.toAccountId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.toAccountId.message}
                  </p>
                )}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label htmlFor="note">
                Note{" "}
                <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </Label>
              <Input
                id="note"
                placeholder="Add a note…"
                className="rounded-lg border-border/60"
                {...form.register("note")}
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="occurredAt">Date</Label>
              <Input
                id="occurredAt"
                type="date"
                className="rounded-lg border-border/60"
                {...form.register("occurredAt")}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-6 pb-6 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createTransfer.isPending}
              className="flex-1 rounded-lg font-medium"
            >
              {createTransfer.isPending && <Spinner className="mr-2 h-3.5 w-3.5" />}
              {createTransfer.isPending ? "Transferring…" : "Transfer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
