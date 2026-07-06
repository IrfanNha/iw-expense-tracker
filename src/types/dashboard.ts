/**
 * Dashboard-specific types
 * Centralizes all union types used across dashboard components and hooks.
 */

/** Time period for filtering transactions */
export type Period = "day" | "week" | "month";

/** Active tab filter in the transaction list */
export type ActiveTab = "all" | "income" | "expense";

/** Sort order for the transaction list */
export type SortOrder = "date-desc" | "az" | "amount-desc" | "amount-asc";
