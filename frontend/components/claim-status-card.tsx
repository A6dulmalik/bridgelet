export type ClaimStatus = 'unclaimed' | 'claimed' | 'expired' | 'loading';

type ClaimStatusCardProps = {
  status: ClaimStatus;
  amount?: string;
  asset?: string;
  expiresAt?: string;
};

const STATUS_CONFIG: Record<
  ClaimStatus,
  { label: string; bg: string; text: string; badge: string }
> = {
  unclaimed: {
    label: 'Ready to Claim',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  claimed: {
    label: 'Already Claimed',
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-700',
    badge: 'bg-slate-100 text-slate-500',
  },
  expired: {
    label: 'Claim Expired',
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-900',
    badge: 'bg-red-100 text-red-600',
  },
  loading: {
    label: 'Verifying…',
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-500',
    badge: 'bg-slate-100 text-slate-400',
  },
};

export function ClaimStatusCard({ status, amount, asset, expiresAt }: ClaimStatusCardProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div className={`rounded-xl border p-5 ${cfg.bg}`} role="status" aria-live="polite">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${cfg.text}`}>Claim Status</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      {status === 'loading' ? (
        <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-slate-200" />
      ) : (
        <dl className="mt-4 space-y-1.5 text-sm">
          {amount && asset && (
            <div className="flex justify-between">
              <dt className={`font-medium ${cfg.text}`}>Amount</dt>
              <dd className={cfg.text}>
                {amount} {asset}
              </dd>
            </div>
          )}
          {expiresAt && (
            <div className="flex justify-between">
              <dt className={`font-medium ${cfg.text}`}>Expires</dt>
              <dd className={cfg.text}>{expiresAt}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
