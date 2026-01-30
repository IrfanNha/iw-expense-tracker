"use client";

import { Card, CardContent } from "@/components/ui/card";
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

  const summaryData = [
    {
      label: "Total Unpaid",
      value: formatCurrency(totalUnpaid),
      icon: Receipt,
      gradient: "from-blue-500/10 to-blue-500/5",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Overdue",
      value: overdueBills.length,
      subtitle: overdueBills.length === 1 ? "bill" : "bills",
      icon: AlertCircle,
      gradient: "from-red-500/10 to-red-500/5",
      iconBg: "bg-red-500/20",
      iconColor: "text-red-600 dark:text-red-400",
      borderColor: "border-red-500/20",
    },
    {
      label: "Upcoming",
      value: upcomingBills.length,
      subtitle: "next 30 days",
      icon: Clock,
      gradient: "from-amber-500/10 to-amber-500/5",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-600 dark:text-amber-400",
      borderColor: "border-amber-500/20",
    },
  ];

  return (
    <div className="flex flex-col md:grid md:grid-cols-3 gap-2 md:gap-4">
      {summaryData.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card
            key={index}
            className={`rounded-sm bg-gradient-to-br ${item.gradient} ${item.borderColor} transition-all shadow-none hover:shadow-md border`}
          >
            <CardContent className="p-2.5 md:p-6">
              <div className="flex items-start justify-between mb-1.5 md:mb-3">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">
                  {item.label}
                </p>
                <div className={`h-7 w-7 md:h-10 md:w-10 rounded-sm ${item.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-3.5 w-3.5 md:h-5 md:w-5 ${item.iconColor}`} />
                </div>
              </div>
              <div>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold">
                  {item.value}
                </p>
                {item.subtitle && (
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
