"use client";

/**
 * SortDropdown — sort order popover (Terbaru / A-Z / Nominal Terbesar / Terkecil)
 */
import * as React from "react";
import { ArrowUpDown, ChevronRight, ArrowDownAZ, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { SortOrder } from "@/types/dashboard";

const SORT_OPTIONS: {
  value: SortOrder;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "date-desc",
    label: "Terbaru",
    icon: <ChevronRight className="h-3.5 w-3.5 rotate-90" />,
  },
  {
    value: "az",
    label: "A – Z",
    icon: <ArrowDownAZ className="h-3.5 w-3.5" />,
  },
  {
    value: "amount-desc",
    label: "Nominal Terbesar",
    icon: <ArrowDownUp className="h-3.5 w-3.5" />,
  },
  {
    value: "amount-asc",
    label: "Nominal Terkecil",
    icon: <ArrowDownUp className="h-3.5 w-3.5 rotate-180" />,
  },
];

interface SortDropdownProps {
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
}

export const SortDropdown = React.memo(function SortDropdown({
  sortOrder,
  onSortChange,
}: SortDropdownProps) {
  const isActive = sortOrder !== "date-desc";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant={isActive ? "secondary" : "ghost"}
          className="h-8 w-8 md:h-9 md:w-9 rounded-lg"
          title="Sort transactions"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1.5" align="end">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-2 py-1">
          Sort by
        </p>
        <div className="flex flex-col gap-0.5">
          {SORT_OPTIONS.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => onSortChange(value)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors text-left",
                "hover:bg-accent hover:text-accent-foreground",
                sortOrder === value && "bg-accent font-medium"
              )}
            >
              <span className="text-muted-foreground">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
});
