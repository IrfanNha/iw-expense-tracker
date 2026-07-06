"use client";

/**
 * TransactionList
 *
 * Complete transaction panel: header controls, period selector, date navigator,
 * tab filters, and the rendered list (grouped or individual).
 */
import * as React from "react";
import { Search, X, Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { SortDropdown } from "./SortDropdown";
import { PeriodSelector } from "./PeriodSelector";
import { DateNavigator } from "./DateNavigator";
import { GroupedTransactionItem } from "./GroupedTransactionItem";
import { TransactionItem } from "./TransactionItem";
import type { Period, ActiveTab, SortOrder } from "@/types/dashboard";
import type { Transaction } from "@/hooks/useTransactions";
import type { GroupedCategory } from "@/hooks/usePeriodTransactions";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 animate-pulse">
      <div className="flex items-center gap-3 flex-1">
        <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-32 rounded bg-muted" />
          <div className="h-2.5 w-20 rounded bg-muted" />
          <div className="h-2.5 w-10 rounded bg-muted" />
        </div>
      </div>
      <div className="space-y-1 items-end flex flex-col">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-3 w-12 rounded bg-muted" />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function TransactionEmpty({ activeTab, period }: { activeTab: ActiveTab; period: Period }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
        <Receipt className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">No transactions</p>
      <p className="text-xs text-muted-foreground">
        {activeTab === "all"
          ? `No transactions recorded this ${period}`
          : `No ${activeTab} transactions this ${period}`}
      </p>
    </div>
  );
}

function SearchEmpty({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
        <Search className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        No results for &ldquo;{query}&rdquo;
      </p>
      <p className="text-xs text-muted-foreground">Try a different keyword</p>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TransactionListProps {
  // Data
  filteredTransactions: Transaction[];
  searchedTransactions: Transaction[];
  groupedTransactions: [string, GroupedCategory][];
  isLoading: boolean;

  // Filters
  period: Period;
  onPeriodChange: (p: Period) => void;
  selectedDate: Date;
  onDateSelect: (d: Date) => void;
  onNavigate: (direction: 1 | -1) => void;
  calendarOpen: boolean;
  onCalendarOpenChange: (open: boolean) => void;

  activeTab: ActiveTab;
  onTabChange: (t: ActiveTab) => void;

  sortOrder: SortOrder;
  onSortChange: (s: SortOrder) => void;

  // Search
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;

  // View
  showGrouped: boolean;
  onShowGroupedToggle: () => void;

  // Actions
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export const TransactionList = React.memo(function TransactionList({
  filteredTransactions,
  searchedTransactions,
  groupedTransactions,
  isLoading,
  period,
  onPeriodChange,
  selectedDate,
  onDateSelect,
  onNavigate,
  calendarOpen,
  onCalendarOpenChange,
  activeTab,
  onTabChange,
  sortOrder,
  onSortChange,
  searchQuery,
  onSearchQueryChange,
  searchOpen,
  onSearchOpenChange,
  searchInputRef,
  showGrouped,
  onShowGroupedToggle,
  onEdit,
  onDelete,
}: TransactionListProps) {
  return (
    <Card className="border border-border/60 rounded-xl shadow-none bg-background">
      <CardHeader className="px-4 pt-4 pb-0 md:px-5 md:pt-5 space-y-3">
        {/* Row 1: Title + actions */}
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm md:text-base font-semibold">
              Transactions
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {period === "day" ? "Daily" : period === "week" ? "Weekly" : "Monthly"} overview
            </CardDescription>
          </div>

          <div className="flex items-center gap-1">
            <SortDropdown sortOrder={sortOrder} onSortChange={onSortChange} />

            {/* Search — only in individual mode */}
            {!showGrouped && (
              <Button
                size="icon"
                variant={searchOpen ? "secondary" : "ghost"}
                className="h-8 w-8 md:h-9 md:w-9 rounded-lg"
                title="Search transactions"
                onClick={() => {
                  onSearchOpenChange(!searchOpen);
                  if (searchOpen) onSearchQueryChange("");
                }}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            )}

            <Button
              size="icon"
              variant={showGrouped ? "secondary" : "ghost"}
              className="h-8 w-8 md:h-9 md:w-9 rounded-lg"
              onClick={onShowGroupedToggle}
              title={showGrouped ? "Show individual" : "Show grouped"}
            >
              <Receipt className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Row 2: Fuzzy search input */}
        {!showGrouped && searchOpen && (
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search by category, note, account…"
              className="w-full h-9 pl-8 pr-8 rounded-lg border border-border/60 bg-muted/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange("")}
                className="absolute right-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Row 3: Period selector */}
        <PeriodSelector period={period} onPeriodChange={onPeriodChange} />

        {/* Row 4: Date navigator */}
        <DateNavigator
          selectedDate={selectedDate}
          period={period}
          calendarOpen={calendarOpen}
          onCalendarOpenChange={onCalendarOpenChange}
          onDateSelect={onDateSelect}
          onNavigate={onNavigate}
        />

        {/* Row 5: Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => onTabChange(v as ActiveTab)}
        >
          <TabsList className="grid w-full grid-cols-3 h-9 rounded-lg bg-muted/70">
            <TabsTrigger
              value="all"
              className="text-xs font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="expense"
              className="flex items-center gap-1 text-xs font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <TrendingDown className="h-3 w-3" />
              Expense
            </TabsTrigger>
            <TabsTrigger
              value="income"
              className="flex items-center gap-1 text-xs font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <TrendingUp className="h-3 w-3" />
              Income
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-3 pb-4 md:pb-5">
            {isLoading ? (
              <div className="space-y-2">
                <TransactionSkeleton />
                <TransactionSkeleton />
                <TransactionSkeleton />
                <TransactionSkeleton />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <TransactionEmpty activeTab={activeTab} period={period} />
            ) : !showGrouped && searchQuery.trim() && searchedTransactions.length === 0 ? (
              <SearchEmpty query={searchQuery} />
            ) : (
              <div className="space-y-2">
                {showGrouped
                  ? groupedTransactions.map(([key, group]) => (
                      <GroupedTransactionItem key={key} groupKey={key} group={group} />
                    ))
                  : searchedTransactions.map((t) => (
                      <TransactionItem
                        key={t.id}
                        transaction={t}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardHeader>

      {/* Spacer so the card doesn't clip the tab content */}
      <CardContent className="p-0" />
    </Card>
  );
});
