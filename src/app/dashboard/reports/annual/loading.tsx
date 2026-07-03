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
    <div className="space-y-4 md:space-y-6">
      {/* Header skeleton */}
      <div className="p-4 bg-white sm:border sm:rounded-sm dark:bg-card dark:md:bg-background">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-8 w-64" />
            <SkeletonBlock className="h-4 w-48" />
          </div>
          <div className="flex flex-wrap gap-3 md:gap-4">
            <SkeletonBlock className="h-9 flex-1 min-w-[140px]" />
            <SkeletonBlock className="h-9 flex-1 min-w-[200px]" />
            <SkeletonBlock className="h-9 w-32" />
          </div>
          <SkeletonBlock className="h-3 w-40" />
        </div>
      </div>

      {/* Executive summary skeleton */}
      <div className="p-4 bg-white sm:border sm:rounded-sm dark:bg-card dark:md:bg-background">
        <SkeletonBlock className="h-6 w-44 mb-4" />
        <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-sm p-4 space-y-2">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-7 w-32" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Monthly trend chart skeleton */}
      <div className="border rounded-sm p-4 space-y-3">
        <div className="space-y-1">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-3 w-56" />
        </div>
        <SkeletonBlock className="h-[300px] md:h-[400px] w-full" />
      </div>

      {/* Category breakdown skeleton */}
      <div className="border rounded-sm p-4 space-y-3">
        <div className="space-y-1">
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonBlock className="h-3 w-52" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonBlock className="h-[180px]" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Insights skeleton */}
      <div className="border rounded-sm p-4 space-y-3">
        <SkeletonBlock className="h-5 w-36" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
