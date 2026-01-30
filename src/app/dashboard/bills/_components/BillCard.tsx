"use client";

import { Card, CardContent } from "@/components/ui/card";
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

export function BillCard({ bill, onPayClick, onClick }: BillCardProps) {
  const now = new Date();
  const isOverdue = bill.status !== "PAID" && new Date(bill.dueDate) < now;
  const remaining = bill.totalAmount - (bill.totalPaid || 0);

  const CategoryIcon = bill.category?.icon
    ? (Icons[bill.category.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>) || Tag
    : Tag;

  return (
    <Card
      className="rounded-sm shadow-none hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onClick(bill.id)}
    >
      <CardContent className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-sm bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <CategoryIcon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base md:text-lg truncate">
                {bill.name}
              </h3>
              {bill.category && (
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {bill.category.name}
                </p>
              )}
            </div>
          </div>
          <BillStatusBadge status={bill.status} isOverdue={isOverdue} />
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-2 mb-3 text-xs md:text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
          <span className={cn(isOverdue && "text-red-600 dark:text-red-400 font-medium")}>
            {format(new Date(bill.dueDate), "PPP")}
          </span>
        </div>

        {/* Amount & Progress */}
        <div className="pt-3 md:pt-4 border-t space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs md:text-sm text-muted-foreground">Total Amount</span>
            <p className="text-lg md:text-xl font-bold">
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
              className="w-full rounded-sm"
              onClick={(e) => {
                e.stopPropagation();
                onPayClick(bill.id);
              }}
            >
              Pay {remaining > 0 ? formatCurrency(remaining) : "Bill"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
