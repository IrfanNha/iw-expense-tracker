"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillCard } from "./BillCard";
import { EmptyBillsState } from "./EmptyBillsState";
import { BillStatus } from "@/generated/prisma";
import { cn } from "@/lib/utils";

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BillSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-muted shrink-0" />
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        </div>
        <div className="h-6 w-16 rounded-full bg-muted" />
      </div>
      <div className="h-4 w-32 rounded bg-muted mb-4" />
      <div className="pt-4 border-t border-border/60 space-y-3">
        <div className="flex justify-between">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-5 w-24 rounded bg-muted" />
        </div>
        <div className="h-8 w-full rounded bg-muted" />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

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
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <BillSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (bills.length === 0) {
    return <EmptyBillsState onCreateClick={onCreateClick} />;
  }

  const renderBillGrid = (billsList: typeof bills) => {
    if (billsList.length === 0) {
      return (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No bills found in this section
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
    <Tabs defaultValue="unpaid" className="w-full">
      <TabsList className="grid w-full grid-cols-4 h-10 rounded-lg bg-muted/60 mb-4">
        <TabsTrigger
          value="all"
          className="flex items-center justify-center gap-1.5 text-xs sm:text-sm rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <span className="hidden sm:inline">All</span>
          <span className="sm:hidden">All</span>
          <span className="ml-1 text-[10px] text-muted-foreground tabular-nums">
            ({allBills.length})
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="unpaid"
          className="flex items-center justify-center gap-1.5 text-xs sm:text-sm rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <span className="hidden sm:inline">Unpaid</span>
          <span className="sm:hidden">Unpd</span>
          <span className="ml-1 text-[10px] text-muted-foreground tabular-nums">
            ({unpaidBills.length})
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="overdue"
          className="flex items-center justify-center gap-1.5 text-xs sm:text-sm rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <span className="hidden sm:inline">Overdue</span>
          <span className="sm:hidden">Ovd</span>
          <span className="ml-1 text-[10px] text-muted-foreground tabular-nums">
            ({overdueBills.length})
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="paid"
          className="flex items-center justify-center gap-1.5 text-xs sm:text-sm rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <span className="hidden sm:inline">Paid</span>
          <span className="sm:hidden">Paid</span>
          <span className="ml-1 text-[10px] text-muted-foreground tabular-nums">
            ({paidBills.length})
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-0">{renderBillGrid(allBills)}</TabsContent>
      <TabsContent value="unpaid" className="mt-0">{renderBillGrid(unpaidBills)}</TabsContent>
      <TabsContent value="overdue" className="mt-0">{renderBillGrid(overdueBills)}</TabsContent>
      <TabsContent value="paid" className="mt-0">{renderBillGrid(paidBills)}</TabsContent>
    </Tabs>
  );
}
