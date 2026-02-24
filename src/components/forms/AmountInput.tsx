"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/money";
import { evaluateExpression, isExpression } from "@/lib/calc-engine";
import { Equal, AlertCircle } from "lucide-react";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  label?: string;
  error?: string;
  className?: string;
}

const ALLOWED_CHARS = /[^\d+\-*/().,\s]/g;

export function AmountInput({
  value,
  onChange,
  currency = "IDR",
  label = "Amount",
  error,
  className,
}: AmountInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [focused, setFocused] = React.useState(false);

  const hasOperator = isExpression(value);

  const evalResult = React.useMemo<number | null>(() => {
    if (!value) return null;
    return evaluateExpression(value);
  }, [value]);

  const isInvalid = hasOperator && evalResult === null;

  const formattedPreview = React.useMemo(() => {
    if (!hasOperator || evalResult === null) return null;
    return formatCurrency(Math.round(evalResult * 100), currency);
  }, [hasOperator, evalResult, currency]);

  const plainFormatted = React.useMemo(() => {
    if (!value || hasOperator) return null;
    const num = parseFloat(value.replace(/,/g, "."));
    if (isNaN(num)) return null;
    return formatCurrency(Math.round(num * 100), currency);
  }, [value, hasOperator, currency]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value.replace(ALLOWED_CHARS, ""));
  };

  const handleBlur = () => {
    setFocused(false);
    if (hasOperator && evalResult !== null) {
      onChange(parseFloat(evalResult.toFixed(2)).toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && hasOperator && evalResult !== null) {
      e.preventDefault();
      onChange(parseFloat(evalResult.toFixed(2)).toString());
      inputRef.current?.blur();
    }
  };

  const ringColor = focused
    ? isInvalid
      ? "ring-2 ring-destructive/40 border-destructive"
      : hasOperator
      ? "ring-2 ring-amber-400/30 border-amber-400"
      : "ring-2 ring-primary/20 border-primary"
    : error
    ? "border-destructive"
    : "border-input";

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor="amount">{label}</Label>

      <div
        className={cn(
          "rounded-lg border bg-gradient-to-br from-background to-muted/20 transition-all duration-200",
          ringColor
        )}
      >
        {/* Input row */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* Currency symbol */}
          <span
            className={cn(
              "text-xl font-bold shrink-0 w-8 transition-colors duration-200",
              focused
                ? hasOperator
                  ? "text-amber-500"
                  : "text-primary"
                : "text-muted-foreground"
            )}
          >
            {currency === "IDR" ? "Rp" : currency}
          </span>

          {/* Text input — flex-1 + min-w-0 prevents overflow */}
          <input
            ref={inputRef}
            id="amount"
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="0"
            className={cn(
              "flex-1 min-w-0 bg-transparent text-xl font-bold outline-none",
              "placeholder:text-muted-foreground/40 placeholder:font-normal",
              isInvalid
                ? "text-destructive"
                : hasOperator
                ? "text-amber-600 dark:text-amber-400"
                : "text-foreground"
            )}
          />

          {/* = badge — only when expression active */}
          {hasOperator && (
            <div
              className={cn(
                "flex items-center justify-center h-7 w-7 rounded-md shrink-0 transition-all duration-200",
                isInvalid
                  ? "bg-destructive/10 text-destructive"
                  : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
              )}
            >
              {isInvalid ? (
                <AlertCircle className="h-3.5 w-3.5" />
              ) : (
                <Equal className="h-3.5 w-3.5" />
              )}
            </div>
          )}
        </div>

        {/* Preview / formatted value row */}
        {(formattedPreview || plainFormatted || (isInvalid && focused)) && (
          <div className="px-3 pb-2 border-t border-dashed border-muted">
            {formattedPreview ? (
              <div className="flex items-center gap-1 pt-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
                <Equal className="h-3 w-3 shrink-0" />
                <span className="truncate">{formattedPreview}</span>
                <span className="text-[10px] text-muted-foreground font-normal ml-1 shrink-0">
                  ↵ resolve
                </span>
              </div>
            ) : plainFormatted ? (
              <p className="pt-1.5 text-sm text-muted-foreground truncate">
                {plainFormatted}
              </p>
            ) : isInvalid && focused ? (
              <div className="flex items-center gap-1 pt-1.5 text-xs text-destructive">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>Ekspresi tidak valid</span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
