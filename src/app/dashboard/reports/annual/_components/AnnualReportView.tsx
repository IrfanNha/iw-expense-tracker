"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type AnnualReportDTO } from "@/lib/report/annual-report";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/money";
import { TrendingUp, TrendingDown, AlertTriangle, Info, RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DonutChart } from "@/components/charts/DonutChart";

interface AnnualReportViewProps {
  reportData: AnnualReportDTO;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function AnnualReportView({ reportData }: AnnualReportViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();

  const selectedYear = reportData.year;
  const { fromMonth, toMonth } = reportData.range;

  // Resync state management
  const [isResyncing, setIsResyncing] = React.useState(false);
  const [resyncMessage, setResyncMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Generate year options (current year and past 5 years)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", year);
    router.push(`?${params.toString()}`);
  };

  const handleMonthRangeChange = (from: number, to: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("fromMonth", from.toString());
    params.set("toMonth", to.toString());
    router.push(`?${params.toString()}`);
  };

  const handleResync = async () => {
    setIsResyncing(true);
    setResyncMessage(null);

    try {
      const response = await fetch("/api/reports/resync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: selectedYear,
          fromMonth,
          toMonth,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to resync data");
      }

      // Show success message
      setResyncMessage({
        type: "success",
        text: data.message || "Monthly summaries updated successfully!",
      });

      // Refresh the page data after successful resync
      setTimeout(() => {
        router.refresh();
      }, 500);

      // Auto-dismiss success message after 3 seconds
      setTimeout(() => {
        setResyncMessage(null);
      }, 3000);
    } catch (error) {
      // Show error message
      setResyncMessage({
        type: "error",
        text: error instanceof Error ? error.message : "An error occurred while resyncing.",
      });

      // Auto-dismiss error message after 5 seconds
      setTimeout(() => {
        setResyncMessage(null);
      }, 5000);
    } finally {
      setIsResyncing(false);
    }
  };

  const hasData = reportData.totals.income > 0 || reportData.totals.expense >0;
  const isDeficit = reportData.totals.expense > reportData.totals.income;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="p-4 bg-white sm:border sm:rounded-sm dark:bg-card dark:md:bg-background">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Annual Financial Report
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Ringkasan kesehatan keuangan tahunan
            </p>
          </div>

          {/* Resync notification */}
          {resyncMessage && (
            <Alert
              variant={resyncMessage.type === "error" ? "destructive" : "default"}
              className="mb-0"
            >
              {resyncMessage.type === "success" ? (
                <Info className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription className="text-xs md:text-sm">
                {resyncMessage.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Year and Month Range Selectors */}
          <div className="flex flex-wrap gap-3 md:gap-4">
            {/* Year Selector */}
            <div className="space-y-1.5 flex-1 min-w-[140px]">
              <label className="text-xs md:text-sm font-medium">Year</label>
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Range Quick Selects */}
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs md:text-sm font-medium">Period</label>
              <div className="flex gap-2">
                <Button
                  variant={fromMonth === 1 && toMonth === 12 ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleMonthRangeChange(1, 12)}
                >
                  Full Year
                </Button>
                <Button
                  variant={fromMonth === 1 && toMonth === 6 ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleMonthRangeChange(1, 6)}
                >
                  H1
                </Button>
                <Button
                  variant={fromMonth === 7 && toMonth === 12 ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleMonthRangeChange(7, 12)}
                >
                  H2
                </Button>
              </div>
            </div>

            {/* Resync Button */}
            <div className="space-y-1.5 shrink-0">
              <label className="text-xs md:text-sm font-medium opacity-0 pointer-events-none">Actions</label>
              <Button
                onClick={handleResync}
                disabled={isResyncing}
                variant="outline"
                size="default"
                className="w-full md:w-auto gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isResyncing ? "animate-spin" : ""}`} />
                {isResyncing ? "Resyncing..." : "Resync Data"}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing: {MONTH_NAMES[fromMonth - 1]} - {MONTH_NAMES[toMonth - 1]} {selectedYear}
          </p>
        </div>
      </div>

      {!hasData ? (
        // EMPTY STATE
        <Card className="rounded-sm shadow-none">
          <CardContent className="py-12 text-center">
            <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Annual report is being prepared. Transaction summaries for{" "}
              <strong>{selectedYear}</strong> are not yet available.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* EXECUTIVE SUMMARY */}
          <div className="p-4 bg-white sm:border sm:rounded-sm dark:bg-card dark:md:bg-background">
            <h2 className="text-lg md:text-xl font-semibold mb-3">Executive Summary</h2>
            <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Income Card */}
              <Card className="rounded-sm shadow-none">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">Total Income</CardDescription>
                  <CardTitle className="text-xl md:text-2xl text-green-600">
                    {formatCurrency(reportData.totals.income)}
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Expense Card */}
              <Card className="rounded-sm shadow-none">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">Total Expense</CardDescription>
                  <CardTitle className="text-xl md:text-2xl text-red-600">
                    {formatCurrency(reportData.totals.expense)}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reportData.totals.expenseRate.toFixed(1)}% of income
                  </p>
                </CardHeader>
              </Card>

              {/* Net/Savings Card */}
              <Card className="rounded-sm shadow-none">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">Net / Savings</CardDescription>
                  <CardTitle
                    className={`text-xl md:text-2xl ${
                      isDeficit ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {formatCurrency(reportData.totals.net)}
                  </CardTitle>
                  <div className="flex items-center gap-1 mt-1">
                    {isDeficit ? (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    ) : (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {Math.abs(reportData.totals.savingRate).toFixed(1)}% of income
                      {isDeficit && " (Deficit)"}
                    </p>
                  </div>
                </CardHeader>
              </Card>

              {/* Saving Rate Card */}
              <Card className={isDeficit ? "border-red-200 dark:border-red-900 rounded-sm shadow-none" : "rounded-sm shadow-none"}>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">Financial Health</CardDescription>
                  <CardTitle className="text-xl md:text-2xl">
                    {isDeficit ? "Deficit" : "Surplus"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expense: {reportData.totals.expenseRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Saved: {reportData.totals.savingRate.toFixed(0)}%
                  </p>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* MONTHLY TREND SECTION */}
          <Card className="border rounded-none sm:rounded-sm shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Monthly Trend</CardTitle>
              <CardDescription className="text-xs">
                Income, expense, and savings throughout the year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      dataKey="monthName"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.substring(0, 3)}
                    />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="income" fill="#22c55e" name="Income" />
                    <Bar dataKey="expense" fill="#ef4444" name="Expense" />
                    <Bar dataKey="net" fill="#3b82f6" name="Net" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* CATEGORY INSIGHT SECTION */}
          {reportData.topCategories.length > 0 && (
            <Card className="border rounded-none sm:rounded-sm shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Top Expense Categories</CardTitle>
                <CardDescription className="text-xs">
                  Where your money goes (percentage of total expense)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Donut Chart - Fixed to include percentage field */}
                  <div className="flex items-center justify-center">
                    <DonutChart
                      data={reportData.topCategories.map((cat) => ({
                        name: cat.categoryName,
                        value: cat.amount,
                        percentage: cat.percentageOfExpense.toFixed(1),
                      }))}
                      totalAmount={reportData.totals.expense}
                      title="Total Expense"
                    />
                  </div>

                  {/* Category List */}
                  <div className="space-y-2">
                    {reportData.topCategories.map((category, index) => (
                      <div
                        key={category.categoryId}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{
                              background: `hsl(var(--chart-${(index % 5) + 1}))`,
                            }}
                          />
                          <span className="text-xs md:text-sm font-medium truncate">
                            {category.categoryName}
                          </span>
                        </div>
                        <div className="text-right ml-2">
                          <p className="text-xs md:text-sm font-semibold">
                            {formatCurrency(category.amount)}
                          </p>
                          <p className="text-[10px] md:text-xs text-muted-foreground">
                            {category.percentageOfExpense.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* INSIGHT PANEL */}
          <Card className="border rounded-none sm:rounded-sm shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Financial Insights</CardTitle>
              <CardDescription className="text-xs">
                Key patterns and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Highest Expense Month */}
              {reportData.insights.highestExpenseMonth && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs md:text-sm">
                    <strong>Peak Spending:</strong> Pengeluaran tertinggi terjadi di bulan{" "}
                    <strong>
                      {MONTH_NAMES[reportData.insights.highestExpenseMonth - 1]}
                    </strong>
                    .
                  </AlertDescription>
                </Alert>
              )}

              {/* Lowest Saving Month */}
              {reportData.insights.lowestSavingMonth && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs md:text-sm">
                    <strong>Saving Pattern:</strong> Pola tabungan paling lemah di bulan{" "}
                    <strong>
                      {MONTH_NAMES[reportData.insights.lowestSavingMonth - 1]}
                    </strong>
                    .
                  </AlertDescription>
                </Alert>
              )}

              {/* Expense Volatility */}
              <Alert
                variant={
                  reportData.insights.expenseVolatility === "HIGH"
                    ? "destructive"
                    : "default"
                }
              >
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs md:text-sm">
                  <strong>Spending Consistency:</strong> Volatilitas pengeluaran:{" "}
                  <strong>
                    {reportData.insights.expenseVolatility === "LOW"
                      ? "Rendah (Stabil)"
                      : reportData.insights.expenseVolatility === "MEDIUM"
                      ? "Sedang"
                      : "Tinggi (Tidak Teratur)"}
                  </strong>
                  {reportData.insights.expenseVolatility === "HIGH" &&
                    " - Pertimbangkan untuk membuat budgeting yang lebih terstruktur."}
                </AlertDescription>
              </Alert>

              {/* Deficit Warning */}
              {isDeficit && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs md:text-sm">
                    <strong>Deficit Alert:</strong> Pengeluaran melebihi pendapatan sebesar{" "}
                    <strong>{formatCurrency(Math.abs(reportData.totals.net))}</strong>.
                    Disarankan untuk mengurangi pengeluaran atau meningkatkan pendapatan.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
