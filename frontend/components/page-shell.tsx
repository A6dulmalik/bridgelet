import Link from 'next/link';
import type { ReactNode } from 'react';
import Logo from './logo';

type PageShellProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="border-b border-slate-200 bg-white px-6 py-3">
        <Link href="/" aria-label="Bridgelet home" className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="text-lg font-medium tracking-tight text-[#0A1628]">bridgelet</span>
        </Link>
      </nav>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="text-base text-slate-600">{description}</p>
        </header>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">{children}</section>
      </main>
    </div>
  );
}
