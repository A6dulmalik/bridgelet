import { PageShell } from '@/components/page-shell';
import { publicEnv } from '@/lib/env';

export default function SendPage() {
  return (
    <PageShell
      title="Sender Flow"
      description="Placeholder sender journey for creating and funding a payment claim."
    >
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
    </PageShell>
  );
}
