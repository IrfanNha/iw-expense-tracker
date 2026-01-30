/**
 * Money utilities for handling currency amounts
 * All amounts are stored as integers in smallest currency unit (cents)
 */

export function toCents(amountStr: string): number {
  // Remove all non-digit characters except decimal point and minus
  const cleaned = amountStr.replace(/[^\d.-]/g, "");
  const parts = cleaned.split(".");
  
  if (parts.length === 1) {
    // No decimal point, treat as whole number
    return parseInt(parts[0] || "0", 10) * 100;
  }
  
  const [intPart, decPart] = parts;
  const integer = parseInt(intPart || "0", 10);
  const decimal = parseInt((decPart + "00").slice(0, 2), 10);
  
  return integer * 100 + decimal;
}

export function formatCurrency(cents: number, currency = "IDR"): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatNumber(cents: number): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function parseInputToCents(input: string): number {
  // Handle IDR format (no decimals typically, but support both)
  const cleaned = input.replace(/[^\d.-]/g, "");
  if (!cleaned) return 0;
  
  return toCents(cleaned);
}

// Convert cents to display format (e.g., 12345 -> "123.45")
export function formatCentsToDisplay(cents: number): string {
  const amount = cents / 100;
  return amount.toString();
}

