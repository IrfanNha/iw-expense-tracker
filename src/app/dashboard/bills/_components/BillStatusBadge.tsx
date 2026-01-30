import { BillStatus } from "@/generated/prisma";
import { Badge } from "@/components/ui/badge";

interface BillStatusBadgeProps {
  status: BillStatus;
  isOverdue?: boolean;
}

export function BillStatusBadge({ status, isOverdue }: BillStatusBadgeProps) {
  // Overdue takes precedence
  if (isOverdue && status !== "PAID") {
    return (
      <Badge
        variant="destructive"
        className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      >
        OVERDUE
      </Badge>
    );
  }

  switch (status) {
    case "PAID":
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        >
          PAID
        </Badge>
      );
    case "PARTIAL":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        >
          PARTIAL
        </Badge>
      );
    case "UNPAID":
      return (
        <Badge
          variant="outline"
          className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
        >
          UNPAID
        </Badge>
      );
    case "OVERDUE":
      return (
        <Badge
          variant="destructive"
          className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        >
          OVERDUE
        </Badge>
      );
    default:
      return null;
  }
}
