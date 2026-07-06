/**
 * Pure date utility functions for dashboard period calculations.
 * All functions are stateless and live outside any React component,
 * so they are never recreated on re-renders.
 */

import type { Period } from "@/types/dashboard";

// ─── Boundary helpers ─────────────────────────────────────────────────────────

export function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getStartOfWeek(date: Date): Date {
  const d = getStartOfDay(date);
  const day = d.getDay(); // 0 (Sun) – 6 (Sat)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  d.setDate(diff);
  return d;
}

export function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getStartOfMonth(date: Date): Date {
  const d = getStartOfDay(date);
  d.setDate(1);
  return d;
}

export function getEndOfMonth(date: Date): Date {
  const d = getStartOfMonth(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

// ─── Period range ─────────────────────────────────────────────────────────────

export function getPeriodRange(date: Date, period: Period): { start: Date; end: Date } {
  if (period === "day") {
    return { start: getStartOfDay(date), end: getEndOfDay(date) };
  }
  if (period === "week") {
    return { start: getStartOfWeek(date), end: getEndOfWeek(date) };
  }
  return { start: getStartOfMonth(date), end: getEndOfMonth(date) };
}

// ─── Navigation ───────────────────────────────────────────────────────────────

const PERIOD_OFFSET_DAYS: Record<Period, number> = {
  day: 1,
  week: 7,
  month: 30,
};

export function offsetDate(date: Date, period: Period, direction: 1 | -1): Date {
  return new Date(
    date.getTime() + direction * PERIOD_OFFSET_DAYS[period] * 24 * 60 * 60 * 1000
  );
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateRangeDisplay(date: Date, period: Period): string {
  if (period === "day") return formatDateDisplay(date);

  if (period === "week") {
    const start = getStartOfWeek(date);
    const end = getEndOfWeek(date);
    return `${start.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    })} – ${end.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  }

  // month
  return getStartOfMonth(date).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Returns a human-readable relative label (e.g. "Today", "Last week").
 * Returns an empty string when beyond ±1 unit from now.
 */
export function getPeriodLabel(date: Date, period: Period): string {
  const now = new Date();

  if (period === "day") {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = Math.round((selected.getTime() - today.getTime()) / 86_400_000);
    if (diff === 0) return "Today";
    if (diff === -1) return "Yesterday";
    if (diff === 1) return "Tomorrow";
    return "";
  }

  if (period === "week") {
    const getMonday = (d: Date): Date => {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.getFullYear(), d.getMonth(), diff);
    };
    const diffWeeks = Math.round(
      (getMonday(date).getTime() - getMonday(now).getTime()) / (7 * 86_400_000)
    );
    if (diffWeeks === 0) return "This week";
    if (diffWeeks === -1) return "Last week";
    if (diffWeeks === 1) return "Next week";
    return "";
  }

  const diffMonths =
    (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth());
  if (diffMonths === 0) return "This month";
  if (diffMonths === -1) return "Last month";
  if (diffMonths === 1) return "Next month";
  return "";
}
