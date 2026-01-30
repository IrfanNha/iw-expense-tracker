"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AccountSelect } from "@/components/forms/AccountSelect";
import { AmountInput } from "@/components/forms/AmountInput";
import { usePayBill, useBill } from "@/hooks/useBills";
import { parseInputToCents, formatCurrency } from "@/lib/money";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
// TODO: Install shadcn toast component

interface PayBillDialogProps {
  billId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayBillDialog({ billId, open, onOpenChange }: PayBillDialogProps) {
  const { data: bill, isLoading, error } = useBill(billId);
  const payBill = usePayBill();

  const [accountId, setAccountId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [note, setNote] = React.useState("");

  const remaining = bill ? (bill.remaining || bill.totalAmount - (bill.totalPaid || 0)) : 0;

  React.useEffect(() => {
    if (bill && remaining > 0) {
      // Auto-fill with remaining amount
      setAmount((remaining / 100).toString());
    }
  }, [bill, remaining]);

  const handleQuickAmount = (percentage: number) => {
    if (bill) {
      const quickAmount = Math.round(remaining * (percentage / 100));
      setAmount((quickAmount / 100).toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountId) {
      alert("Please select an account");
      return;
    }

    const amountInCents = parseInputToCents(amount);

    if (amountInCents <= 0) {
      alert("Amount must be greater than zero");
      return;
    }

    if (amountInCents > remaining) {
      alert("Payment amount exceeds remaining balance");
      return;
    }

    try {
      await payBill.mutateAsync({
        billId,
        accountId,
        amount: amountInCents,
        note: note || undefined,
      });
      console.log(`Payment successful: Paid ${formatCurrency(amountInCents)} for ${bill?.name}`);
      onOpenChange(false);
      // Reset form
      setAccountId("");
      setAmount("");
      setNote("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to process payment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pay Bill</DialogTitle>
          <DialogDescription>
            Make a payment for {bill?.name}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Spinner className="h-8 w-8" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to load bill"}
            </AlertDescription>
          </Alert>
        )}

        {bill && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Remaining Amount */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Remaining Balance</span>
                <span className="text-2xl font-bold">{formatCurrency(remaining)}</span>
              </div>
            </div>

            {/* Account Selection */}
            <div className="space-y-2">
              <Label htmlFor="accountId">Payment Account</Label>
              <AccountSelect
                value={accountId}
                onValueChange={setAccountId}
                placeholder="Select account to pay from"
              />
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <AmountInput
                value={amount}
                onChange={setAmount}
                currency="IDR"
                label="Payment Amount"
              />
              
              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(25)}
                >
                  25%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(50)}
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(75)}
                >
                  75%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(100)}
                  className="flex-1"
                >
                  Full Amount
                </Button>
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Add payment note..."
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={payBill.isPending}>
                {payBill.isPending ? "Processing..." : `Pay ${formatCurrency(parseInputToCents(amount) || 0)}`}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
