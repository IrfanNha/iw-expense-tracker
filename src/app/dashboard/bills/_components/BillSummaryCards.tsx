"use client";

import { formatCurrency } from "@/lib/money";
import { AlertCircle, Clock, Receipt } from "lucide-react";
import { BillStatus } from "@/generated/prisma";

interface BillSummaryCardsProps {
  bills: Array<{
    id: string;
    status: BillStatus;
    totalAmount: number;
    dueDate: string;
    totalPaid?: number;
  }>;
}

export function BillSummaryCards({ bills }: BillSummaryCardsProps) {
  const now = new Date();

  // Calculate metrics
  const unpaidBills = bills.filter((b) => b.status === "UNPAID" || b.status === "PARTIAL");
  const totalUnpaid = unpaidBills.reduce((sum, b) => {
    const remaining = b.totalAmount - (b.totalPaid || 0);
    return sum + remaining;
  }, 0);

  const overdueBills = bills.filter((b) => {
    if (b.status === "PAID") return false;
    return new Date(b.dueDate) < now;
  });

  const upcomingBills = bills.filter((b) => {
    if (b.status === "PAID") return false;
    const dueDate = new Date(b.dueDate);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return dueDate >= now && dueDate <= thirtyDaysFromNow;
  });

  return (
    <div className="mx-4 md:mx-6 rounded-xl border border-border/60 bg-card mt-2">
      <div className="grid grid-cols-3 divide-x divide-border/60 px-2 py-3 md:px-4 md:py-4">
        {/* Total Unpaid */}
        <div className="px-2 md:px-3">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-blue-500/10 shrink-0">
                <Receipt className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 truncate">
                Total Unpaid
              </p>
            </div>
            <div>
              <p className="text-sm md:text-xl font-bold tabular-nums text-foreground">
                {formatCurrency(totalUnpaid)}
              </p>
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className="px-2 md:px-3">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-red-500/10 shrink-0">
                <AlertCircle className="h-3 w-3 md:h-3.5 md:w-3.5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 truncate">
                Overdue
              </p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-sm md:text-xl font-bold tabular-nums text-foreground">
                {overdueBills.length}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline-block">
                {overdueBills.length === 1 ? "bill" : "bills"}
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming */}
        <div className="px-2 md:px-3">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-amber-500/10 shrink-0">
                <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 truncate">
                Upcoming
              </p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-sm md:text-xl font-bold tabular-nums text-foreground">
                {upcomingBills.length}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline-block">
                next 30d
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
