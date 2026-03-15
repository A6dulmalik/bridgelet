import Link from 'next/link';
import { PageShell } from '@/components/page-shell';

export default function HomePage() {
  return (
    <PageShell
      title="Bridgelet Payment Flows"
      description="Reference placeholder UI for sender and recipient claim experiences."
    >
      <div className="space-y-4">
        <p className="text-slate-700">Select a flow to continue.</p>
        <nav className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/send"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Open Sender Flow
          </Link>
          <Link
            href="/claim/example-token"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
          >
            Open Claim Flow
          </Link>
        </nav>
      </div>
    </PageShell>
  );
}
