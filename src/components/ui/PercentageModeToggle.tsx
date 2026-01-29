"use client";

import * as React from "react";
import { PercentageMode, PERCENTAGE_MODE_LABELS, PERCENTAGE_MODE_DESCRIPTIONS } from "@/types/finance";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface PercentageModeToggleProps {
  /** Current active mode */
  mode: PercentageMode;
  /** Callback when mode changes */
  onModeChange: (mode: PercentageMode) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Whether income is available (affects Mode A availability) */
  hasIncome?: boolean;
}

/**
 * Toggle component for switching between percentage calculation modes
 * 
 * Displays:
 * - Two segmented buttons for Mode A and Mode B
 * - Info tooltip explaining each mode
 * - Automatic disable of Mode A when income = 0
 */
export function PercentageModeToggle({
  mode,
  onModeChange,
  disabled = false,
  hasIncome = true,
}: PercentageModeToggleProps) {
  // Mode A requires income > 0
  const modeADisabled = !hasIncome;

  return (
    <div className="flex items-center gap-2">
      {/* Segmented Control */}
      <div className="flex items-center gap-0.5 rounded-md bg-muted/60 p-0.5">
        {/* Mode A: Income-based */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={mode === PercentageMode.INCOME_BASED ? "default" : "ghost"}
                className="h-7 px-2 text-[10px] sm:text-xs md:h-8 md:px-3 md:text-sm rounded"
                onClick={() => onModeChange(PercentageMode.INCOME_BASED)}
                disabled={disabled || modeADisabled}
                title={modeADisabled ? "Mode ini memerlukan data income" : undefined}
              >
                {PERCENTAGE_MODE_LABELS[PercentageMode.INCOME_BASED]}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              <p className="font-semibold mb-1">
                {PERCENTAGE_MODE_LABELS[PercentageMode.INCOME_BASED]}
              </p>
              <p className="text-muted-foreground">
                {PERCENTAGE_MODE_DESCRIPTIONS[PercentageMode.INCOME_BASED]}
              </p>
              {modeADisabled && (
                <p className="text-yellow-600 mt-1 text-[10px]">
                  ⚠️ Memerlukan data income
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Mode B: Cash Flow Proportion */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={mode === PercentageMode.CASH_FLOW_PROPORTION ? "default" : "ghost"}
                className="h-7 px-2 text-[10px] sm:text-xs md:h-8 md:px-3 md:text-sm rounded"
                onClick={() => onModeChange(PercentageMode.CASH_FLOW_PROPORTION)}
                disabled={disabled}
              >
                {PERCENTAGE_MODE_LABELS[PercentageMode.CASH_FLOW_PROPORTION]}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              <p className="font-semibold mb-1">
                {PERCENTAGE_MODE_LABELS[PercentageMode.CASH_FLOW_PROPORTION]}
              </p>
              <p className="text-muted-foreground">
                {PERCENTAGE_MODE_DESCRIPTIONS[PercentageMode.CASH_FLOW_PROPORTION]}
              </p>
              <p className="text-amber-600 mt-1 text-[10px]">
                ℹ️ Visualisasi deskriptif, bukan metrik kesehatan keuangan
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Info Icon - General explanation */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 md:h-8 md:w-8 rounded-full"
            >
              <Info className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm text-xs">
            <p className="font-semibold mb-2">Tentang Mode Persentase:</p>
            <div className="space-y-2">
              <div>
                <p className="font-medium text-green-600">
                  Basis Income (Bulanan)
                </p>
                <p className="text-muted-foreground text-[10px]">
                  Cocok untuk analisis bulanan. Menunjukkan berapa persen income yang digunakan untuk expense dan saving.
                </p>
              </div>
              <div>
                <p className="font-medium text-blue-600">
                  Proporsi Arus Kas (Harian/Mingguan)
                </p>
                <p className="text-muted-foreground text-[10px]">
                  Cocok untuk tampilan harian/mingguan saat income tidak stabil. Menunjukkan proporsi visual saja.
                </p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
