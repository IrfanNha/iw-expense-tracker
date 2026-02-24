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

// Allowed chars: digits, operator symbols, parens, decimal separators, spaces
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

  // ─── Derived state ──────────────────────────────────────────────
  const hasOperator = isExpression(value);

  const evalResult = React.useMemo<number | null>(() => {
    if (!value) return null;
    return evaluateExpression(value);
  }, [value]);

  const isInvalid = hasOperator && evalResult === null;

  const formattedPreview = React.useMemo(() => {
    if (!hasOperator || evalResult === null) return null;
    // Display result formatted as currency (value in whole units, not cents)
    const cents = Math.round(evalResult * 100);
    return formatCurrency(cents, currency);
  }, [hasOperator, evalResult, currency]);

  // Plain number display (no operator) shown below input when value exists
  const plainFormatted = React.useMemo(() => {
    if (!value || hasOperator) return null;
    const num = parseFloat(value.replace(/,/g, "."));
    if (isNaN(num)) return null;
    const cents = Math.round(num * 100);
    return formatCurrency(cents, currency);
  }, [value, hasOperator, currency]);

  // ─── Handlers ───────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(ALLOWED_CHARS, "");
    onChange(raw);
  };

  /** On blur: if there's a valid expression, resolve it to plain number */
  const handleBlur = () => {
    setFocused(false);
    if (hasOperator && evalResult !== null) {
      // Format to at most 2 decimal places, strip trailing zeros
      const resolved = parseFloat(evalResult.toFixed(2)).toString();
      onChange(resolved);
    }
  };

  /** Enter key also resolves the expression */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && hasOperator && evalResult !== null) {
      e.preventDefault();
      const resolved = parseFloat(evalResult.toFixed(2)).toString();
      onChange(resolved);
      inputRef.current?.blur();
    }
  };

  // ─── UI ─────────────────────────────────────────────────────────
  const currencySymbol = currency === "IDR" ? "Rp" : currency;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="amount">{label}</Label>

      {/* Outer focus ring */}
      <div className="relative">
        <div
          className={cn(
            "absolute inset-0 rounded-lg border-2 pointer-events-none transition-all duration-200",
            focused
              ? isInvalid
                ? "border-destructive ring-4 ring-destructive/10"
                : hasOperator
                ? "border-amber-400 ring-4 ring-amber-400/10"
                : "border-primary ring-4 ring-primary/10"
              : "border-transparent",
            !focused && error && "border-destructive"
          )}
        />

        {/* Card container */}
        <div className="relative bg-gradient-to-br from-background to-muted/20 rounded-lg border overflow-hidden">
          {/* Input row */}
          <div className="flex items-center gap-2 px-4 py-3">
            {/* Currency symbol */}
            <span
              className={cn(
                "text-2xl font-bold shrink-0 transition-colors duration-200",
                focused
                  ? hasOperator
                    ? "text-amber-500"
                    : "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {currencySymbol}
            </span>

            {/* Text input */}
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
              placeholder="0  atau  50.000+25.000"
              className={cn(
                "flex-1 min-w-0 bg-transparent text-2xl font-bold outline-none",
                "placeholder:text-muted-foreground/40 placeholder:text-base placeholder:font-normal",
                error && !hasOperator
                  ? "text-destructive"
                  : isInvalid
                  ? "text-destructive"
                  : hasOperator
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-foreground"
              )}
            />

            {/* = badge — appears when expression detected */}
            {hasOperator && (
              <div
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-md shrink-0 transition-all duration-200",
                  isInvalid
                    ? "bg-destructive/10 text-destructive"
                    : evalResult !== null
                    ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isInvalid ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Equal className="h-4 w-4" />
                )}
              </div>
            )}
          </div>

          {/* Preview row — real-time result */}
          {(formattedPreview || plainFormatted) && (
            <div
              className={cn(
                "px-4 pb-2.5 flex items-center gap-1.5 text-sm font-medium",
                formattedPreview
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              )}
            >
              {formattedPreview ? (
                <>
                  <Equal className="h-3 w-3 shrink-0" />
                  <span>{formattedPreview}</span>
                  <span className="text-xs text-muted-foreground font-normal ml-1">
                    (Enter untuk resolve)
                  </span>
                </>
              ) : (
                <span>{plainFormatted}</span>
              )}
            </div>
          )}

          {/* Invalid expression hint */}
          {isInvalid && focused && (
            <div className="px-4 pb-2.5 text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              Ekspresi tidak valid
            </div>
          )}
        </div>
      </div>

      {/* Form error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
