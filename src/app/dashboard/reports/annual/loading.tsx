/**
 * Annual Report Loading Skeleton
 *
 * Ditampilkan INSTANTLY via Next.js Suspense/streaming sebelum server
 * selesai mengambil data. Ini adalah perbaikan kritis untuk FCP dan LCP.
 *
 * Skeleton meniru layout akhir halaman sehingga tidak ada layout shift (CLS).
 */

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-muted/60 ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export default function AnnualReportLoading() {
  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-6 pt-4 md:pt-6 pb-8">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-64 rounded-md" />
          <SkeletonBlock className="h-4 w-48 rounded-md" />
        </div>
        <div className="flex flex-wrap gap-3 md:gap-4 mt-2">
          <SkeletonBlock className="h-9 flex-1 min-w-[140px] rounded-lg" />
          <SkeletonBlock className="h-9 flex-1 min-w-[200px] rounded-lg" />
          <SkeletonBlock className="h-9 w-32 rounded-lg" />
        </div>
        <SkeletonBlock className="h-3 w-40 rounded-md" />
      </div>

      {/* Executive summary skeleton */}
      <div className="pt-2">
        <SkeletonBlock className="h-6 w-44 mb-4 rounded-md" />
        <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-border/60 rounded-xl p-4 space-y-3 bg-card">
              <SkeletonBlock className="h-3 w-20 rounded-md" />
              <SkeletonBlock className="h-7 w-32 rounded-md" />
              <SkeletonBlock className="h-3 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Monthly trend chart skeleton */}
      <div className="border border-border/60 rounded-xl p-4 md:p-6 space-y-4 bg-card">
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-36 rounded-md" />
          <SkeletonBlock className="h-3 w-56 rounded-md" />
        </div>
        <SkeletonBlock className="h-[300px] md:h-[400px] w-full rounded-lg" />
      </div>

      {/* Category breakdown skeleton */}
      <div className="border border-border/60 rounded-xl p-4 md:p-6 space-y-4 bg-card">
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-48 rounded-md" />
          <SkeletonBlock className="h-3 w-52 rounded-md" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 items-center">
          <div className="flex justify-center">
            <SkeletonBlock className="h-[220px] w-[220px] rounded-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Insights skeleton */}
      <div className="border border-border/60 rounded-xl p-4 md:p-6 space-y-4 bg-card">
        <SkeletonBlock className="h-5 w-36 rounded-md" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
