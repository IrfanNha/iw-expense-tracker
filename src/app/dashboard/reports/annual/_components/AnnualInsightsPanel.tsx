/**
 * AnnualInsightsPanel — Server Component
 *
 * Menampilkan insight finansial (peak spending, saving pattern, volatility).
 * Konten ini sepenuhnya statis — tidak ada state, event handler, atau interaksi.
 * Berjalan di server → nol JS dikirim ke klien untuk section ini.
 */

import { Flame, ShieldAlert, Activity, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/money";
import type { AnnualReportDTO } from "@/lib/report/annual-report";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Props {
  insights: AnnualReportDTO["insights"];
  totals: AnnualReportDTO["totals"];
}

export function AnnualInsightsPanel({ insights, totals }: Props) {
  const isDeficit = totals.expense > totals.income;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 md:p-6 transition-colors hover:bg-accent/10">
      <div className="mb-6">
        <h2 className="text-base md:text-lg font-semibold">Financial Insights</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Key patterns and recommendations based on your activity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Deficit Warning (Takes full width if present) */}
        {isDeficit && (
          <div className="md:col-span-2 lg:col-span-3 rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 flex gap-4 items-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10 mt-0.5">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-1">Deficit Alert</h4>
              <p className="text-xs md:text-sm text-foreground/80 leading-relaxed">
                Pengeluaran Anda melebihi pendapatan sebesar <strong>{formatCurrency(Math.abs(totals.net))}</strong>. 
                Disarankan untuk segera meninjau kembali kategori pengeluaran terbesar Anda dan menyesuaikan budget.
              </p>
            </div>
          </div>
        )}

        {/* Highest Expense Month */}
        {insights.highestExpenseMonth && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 flex gap-4 items-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/10 mt-0.5">
              <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Peak Spending</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pengeluaran tertinggi Anda tahun ini terjadi di bulan <strong className="text-foreground">{MONTH_NAMES[insights.highestExpenseMonth - 1]}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Lowest Saving Month */}
        {insights.lowestSavingMonth && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 flex gap-4 items-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 mt-0.5">
              <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Saving Pattern</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pola tabungan paling lemah tercatat pada bulan <strong className="text-foreground">{MONTH_NAMES[insights.lowestSavingMonth - 1]}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Expense Volatility */}
        <div className={cn(
          "rounded-lg border p-4 flex gap-4 items-start",
          insights.expenseVolatility === "HIGH" ? "border-rose-500/30 bg-rose-500/5" : "border-border/60 bg-muted/30"
        )}>
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full mt-0.5",
            insights.expenseVolatility === "HIGH" ? "bg-rose-500/10" : "bg-emerald-500/10"
          )}>
            <Activity className={cn(
              "h-5 w-5",
              insights.expenseVolatility === "HIGH" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            )} />
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-1">Spending Consistency</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Volatilitas pengeluaran bulanan Anda terpantau <strong className="text-foreground">
                {insights.expenseVolatility === "LOW"
                  ? "Rendah (Stabil)"
                  : insights.expenseVolatility === "MEDIUM"
                  ? "Sedang"
                  : "Tinggi (Tidak Teratur)"}
              </strong>.
              {insights.expenseVolatility === "HIGH" &&
                " Pertimbangkan untuk membuat budgeting yang lebih ketat."}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
