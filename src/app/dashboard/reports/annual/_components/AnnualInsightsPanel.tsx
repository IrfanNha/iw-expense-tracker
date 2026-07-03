/**
 * AnnualInsightsPanel — Server Component
 *
 * Menampilkan insight finansial (peak spending, saving pattern, volatility).
 * Konten ini sepenuhnya statis — tidak ada state, event handler, atau interaksi.
 * Berjalan di server → nol JS dikirim ke klien untuk section ini.
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { formatCurrency } from "@/lib/money";
import type { AnnualReportDTO } from "@/lib/report/annual-report";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface Props {
  insights: AnnualReportDTO["insights"];
  totals: AnnualReportDTO["totals"];
}

export function AnnualInsightsPanel({ insights, totals }: Props) {
  const isDeficit = totals.expense > totals.income;

  return (
    <Card className="border rounded-none sm:rounded-sm shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">Financial Insights</CardTitle>
        <CardDescription className="text-xs">
          Key patterns and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Highest Expense Month */}
        {insights.highestExpenseMonth && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs md:text-sm">
              <strong>Peak Spending:</strong> Pengeluaran tertinggi terjadi di bulan{" "}
              <strong>{MONTH_NAMES[insights.highestExpenseMonth - 1]}</strong>.
            </AlertDescription>
          </Alert>
        )}

        {/* Lowest Saving Month */}
        {insights.lowestSavingMonth && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs md:text-sm">
              <strong>Saving Pattern:</strong> Pola tabungan paling lemah di bulan{" "}
              <strong>{MONTH_NAMES[insights.lowestSavingMonth - 1]}</strong>.
            </AlertDescription>
          </Alert>
        )}

        {/* Expense Volatility */}
        <Alert
          variant={
            insights.expenseVolatility === "HIGH" ? "destructive" : "default"
          }
        >
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs md:text-sm">
            <strong>Spending Consistency:</strong> Volatilitas pengeluaran:{" "}
            <strong>
              {insights.expenseVolatility === "LOW"
                ? "Rendah (Stabil)"
                : insights.expenseVolatility === "MEDIUM"
                ? "Sedang"
                : "Tinggi (Tidak Teratur)"}
            </strong>
            {insights.expenseVolatility === "HIGH" &&
              " - Pertimbangkan untuk membuat budgeting yang lebih terstruktur."}
          </AlertDescription>
        </Alert>

        {/* Deficit Warning */}
        {isDeficit && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs md:text-sm">
              <strong>Deficit Alert:</strong> Pengeluaran melebihi pendapatan sebesar{" "}
              <strong>{formatCurrency(Math.abs(totals.net))}</strong>.
              Disarankan untuk mengurangi pengeluaran atau meningkatkan pendapatan.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
