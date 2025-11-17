"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatCurrency, parseInputToCents } from "@/lib/money";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  label?: string;
  error?: string;
  className?: string;
}

export function AmountInput({
  value,
  onChange,
  currency = "IDR",
  label = "Amount",
  error,
  className,
}: AmountInputProps) {
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow only numbers, dots, and commas
    const cleaned = inputValue.replace(/[^\d.,]/g, "");
    onChange(cleaned);
  };

  const displayValue = React.useMemo(() => {
    if (!value || value === "") return "";
    try {
      const cents = parseInputToCents(value);
      return formatCurrency(cents, currency);
    } catch {
      return "";
    }
  }, [value, currency]);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="amount">{label}</Label>
      <div className="relative">
        <div
          className={cn(
            "absolute inset-0 rounded-lg border-2 pointer-events-none transition-all",
            focused
              ? "border-primary ring-4 ring-primary/10"
              : "border-transparent",
            error && "border-destructive"
          )}
        />
        <div className="relative bg-gradient-to-br from-background to-muted/20 rounded-lg p-1 border">
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="text-2xl font-bold text-muted-foreground">
              {currency === "IDR" ? "Rp" : currency}
            </span>
            <Input
              ref={inputRef}
              id="amount"
              type="text"
              inputMode="decimal"
              value={value}
              onChange={handleChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="0.00"
              className={cn(
                "border-0 bg-transparent text-2xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto",
                error && "text-destructive"
              )}
            />
          </div>
          {value && (
            <div className="px-4 pb-2 text-sm text-muted-foreground">
              {displayValue}
            </div>
          )}
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

