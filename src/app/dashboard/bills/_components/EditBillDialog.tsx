"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BillForm } from "./BillForm";
import { useUpdateBill, useBill } from "@/hooks/useBills";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
// TODO: Install shadcn toast component

interface EditBillDialogProps {
  billId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBillDialog({ billId, open, onOpenChange }: EditBillDialogProps) {
  const { data: bill, isLoading, error } = useBill(billId);
  const updateBill = useUpdateBill();

  const handleSubmit = async (data: {
    name: string;
    categoryId?: string;
    totalAmount: number;
    dueDate: string;
    note?: string;
  }) => {
    try {
      await updateBill.mutateAsync({
        id: billId,
        bill: data,
      });
      console.log("Bill updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update bill:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Bill</DialogTitle>
          <DialogDescription>
            Update bill details. Note: You cannot edit fully paid bills.
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
          <BillForm
            bill={{
              id: bill.id,
              name: bill.name,
              categoryId: bill.categoryId,
              totalAmount: bill.totalAmount,
              dueDate: bill.dueDate,
              note: bill.note,
            }}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={updateBill.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
