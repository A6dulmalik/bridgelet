// #124 – Sandbox page for generating and claiming test tokens (dev/staging only)
import { redirect } from 'next/navigation';

export default function ClaimTestPage() {
  if (process.env.NODE_ENV === 'production') {
    redirect('/');
  }

  const demoToken = 'sandbox_demo_token_' + Date.now();

  return (
    <main className="p-8 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold">Claim Test Sandbox</h1>
      <p className="text-sm text-slate-500">
        Only visible in development and staging environments.
      </p>
      <div className="rounded-lg border p-4 space-y-2 bg-slate-50">
        <p className="text-xs font-mono break-all text-slate-600">Token: {demoToken}</p>
        <a
          href={`/claim/${demoToken}`}
          className="inline-block rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          Claim this test token →
        </a>
      </div>
      <p className="text-xs text-slate-400">
        Append <code>?state=claimed</code> or <code>?state=expired</code> to test other states.
      </p>
    </main>
  );
}
