import { PageShell } from '@/components/page-shell';
import { WalletConnect } from '@/components/wallet-connect';
import { publicEnv } from '@/lib/env';

export default function SendPage() {
  return (
    <PageShell
      title="Sender Flow"
      description="Connect your Stellar wallet to authorise payments. Auth is wallet-based — no password or JWT required."
    >
      <div className="space-y-6">
        <WalletConnect />
        <dl className="space-y-4 text-sm text-slate-700">
          <div>
            <dt className="font-medium text-slate-900">API Base URL</dt>
            <dd>{publicEnv.NEXT_PUBLIC_API_BASE_URL}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Network</dt>
            <dd>{publicEnv.NEXT_PUBLIC_CRYPTO_NETWORK}</dd>
          </div>
        </dl>
      </div>
    </PageShell>
  );
}
