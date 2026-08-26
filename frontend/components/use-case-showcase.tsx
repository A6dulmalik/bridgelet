'use client';

export interface UseCase {
  title: string;
  description: string;
  icon: React.ReactNode;
  tag?: string;
}

const USE_CASES: UseCase[] = [
  {
    title: 'Freelance Payments',
    description: 'Pay freelancers globally without requiring them to set up a crypto wallet first.',
    tag: 'Popular',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    ),
  },
  {
    title: 'Remittances',
    description: 'Send money to family abroad without bank fees or wallet setup friction.',
    tag: 'Low Cost',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
  {
    title: 'E-commerce Refunds',
    description: 'Issue instant crypto refunds to customers without wallet integration.',
    tag: 'Fast',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'Charity & Grants',
    description: 'Distribute funds to recipients who may not be crypto-native.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
];

/**
 * Issue #442 — Use-case showcase section for the homepage.
 *
 * Highlights real-world scenarios where Bridgelet solves the
 * "recipient doesn't have a wallet" problem.
 */
export function UseCaseShowcase() {
  return (
    <section aria-labelledby="use-cases-heading" className="py-12">
      <h2
        id="use-cases-heading"
        className="text-center text-2xl font-semibold text-slate-950 dark:text-slate-50"
      >
        Use Cases
      </h2>
      <p className="mt-2 text-center text-sm text-slate-700 dark:text-slate-300">
        Real-world scenarios where Bridgelet makes payments seamless.
      </p>

      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {USE_CASES.map((useCase) => (
          <div
            key={useCase.title}
            className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-sky-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-sky-600"
          >
            {useCase.tag && (
              <span className="absolute -top-2.5 right-4 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                {useCase.tag}
              </span>
            )}
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-100 dark:bg-sky-900/50 dark:text-sky-400">
              {useCase.icon}
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              {useCase.title}
            </h3>
            <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">
              {useCase.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
