"use client";

/**
 * DateNavigator — Prev / date-display / Next with calendar popover
 */
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getPeriodLabel, formatDateRangeDisplay } from "@/lib/dateUtils";
import type { Period } from "@/types/dashboard";

interface DateNavigatorProps {
  selectedDate: Date;
  period: Period;
  calendarOpen: boolean;
  onCalendarOpenChange: (open: boolean) => void;
  onDateSelect: (date: Date) => void;
  onNavigate: (direction: 1 | -1) => void;
}

export const DateNavigator = React.memo(function DateNavigator({
  selectedDate,
  period,
  calendarOpen,
  onCalendarOpenChange,
  onDateSelect,
  onNavigate,
}: DateNavigatorProps) {
  const label = getPeriodLabel(selectedDate, period);
  const displayText = formatDateRangeDisplay(selectedDate, period);

  return (
    <div className="flex items-center justify-center rounded-lg border border-border/60 bg-muted/30 px-2 py-1.5">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate(-1)}
          className="h-8 w-8 rounded-lg hover:bg-background"
          aria-label="Previous period"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Popover open={calendarOpen} onOpenChange={onCalendarOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="flex flex-col items-center h-auto py-1 px-3 min-w-[130px] md:min-w-[160px] rounded-lg hover:bg-background"
            >
              {label && (
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground leading-none mb-0.5">
                  {label}
                </span>
              )}
              <span
                className={cn(
                  "text-sm font-semibold leading-none",
                  !label && "py-0.5"
                )}
              >
                {displayText}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  onDateSelect(date);
                  onCalendarOpenChange(false);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate(1)}
          className="h-8 w-8 rounded-lg hover:bg-background"
          aria-label="Next period"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});
