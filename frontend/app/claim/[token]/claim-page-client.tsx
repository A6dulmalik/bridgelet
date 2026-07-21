'use client';

import { useEffect, useState } from 'react';
import { ClaimStatusCard } from '@/components/claim-status-card';
import { AccountStatus } from '@/lib/api/types';
import { BridgeletClient, BridgeletApiError } from '@/lib/api/client';

interface ClaimPageClientProps {
  token: string;
  supportEmail: string;
}

export interface ClaimView {
  status: AccountStatus;
  amountStroops?: string;
  assetCode?: string;
  expiresAt?: string;
  sweepNote?: string;
}

const client = new BridgeletClient();

/**
 * Decimal-string amount (e.g. "100.0000000") -> stroops string, for display
 * via ClaimStatusCard's existing stroops-based formatter.
 */
function toStroops(decimalAmount: string): string {
  if (!decimalAmount) return '0';
  const num = parseFloat(decimalAmount);
  if (Number.isNaN(num)) return '0';
  return String(Math.round(num * 10_000_000));
}

/**
 * Maps POST /claims/verify's outcome onto the AccountStatus values
 * ClaimStatusCard knows how to render. verify() reports validity via HTTP
 * status rather than an AccountStatus field, so this mapping is a
 * deliberate bridge, not a literal 1:1 translation — see bridgelet-sdk's
 * ClaimsController for the source error semantics (401/409/400).
 */
async function loadClaimView(claimToken: string): Promise<ClaimView> {
  try {
    const result = await client.verifyClaim(claimToken);
    return {
      status: AccountStatus.PENDING_CLAIM,
      amountStroops: toStroops(result.amountStroops ?? '0'),
      assetCode: result.assetCode === 'native' ? 'XLM' : result.assetCode,
      expiresAt: result.expiresAt,
    };
  } catch (err) {
    if (err instanceof BridgeletApiError) {
      if (err.statusCode === 409) return { status: AccountStatus.CLAIMED };
      if (err.statusCode === 400) return { status: AccountStatus.PENDING_PAYMENT };
      if (err.statusCode === 401) return { status: AccountStatus.EXPIRED };
    }
    return { status: AccountStatus.FAILED };
  }
}

export function ClaimPageClient({ token, supportEmail }: ClaimPageClientProps) {
  const [view, setView] = useState<ClaimView | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadClaimView(token)
      .then((result) => {
        if (!cancelled) setView(result);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleClaim(destinationAddress: string) {
    const result = await client.redeemClaim(token, destinationAddress);
    if (!result.success) {
      throw new Error(result.error ?? 'Claim could not be completed. Please try again.');
    }
    setView((prev) => ({
      ...(prev ?? { status: AccountStatus.CLAIMED }),
      status: result.isPartial ? AccountStatus.PARTIAL_SWEEP : AccountStatus.CLAIMED,
      sweepNote: result.message,
    }));
  }

  if (loadError) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-4">
        <p className="text-sm font-medium text-red-800">
          We couldn&apos;t load this claim right now. Please refresh the page.
        </p>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
        <span
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"
          aria-hidden="true"
        />
        <p className="text-sm text-slate-600">Loading claim details…</p>
      </div>
    );
  }

  return (
    <ClaimStatusCard
      status={view.status}
      amountStroops={view.amountStroops}
      assetCode={view.assetCode}
      expiresAt={view.expiresAt}
      sweepNote={view.sweepNote}
      supportEmail={supportEmail}
      onClaim={handleClaim}
    />
  );
}
