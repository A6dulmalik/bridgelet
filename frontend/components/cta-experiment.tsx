'use client';

import { useState, useCallback, createContext, useContext, useMemo } from 'react';
import Link from 'next/link';

export interface CtaVariant {
  id: string;
  headline: string;
  subtext: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

const DEFAULT_VARIANTS: CtaVariant[] = [
  {
    id: 'control',
    headline: 'Start Sending Crypto Today',
    subtext: 'No wallet required for recipients. Open-source and built for Stellar.',
    primaryLabel: 'Send a Payment',
    primaryHref: '/send',
    secondaryLabel: 'View on GitHub',
    secondaryHref: 'https://github.com/bridgelet-org/bridgelet',
  },
  {
    id: 'experiment-a',
    headline: 'Send Money to Anyone',
    subtext: 'Even if they don\'t have a crypto wallet. Claim links make it simple.',
    primaryLabel: 'Get Started Free',
    primaryHref: '/send',
    secondaryLabel: 'How It Works',
    secondaryHref: '#how-it-works',
  },
  {
    id: 'experiment-b',
    headline: 'Crypto Payments, Simplified',
    subtext: 'One link. No wallet setup. Funds arrive in seconds.',
    primaryLabel: 'Try Bridgelet',
    primaryHref: '/send',
  },
];

interface CtaContextValue {
  activeVariant: CtaVariant;
  setVariant: (id: string) => void;
  variants: CtaVariant[];
}

const CtaContext = createContext<CtaContextValue | null>(null);

export function CtaExperimentProvider({
  children,
  variants = DEFAULT_VARIANTS,
}: {
  children: React.ReactNode;
  variants?: CtaVariant[];
}) {
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window === 'undefined') return variants[0]?.id ?? 'control';
    return localStorage.getItem('bridgelet-cta-variant') ?? variants[0]?.id ?? 'control';
  });

  const setVariant = useCallback((id: string) => {
    setActiveId(id);
    localStorage.setItem('bridgelet-cta-variant', id);
  }, []);

  const activeVariant = useMemo(
    () => variants.find((v) => v.id === activeId) ?? variants[0]!,
    [variants, activeId],
  );

  const value = useMemo(
    () => ({ activeVariant, setVariant, variants }),
    [activeVariant, setVariant, variants],
  );

  return <CtaContext.Provider value={value}>{children}</CtaContext.Provider>;
}

export function useCtaExperiment(): CtaContextValue {
  const ctx = useContext(CtaContext);
  if (!ctx) throw new Error('useCtaExperiment must be used within CtaExperimentProvider');
  return ctx;
}

export function CtaExperimentBanner() {
  const { activeVariant } = useCtaExperiment();

  return (
    <section
      aria-labelledby="cta-experiment-heading"
      className="w-full bg-slate-900 px-6 py-16 text-center"
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <h2
          id="cta-experiment-heading"
          className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          {activeVariant.headline}
        </h2>
        <p className="text-base text-slate-300">{activeVariant.subtext}</p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={activeVariant.primaryHref}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {activeVariant.primaryLabel}
          </Link>
          {activeVariant.secondaryLabel && activeVariant.secondaryHref && (
            <a
              href={activeVariant.secondaryHref}
              target={activeVariant.secondaryHref.startsWith('http') ? '_blank' : undefined}
              rel={activeVariant.secondaryHref.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-6 py-3 text-sm font-semibold text-white transition hover:border-slate-400 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {activeVariant.secondaryLabel}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
