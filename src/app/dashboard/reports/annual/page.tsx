import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth-config";
import { redirect } from "next/navigation";
import { getAnnualReport } from "@/lib/report/annual-report";
import { AnnualReportView } from "./_components/AnnualReportView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Annual Report | Expense Tracker",
  description: "Annual financial summary and insights",
};

interface PageProps {
  searchParams: Promise<{
    year?: string;
    fromMonth?: string;
    toMonth?: string;
  }>;
}

export default async function AnnualReportPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = params.year ? parseInt(params.year, 10) : currentYear;
  const fromMonth = params.fromMonth ? parseInt(params.fromMonth, 10) : 1;
  const toMonth = params.toMonth ? parseInt(params.toMonth, 10) : 12;

  const reportData = await getAnnualReport(session.user.id, year, fromMonth, toMonth);

  return <AnnualReportView reportData={reportData} />;
}
