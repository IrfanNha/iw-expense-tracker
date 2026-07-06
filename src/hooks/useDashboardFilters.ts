/**
 * useDashboardFilters
 *
 * Centralizes all UI-filter state for the dashboard:
 * period, date, tab, sort, search, view mode, percentage mode, calendar.
 *
 * Extracts the 14+ useState calls and related useEffects from page.tsx
 * into one cohesive, testable unit.
 */
import * as React from "react";
import { PercentageMode, getDefaultModeForPeriod } from "@/types/finance";
import { offsetDate } from "@/lib/dateUtils";
import type { Period, ActiveTab, SortOrder } from "@/types/dashboard";

export interface DashboardFilters {
  // Period / Date
  period: Period;
  setPeriod: (p: Period) => void;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  navigateDate: (direction: 1 | -1) => void;

  // Tab
  activeTab: ActiveTab;
  setActiveTab: (t: ActiveTab) => void;

  // Sort
  sortOrder: SortOrder;
  setSortOrder: (s: SortOrder) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;

  // View
  showGrouped: boolean;
  setShowGrouped: React.Dispatch<React.SetStateAction<boolean>>;

  // Calendar
  calendarOpen: boolean;
  setCalendarOpen: (open: boolean) => void;

  // Chart percentage mode
  percentageMode: PercentageMode;
  setPercentageMode: (m: PercentageMode) => void;
}

export function useDashboardFilters(): DashboardFilters {
  const [period, setPeriod] = React.useState<Period>("day");
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("all");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("date-desc");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [showGrouped, setShowGrouped] = React.useState(true);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [percentageMode, setPercentageMode] = React.useState<PercentageMode>(
    () => getDefaultModeForPeriod(period)
  );
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Auto-switch percentage mode when period changes
  React.useEffect(() => {
    setPercentageMode(getDefaultModeForPeriod(period));
  }, [period]);

  // Reset search when switching view mode, period, or tab
  React.useEffect(() => {
    setSearchQuery("");
    setSearchOpen(false);
  }, [showGrouped, period, activeTab]);

  // Auto-focus search input when it opens
  React.useEffect(() => {
    if (searchOpen && !showGrouped) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen, showGrouped]);

  const navigateDate = React.useCallback(
    (direction: 1 | -1) => {
      setSelectedDate((prev) => offsetDate(prev, period, direction));
    },
    [period]
  );

  return {
    period,
    setPeriod,
    selectedDate,
    setSelectedDate,
    navigateDate,
    activeTab,
    setActiveTab,
    sortOrder,
    setSortOrder,
    searchQuery,
    setSearchQuery,
    searchOpen,
    setSearchOpen,
    searchInputRef,
    showGrouped,
    setShowGrouped,
    calendarOpen,
    setCalendarOpen,
    percentageMode,
    setPercentageMode,
  };
}
