"use client";

/**
 * PeriodSelector — Day / Week / Month toggle
 */
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Period } from "@/types/dashboard";

const PERIODS: { value: Period; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

interface PeriodSelectorProps {
  period: Period;
  onPeriodChange: (p: Period) => void;
}

export const PeriodSelector = React.memo(function PeriodSelector({
  period,
  onPeriodChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-1 rounded-lg bg-muted/70 p-1">
        {PERIODS.map(({ value, label }) => (
          <Button
            key={value}
            size="sm"
            variant={period === value ? "default" : "ghost"}
            className={cn(
              "h-8 px-4 text-xs font-medium rounded-md transition-all",
              period !== value && "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onPeriodChange(value)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
});
