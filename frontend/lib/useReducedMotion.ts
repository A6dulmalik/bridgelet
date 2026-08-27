/**
 * useReducedMotion.ts
 *
 * Issue #474: Reduced-motion preference support for homepage animation.
 *
 * Reads the OS-level `prefers-reduced-motion` media query and returns a
 * boolean. Components should disable or significantly reduce animations
 * when this returns true.
 *
 * Usage:
 *   const prefersReducedMotion = useReducedMotion();
 *
 *   <div className={prefersReducedMotion ? 'static-steps' : 'animated-steps'}>
 *     ...
 *   </div>
 */
'use client';

import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    // Safe default for SSR — no window available
    if (typeof window === 'undefined') return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    setPrefersReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}
