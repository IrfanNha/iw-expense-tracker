"use client";

/**
 * AnnualReportControls — Client Component
 *
 * Satu-satunya bagian yang MEMBUTUHKAN "use client":
 * - Year selector (onChange → router.push)
 * - Period buttons (onClick → router.push)
 * - Resync button (onClick → fetch API + state)
 *
 * Dengan memisahkan ini, semua komponen lain (summary cards, insights)
 * bisa jadi server components — mengurangi JS bundle secara signifikan.
 */

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertTriangle, RefreshCw } from "lucide-react";

const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface AnnualReportControlsProps {
  selectedYear: number;
  fromMonth: number;
  toMonth: number;
}

export function AnnualReportControls({
  selectedYear,
  fromMonth,
  toMonth,
}: AnnualReportControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();

  const [isResyncing, setIsResyncing] = React.useState(false);
  const [resyncMessage, setResyncMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Generate year options (current year and past 5 years)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", year);
    router.push(`?${params.toString()}`);
  };

  const handleMonthRangeChange = (from: number, to: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("fromMonth", from.toString());
    params.set("toMonth", to.toString());
    router.push(`?${params.toString()}`);
  };

  const handleResync = async () => {
    setIsResyncing(true);
    setResyncMessage(null);

    try {
      const response = await fetch("/api/reports/resync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: selectedYear, fromMonth, toMonth }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to resync data");
      }

      setResyncMessage({
        type: "success",
        text: data.message || "Monthly summaries updated successfully!",
      });

      setTimeout(() => { router.refresh(); }, 500);
      setTimeout(() => { setResyncMessage(null); }, 3000);
    } catch (error) {
      setResyncMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "An error occurred while resyncing.",
      });
      setTimeout(() => { setResyncMessage(null); }, 5000);
    } finally {
      setIsResyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Annual Financial Report
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Ringkasan kesehatan keuangan tahunan
        </p>
      </div>

      {/* Resync notification */}
      {resyncMessage && (
        <Alert
          variant={resyncMessage.type === "error" ? "destructive" : "default"}
          className="mb-0"
        >
          {resyncMessage.type === "success" ? (
            <Info className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription className="text-xs md:text-sm">
            {resyncMessage.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Year and Month Range Selectors */}
      <div className="flex flex-wrap gap-3 md:gap-4">
        {/* Year Selector */}
        <div className="space-y-1.5 flex-1 min-w-[140px]">
          <label className="text-xs md:text-sm font-medium">Year</label>
          <Select
            value={selectedYear.toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Month Range Quick Selects */}
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs md:text-sm font-medium">Period</label>
          <div className="flex gap-2">
            <Button
              variant={fromMonth === 1 && toMonth === 12 ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => handleMonthRangeChange(1, 12)}
            >
              Full Year
            </Button>
            <Button
              variant={fromMonth === 1 && toMonth === 6 ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => handleMonthRangeChange(1, 6)}
            >
              H1
            </Button>
            <Button
              variant={fromMonth === 7 && toMonth === 12 ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => handleMonthRangeChange(7, 12)}
            >
              H2
            </Button>
          </div>
        </div>

        {/* Resync Button */}
        <div className="space-y-1.5 shrink-0">
          <label className="text-xs md:text-sm font-medium opacity-0 pointer-events-none">
            Actions
          </label>
          <Button
            id="annual-report-resync-btn"
            onClick={handleResync}
            disabled={isResyncing}
            variant="outline"
            size="default"
            className="w-full md:w-auto gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isResyncing ? "animate-spin" : ""}`} />
            {isResyncing ? "Resyncing..." : "Resync Data"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing: {MONTH_NAMES_SHORT[fromMonth - 1]} -{" "}
        {MONTH_NAMES_SHORT[toMonth - 1]} {selectedYear}
      </p>
    </div>
  );
}
