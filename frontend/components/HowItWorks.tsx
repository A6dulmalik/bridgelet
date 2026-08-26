/**
 * HowItWorks.tsx
 *
 * Issue #474: Reduced-motion preference support for homepage animation.
 *
 * The "How It Works" explainer section with step-by-step animation.
 *
 * Behaviour:
 *  - Default (motion OK): steps fade and slide in sequentially with a
 *    staggered CSS animation as they enter the viewport.
 *  - Reduced-motion: all steps visible immediately, no animation or
 *    transition. Content is fully understandable without motion cues.
 *
 * The reduced-motion state is driven by the OS `prefers-reduced-motion`
 * media query via the `useReducedMotion` hook, not a manual toggle.
 */
'use client';

import { useReducedMotion } from '@/lib/useReducedMotion';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    icon: '💸',
    title: 'Sender creates a payment link',
    description:
      'Enter the amount and asset. Bridgelet generates a unique, one-time claim link — no recipient wallet address needed upfront.',
  },
  {
    number: 2,
    icon: '📲',
    title: 'Share by any means',
    description:
      'Send the link via SMS, WhatsApp, email, or show a QR code in person. The recipient taps or scans to claim.',
  },
  {
    number: 3,
    icon: '✅',
    title: 'Recipient claims instantly',
    description:
      'Funds arrive in seconds on the Stellar network. New users are guided to create a wallet — no prior crypto knowledge required.',
  },
];

export function HowItWorks() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="py-16 px-4 sm:px-6 lg:px-8"
    >
      <h2
        id="how-it-works-heading"
        className="text-2xl font-bold text-center text-slate-900 mb-12"
      >
        How It Works
      </h2>

      <ol
        className="mx-auto max-w-3xl space-y-8"
        // Suppress list semantics announcement — numbered visually
        aria-label="Three steps to send and claim a payment"
      >
        {STEPS.map((step, index) => (
          <li
            key={step.number}
            className={[
              'flex gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm',
              // Animated variant: staggered fade-slide-in using CSS custom property
              !prefersReducedMotion && 'animate-step-in',
            ]
              .filter(Boolean)
              .join(' ')}
            style={
              !prefersReducedMotion
                ? ({ '--step-delay': `${index * 150}ms` } as React.CSSProperties)
                : undefined
            }
          >
            {/* Step number badge */}
            <div
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white"
            >
              {step.number}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span aria-hidden="true" className="text-xl">{step.icon}</span>
                <h3 className="font-semibold text-slate-900">{step.title}</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {/* Reduced-motion note — visible only when preference is active */}
      {prefersReducedMotion && (
        <p className="sr-only" aria-live="polite">
          Animations are disabled because you have reduced motion enabled in your system settings.
        </p>
      )}
    </section>
  );
}
