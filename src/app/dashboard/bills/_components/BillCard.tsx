"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { BillStatusBadge } from "./BillStatusBadge";
import { BillProgress } from "./BillProgress";
import { formatCurrency } from "@/lib/money";
import { format } from "date-fns";
import { Calendar, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { BillStatus } from "@/generated/prisma";

interface BillCardProps {
  bill: {
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
  };
  onPayClick: (billId: string) => void;
  onClick: (billId: string) => void;
}

export const BillCard = React.memo(function BillCard({ bill, onPayClick, onClick }: BillCardProps) {
  const now = new Date();
  const isOverdue = bill.status !== "PAID" && new Date(bill.dueDate) < now;
  const remaining = bill.totalAmount - (bill.totalPaid || 0);

  const CategoryIcon = (
    bill.category?.icon && Icons[bill.category.icon as keyof typeof Icons]
      ? Icons[bill.category.icon as keyof typeof Icons]
      : Tag
  ) as unknown as React.ComponentType<{ className?: string }>;

  return (
    <div
      onClick={() => onClick(bill.id)}
      className="group rounded-xl border border-border/60 bg-card p-4 transition-colors hover:bg-accent/20 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <CategoryIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">{bill.name}</p>
            {bill.category && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {bill.category.name}
              </p>
            )}
          </div>
        </div>
        <BillStatusBadge status={bill.status} isOverdue={isOverdue} />
      </div>

      {/* Due Date */}
      <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        <span className={cn(isOverdue && "text-red-600 dark:text-red-400 font-medium")}>
          {format(new Date(bill.dueDate), "PPP")}
        </span>
      </div>

      {/* Amount & Progress */}
      <div className="pt-3 border-t border-border/60 space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-xs font-medium text-muted-foreground">Amount</span>
          <p className="text-base font-bold tabular-nums">
            {formatCurrency(bill.totalAmount)}
          </p>
        </div>

        {bill.totalPaid !== undefined && bill.totalPaid > 0 && (
          <BillProgress totalPaid={bill.totalPaid} totalAmount={bill.totalAmount} />
        )}

        {/* Pay Button */}
        {bill.status !== "PAID" && (
          <Button
            size="sm"
            className="w-full rounded-lg font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onPayClick(bill.id);
            }}
          >
            Pay {remaining > 0 ? formatCurrency(remaining) : "Bill"}
          </Button>
        )}
      </div>
    </div>
  );
});
