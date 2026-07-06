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
    <div className="space-y-3 md:space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 pt-4 md:px-6 md:pt-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Bills</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Track and manage your bills and installments
          </p>
        </div>
        <Button size="sm" className="rounded-lg gap-1.5" onClick={handleCreateClick}>
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add Bill</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <BillSummaryCards bills={bills} />

      {/* Bills List */}
      <div className="px-4 pb-6 md:px-6 md:pb-8">
        <BillsList
          bills={bills}
          isLoading={isLoading}
          onBillClick={handleBillClick}
          onPayClick={handlePayClick}
          onCreateClick={handleCreateClick}
        />
      </div>

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
