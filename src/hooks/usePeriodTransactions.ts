/**
 * usePeriodTransactions
 *
 * Derives all computed transaction collections from raw data + filter state.
 * Extracts all useMemo logic (filtering, searching, grouping, totals, charts)
 * from page.tsx so the page component has zero derivation logic.
 */
import * as React from "react";
import Fuse from "fuse.js";
import { getPeriodRange } from "@/lib/dateUtils";
import type { Transaction } from "@/hooks/useTransactions";
import type { Period, ActiveTab, SortOrder } from "@/types/dashboard";

export interface GroupedCategory {
  label: string;
  total: number;
  isIncome: boolean;
  items: Transaction[];
}

export interface PeriodTotals {
  income: number;
  expense: number;
}

export interface CategoryDatum {
  name: string;
  value: number;
  percentage: string;
}

export interface PeriodTransactionsResult {
  /** Filtered + sorted transactions for the selected period/tab */
  filteredTransactions: Transaction[];
  /** Fuzzy-search result (falls back to filteredTransactions when query is empty) */
  searchedTransactions: Transaction[];
  /** Income / expense totals for the period */
  periodTotals: PeriodTotals;
  /** Category breakdown for the DonutChart */
  categoryData: CategoryDatum[];
  /** Total amount across all categories (for DonutChart) */
  totalAmount: number;
  /** Grouped-by-category view (for grouped mode) */
  groupedTransactions: [string, GroupedCategory][];
}

const TRANSFER_TYPES = new Set(["TRANSFER_DEBIT", "TRANSFER_CREDIT"]);

function sortTransactions(
  transactions: Transaction[],
  sortOrder: SortOrder
): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (sortOrder === "az") {
      const nameA = (a.category?.name || "Other").toLowerCase();
      const nameB = (b.category?.name || "Other").toLowerCase();
      return nameA.localeCompare(nameB);
    }
    if (sortOrder === "amount-desc") return b.amount - a.amount;
    if (sortOrder === "amount-asc") return a.amount - b.amount;
    // date-desc (default)
    return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
  });
}

export function usePeriodTransactions(
  transactions: Transaction[] | undefined,
  {
    selectedDate,
    period,
    activeTab,
    sortOrder,
    searchQuery,
  }: {
    selectedDate: Date;
    period: Period;
    activeTab: ActiveTab;
    sortOrder: SortOrder;
    searchQuery: string;
  }
): PeriodTransactionsResult {
  // 1. Filter by period + type, then sort
  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return [];
    const { start, end } = getPeriodRange(selectedDate, period);

    let filtered = transactions.filter((t) => {
      const d = new Date(t.occurredAt);
      return d >= start && d <= end && !TRANSFER_TYPES.has(t.type);
    });

    if (activeTab === "income") filtered = filtered.filter((t) => t.type === "INCOME");
    else if (activeTab === "expense") filtered = filtered.filter((t) => t.type === "EXPENSE");

    return sortTransactions(filtered, sortOrder);
  }, [transactions, selectedDate, period, activeTab, sortOrder]);

  // 2. Fuse.js instance — recreated only when filteredTransactions changes
  const fuseInstance = React.useMemo(
    () =>
      new Fuse(filteredTransactions, {
        keys: [
          { name: "category.name", weight: 0.5 },
          { name: "note", weight: 0.35 },
          { name: "account.name", weight: 0.15 },
        ],
        threshold: 0.4,
        includeScore: false,
        shouldSort: false, // preserve sortOrder
        ignoreLocation: true,
        minMatchCharLength: 1,
      }),
    [filteredTransactions]
  );

  // 3. Apply fuzzy search
  const searchedTransactions = React.useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return filteredTransactions;
    return fuseInstance.search(q).map((r) => r.item);
  }, [searchQuery, filteredTransactions, fuseInstance]);

  // 4. Period totals
  const periodTotals = React.useMemo<PeriodTotals>(() => {
    if (!filteredTransactions.length) return { income: 0, expense: 0 };
    const income = filteredTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense };
  }, [filteredTransactions]);

  // 5. Category data for DonutChart
  const categoryData = React.useMemo<CategoryDatum[]>(() => {
    if (activeTab === "all" || !filteredTransactions.length) return [];

    const map = new Map<string, number>();
    filteredTransactions.forEach((t) => {
      const name = t.category?.name || "Uncategorized";
      map.set(name, (map.get(name) || 0) + t.amount);
    });

    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, activeTab]);

  const totalAmount = React.useMemo(
    () => categoryData.reduce((sum, item) => sum + item.value, 0),
    [categoryData]
  );

  // 6. Grouped transactions (sorted, for grouped view)
  const groupedTransactions = React.useMemo<[string, GroupedCategory][]>(() => {
    const map: Record<string, GroupedCategory> = {};
    filteredTransactions.forEach((t) => {
      const key = t.category?.name || "Other";
      if (!map[key]) {
        map[key] = {
          label: key,
          total: 0,
          isIncome: t.type === "INCOME",
          items: [],
        };
      }
      map[key].total += t.amount * (t.type === "INCOME" ? 1 : -1);
      map[key].items.push(t);
    });

    return Object.entries(map).sort(([, a], [, b]) => {
      if (sortOrder === "az") return a.label.localeCompare(b.label);
      if (sortOrder === "amount-desc")
        return Math.abs(b.total) - Math.abs(a.total);
      if (sortOrder === "amount-asc")
        return Math.abs(a.total) - Math.abs(b.total);
      return 0; // date-desc: preserve insertion order
    });
  }, [filteredTransactions, sortOrder]);

  return {
    filteredTransactions,
    searchedTransactions,
    periodTotals,
    categoryData,
    totalAmount,
    groupedTransactions,
  };
}
