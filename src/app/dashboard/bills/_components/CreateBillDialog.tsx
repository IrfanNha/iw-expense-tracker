"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BillForm } from "./BillForm";
import { useCreateBill } from "@/hooks/useBills";
// TODO: Install shadcn toast component: npx shadcn@latest add toast

interface CreateBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBillDialog({ open, onOpenChange }: CreateBillDialogProps) {
  const createBill = useCreateBill();

  const handleSubmit = async (data: {
    name: string;
    categoryId?: string;
    totalAmount: number;
    dueDate: string;
    note?: string;
  }) => {
    try {
      await createBill.mutateAsync(data);
      console.log("Bill created successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create bill:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Bill</DialogTitle>
          <DialogDescription>
            Add a new bill or installment to track your upcoming payments.
          </DialogDescription>
        </DialogHeader>
        <BillForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={createBill.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
