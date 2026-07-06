import { useQuery } from "@tanstack/react-query";

async function fetchMonthlyReport() {
  const res = await fetch("/api/reports/monthly");
  if (!res.ok) throw new Error("Failed to fetch report");
  return res.json() as Promise<{
    income: number;
    expense: number;
    net: number;
  }>;
}

/** Fetches the current month's income/expense/net summary. */
export function useMonthlyReport() {
  return useQuery({
    queryKey: ["reports", "monthly"],
    queryFn: fetchMonthlyReport,
  });
}
