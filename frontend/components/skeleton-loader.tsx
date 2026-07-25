/**
 * Issue #186 — Skeleton loading states for all async UI
 *
 * This file exports:
 *  - SkeletonLoader       — generic multi-row skeleton
 *  - ClaimStatusCardSkeleton — matches the ClaimStatusCard layout
 *  - AccountDetailsSkeleton  — matches the account details panel in ConfirmStep
 */

// ─── Generic skeleton ─────────────────────────────────────────────────────────

type SkeletonLoaderProps = {
  /** Number of skeleton rows to render */
  rows?: number;
  /** Show a wider header block above the rows */
  showHeader?: boolean;
};

export function SkeletonLoader({ rows = 3, showHeader = false }: SkeletonLoaderProps) {
  return (
    <div role="status" aria-label="Loading…" className="animate-pulse space-y-3">
      {showHeader && <div className="h-5 w-2/5 rounded bg-slate-200 dark:bg-slate-700" />}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div
            className="h-3 rounded bg-slate-200 dark:bg-slate-700"
            style={{ width: `${85 - i * 10}%` }}
          />
        </div>
      ))}
      <span className="sr-only">Loading content, please wait.</span>
    </div>
  );
}

// ─── Claim status card skeleton ───────────────────────────────────────────────

/**
 * Skeleton placeholder that mirrors the layout of ClaimStatusCard.
 * Shown while the claim token details are being fetched.
 */
export function ClaimStatusCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading claim details…"
      className="animate-pulse rounded-xl border-2 border-slate-200 bg-white p-5 shadow-sm space-y-4 dark:border-slate-700 dark:bg-slate-900"
    >
      {/* Header row: title + status badge */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* Detail rows (amount, expiry, memo) */}
      <div className="space-y-3">
        {['w-full', 'w-4/5', 'w-3/5'].map((w, i) => (
          <div key={i} className="flex justify-between">
            <div className={`h-3 ${w} rounded bg-slate-200 dark:bg-slate-700`} />
          </div>
        ))}
      </div>

      {/* Input field skeleton */}
      <div className="space-y-1">
        <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Button skeleton */}
      <div className="h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />

      <span className="sr-only">Loading claim details, please wait.</span>
    </div>
  );
}

// ─── Account details skeleton ─────────────────────────────────────────────────

/**
 * Skeleton placeholder for the account details / confirm panel
 * shown while a transaction is being prepared or submitted.
 */
export function AccountDetailsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading account details…"
      className="animate-pulse space-y-4"
    >
      {/* Summary panel */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3 dark:border-slate-700 dark:bg-slate-800">
        {[80, 60, 45, 55].map((w, i) => (
          <div key={i} className="flex justify-between">
            <div
              className="h-3 rounded bg-slate-200 dark:bg-slate-700"
              style={{ width: `${w}%` }}
            />
          </div>
        ))}
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-3">
        <div className="h-10 w-20 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-36 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>

      <span className="sr-only">Loading account details, please wait.</span>
    </div>
  );
}
