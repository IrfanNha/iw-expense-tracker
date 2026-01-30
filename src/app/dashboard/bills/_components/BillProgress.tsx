import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";

interface BillProgressProps {
  totalPaid: number;
  totalAmount: number;
  currency?: string;
  className?: string;
}

export function BillProgress({
  totalPaid,
  totalAmount,
  currency = "IDR",
  className,
}: BillProgressProps) {
  const progress = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
  const remaining = totalAmount - totalPaid;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Progress value={progress} className="h-2" />
        <style jsx>{`
          [data-slot="progress-indicator"] {
            background-color: ${progress >= 100 ? "rgb(22 163 74)" : progress >= 50 ? "rgb(202 138 4)" : "rgb(37 99 235)"};
          }
        `}</style>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatCurrency(totalPaid, currency)} paid</span>
        <span>
          {remaining > 0
            ? `${formatCurrency(remaining, currency)} remaining`
            : "Fully paid"}
        </span>
      </div>
    </div>
  );
}
