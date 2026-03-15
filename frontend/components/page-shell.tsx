import type { ReactNode } from 'react';

type PageShellProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="text-base text-slate-600">{description}</p>
      </header>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">{children}</section>
    </main>
  );
}
