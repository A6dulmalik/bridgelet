import { PageShell } from '@/components/page-shell';
import { SharePrompt } from '@/components/share-prompt';
import { ClaimPageClient } from './claim-page-client';
import { publicEnv } from '@/lib/env';
import { AccountStatus } from '@/lib/api/types';

type ClaimPageProps = {
  params: Promise<{ token: string }>;
};

/**
 * Claim page — resolves the token from the URL and renders the correct
 * `ClaimStatusCard` state.
 *
 * In production this would call `GET /claim/:token` to determine the real
 * status. Until the API is wired up the page uses a static demo state so all
 * three card variants can be exercised by appending `?state=claimed` or
 * `?state=expired` to the URL (handled client-side via the `ClaimStatusCard`
 * component directly on the demo page).
 */
export default async function ClaimPage({ params }: ClaimPageProps) {
  const { token } = await params;

  return (
    <PageShell
      title="Claim your payment"
      description="A payment has been sent to you via Bridgelet. Review the details below and claim it to your Stellar wallet."
    >
      <div className="space-y-6">
        <ClaimPageClient token={token} supportEmail={publicEnv.NEXT_PUBLIC_SUPPORT_EMAIL} />

        <p className="text-xs text-slate-400 text-center">
          Token: <span className="font-mono break-all">{token}</span>
        </p>

        <SharePrompt appUrl={publicEnv.NEXT_PUBLIC_APP_URL} />
      </div>
    </PageShell>
  );
}
