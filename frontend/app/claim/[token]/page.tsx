import { PageShell } from '@/components/page-shell';
import { publicEnv } from '@/lib/env';

type ClaimPageProps = {
  params: Promise<{ token: string }>;
};

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { token } = await params;

  return (
    <PageShell
      title="Recipient Claim Flow"
      description="Placeholder flow for recipients to claim a crypto payment with a secure token."
    >
      <dl className="space-y-4 text-sm text-slate-700">
        <div>
          <dt className="font-medium text-slate-900">Claim Token</dt>
          <dd className="break-all">{token}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-900">Support Contact</dt>
          <dd>{publicEnv.NEXT_PUBLIC_SUPPORT_EMAIL}</dd>
        </div>
      </dl>
    </PageShell>
  );
}
