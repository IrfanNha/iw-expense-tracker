"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillCard } from "./BillCard";
import { EmptyBillsState } from "./EmptyBillsState";
import { Spinner } from "@/components/ui/spinner";
import { BillStatus } from "@/generated/prisma";

interface BillsListProps {
  bills: Array<{
    id: string;
    name: string;
    status: BillStatus;
    totalAmount: number;
    dueDate: string;
    totalPaid?: number;
    category?: {
      name: string;
      icon?: string | null;
    } | null;
  }>;
  isLoading: boolean;
  onBillClick: (billId: string) => void;
  onPayClick: (billId: string) => void;
  onCreateClick: () => void;
}

export function BillsList({
  bills,
  isLoading,
  onBillClick,
  onPayClick,
  onCreateClick,
}: BillsListProps) {
  const now = new Date();

  const filterBills = (status?: string) => {
    if (!status) return bills;
    if (status === "OVERDUE") {
      return bills.filter((b) => {
        if (b.status === "PAID") return false;
        return new Date(b.dueDate) < now;
      });
    }
    return bills.filter((b) => b.status === status);
  };

  const allBills = filterBills();
  const unpaidBills = filterBills("UNPAID").concat(filterBills("PARTIAL"));
  const overdueBills = filterBills("OVERDUE");
  const paidBills = filterBills("PAID");

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (bills.length === 0) {
    return <EmptyBillsState onCreateClick={onCreateClick} />;
  }

  const renderBillGrid = (billsList: typeof bills) => {
    if (billsList.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No bills found in this category
        </div>
      );
    }

    return (
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {billsList.map((bill) => (
          <BillCard
            key={bill.id}
            bill={bill}
            onPayClick={onPayClick}
            onClick={onBillClick}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 bg-white sm:border sm:rounded-sm dark:bg-card dark:md:bg-background">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 h-auto p-1 gap-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm py-2 px-2 data-[state=active]:bg-background">
            <span className="block sm:inline">All</span>{" "}
            <span className="block sm:inline">({allBills.length})</span>
          </TabsTrigger>
          <TabsTrigger value="unpaid" className="text-xs sm:text-sm py-2 px-2 data-[state=active]:bg-background">
            <span className="block sm:inline">Unpaid</span>{" "}
            <span className="block sm:inline">({unpaidBills.length})</span>
          </TabsTrigger>
          <TabsTrigger value="overdue" className="text-xs sm:text-sm py-2 px-2 data-[state=active]:bg-background">
            <span className="block sm:inline">Overdue</span>{" "}
            <span className="block sm:inline">({overdueBills.length})</span>
          </TabsTrigger>
          <TabsTrigger value="paid" className="text-xs sm:text-sm py-2 px-2 data-[state=active]:bg-background">
            <span className="block sm:inline">Paid</span>{" "}
            <span className="block sm:inline">({paidBills.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderBillGrid(allBills)}</TabsContent>
        <TabsContent value="unpaid">{renderBillGrid(unpaidBills)}</TabsContent>
        <TabsContent value="overdue">{renderBillGrid(overdueBills)}</TabsContent>
        <TabsContent value="paid">{renderBillGrid(paidBills)}</TabsContent>
      </Tabs>
    </div>
  );
}
