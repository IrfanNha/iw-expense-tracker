/**
 * Annual Report Loading Skeleton
 *
 * Displayed instantly via Next.js Suspense/streaming before the server
 * finishes fetching data. Critical for FCP and LCP.
 * Mirrors the final page layout to eliminate layout shift (CLS = 0).
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

      {/* ── Header skeleton ─────────────────────────────────────────────────── */}
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

      {/* ── Executive summary skeleton (single card) ──────────────────────── */}
      <div className="border border-border/60 rounded-xl p-4 md:p-6 bg-card space-y-5">
        {/* Three metrics row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`space-y-2 ${i < 2 ? "pb-5 sm:pb-0 sm:pr-6" : ""} ${i > 0 ? "pt-5 sm:pt-0 sm:px-6" : ""}`}
            >
              <SkeletonBlock className="h-2.5 w-20 rounded-md" />
              <SkeletonBlock className="h-8 w-36 rounded-md" />
              <SkeletonBlock className="h-3 w-28 rounded-md" />
            </div>
          ))}
        </div>
        {/* Health bar section */}
        <div className="border-t border-border/40 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-3 w-20 rounded-md" />
            <SkeletonBlock className="h-3 w-32 rounded-md" />
          </div>
          <SkeletonBlock className="h-1.5 w-full rounded-full" />
        </div>
      </div>

      {/* ── Financial Ratios skeleton ────────────────────────────────────────── */}
      <div className="border border-border/60 rounded-xl p-4 md:p-6 space-y-4 bg-card">
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-36 rounded-md" />
          <SkeletonBlock className="h-3 w-52 rounded-md" />
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 p-4 space-y-2">
              <SkeletonBlock className="h-2.5 w-16 rounded-md" />
              <SkeletonBlock className="h-6 w-20 rounded-md" />
              <SkeletonBlock className="h-2.5 w-24 rounded-md" />
            </div>
          ))}
        </div>
        <div className="border-t border-border/40 pt-4 grid gap-3 sm:grid-cols-2">
          <SkeletonBlock className="h-14 w-full rounded-lg" />
          <SkeletonBlock className="h-14 w-full rounded-lg" />
        </div>
      </div>

      {/* ── Monthly trend chart skeleton ─────────────────────────────────────── */}
      <div className="border border-border/60 rounded-xl p-4 md:p-6 space-y-4 bg-card">
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-36 rounded-md" />
          <SkeletonBlock className="h-3 w-56 rounded-md" />
        </div>
        <SkeletonBlock className="h-[300px] md:h-[380px] w-full rounded-lg" />
      </div>

      {/* ── Category breakdown skeleton ──────────────────────────────────────── */}
      <div className="border border-border/60 rounded-xl p-4 md:p-6 space-y-4 bg-card">
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-48 rounded-md" />
          <SkeletonBlock className="h-3 w-52 rounded-md" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 items-center">
          <div className="flex justify-center">
            <SkeletonBlock className="h-[200px] w-[200px] rounded-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* ── Monthly Category Browser skeleton ───────────────────────────────── */}
      <div className="border border-border/60 rounded-xl p-4 md:p-6 space-y-4 bg-card">
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-44 rounded-md" />
          <SkeletonBlock className="h-3 w-60 rounded-md" />
        </div>
        {/* Month pills row */}
        <div className="flex gap-1.5 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-8 w-12 rounded-lg shrink-0" />
          ))}
        </div>
        {/* Month summary strip */}
        <SkeletonBlock className="h-5 w-56 rounded-md" />
        {/* Filter tabs */}
        <SkeletonBlock className="h-9 w-48 rounded-lg" />
        {/* Category rows */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <SkeletonBlock className="h-4 w-28 rounded" />
                <SkeletonBlock className="h-4 w-20 rounded" />
              </div>
              <SkeletonBlock className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Insights skeleton ────────────────────────────────────────────────── */}
      <div className="border border-border/60 rounded-xl p-4 md:p-6 space-y-4 bg-card">
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-36 rounded-md" />
          <SkeletonBlock className="h-3 w-52 rounded-md" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>

    </div>
  );
}
