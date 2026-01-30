"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BillSummaryCards } from "./_components/BillSummaryCards";
import { BillsList } from "./_components/BillsList";
import { CreateBillDialog } from "./_components/CreateBillDialog";
import { BillDetailDialog } from "./_components/BillDetailDialog";
import { EditBillDialog } from "./_components/EditBillDialog";
import { PayBillDialog } from "./_components/PayBillDialog";
import { useBills } from "@/hooks/useBills";

type BillModalState =
  | { type: "create" }
  | { type: "detail"; billId: string }
  | { type: "edit"; billId: string }
  | { type: "pay"; billId: string }
  | null;

export default function BillsPage() {
  const { data: bills = [], isLoading } = useBills();
  const [modalState, setModalState] = React.useState<BillModalState>(null);

  const handleBillClick = (billId: string) => {
    setModalState({ type: "detail", billId });
  };

  const handlePayClick = (billId: string) => {
    setModalState({ type: "pay", billId });
  };

  const handleCreateClick = () => {
    setModalState({ type: "create" });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="p-4 bg-white sm:border sm:rounded-sm dark:bg-card dark:md:bg-background">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bills</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Track and manage your bills and installments
            </p>
          </div>
          <Button size="sm" className="gap-2 rounded-sm" onClick={handleCreateClick}>
            <Plus className="h-4 w-4" />
            Add Bill
          </Button>
        </div>

        {/* Summary Cards */}
        <BillSummaryCards bills={bills} />
      </div>

      {/* Bills List */}
      <BillsList
        bills={bills}
        isLoading={isLoading}
        onBillClick={handleBillClick}
        onPayClick={handlePayClick}
        onCreateClick={handleCreateClick}
      />

      {/* Modals */}
      <CreateBillDialog
        open={modalState?.type === "create"}
        onOpenChange={(open) => !open && setModalState(null)}
      />

      {modalState?.type === "detail" && (
        <BillDetailDialog
          billId={modalState.billId}
          open={true}
          onOpenChange={(open) => !open && setModalState(null)}
          onPayClick={() => setModalState({ type: "pay", billId: modalState.billId })}
          onEditClick={() => setModalState({ type: "edit", billId: modalState.billId })}
        />
      )}

      {modalState?.type === "edit" && (
        <EditBillDialog
          billId={modalState.billId}
          open={true}
          onOpenChange={(open) => !open && setModalState(null)}
        />
      )}

      {modalState?.type === "pay" && (
        <PayBillDialog
          billId={modalState.billId}
          open={true}
          onOpenChange={(open) => !open && setModalState(null)}
        />
      )}
    </div>
  );
}
