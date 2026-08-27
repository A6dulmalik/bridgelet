'use client';

import React, { useState, useCallback, useRef } from 'react';

export interface CopyToClipboardProps {
  /** The text to copy when clicked */
  value: string;
  /** Label shown on the button */
  label?: string;
  /** Text shown briefly after successful copy */
  copiedLabel?: string;
  /** Button variant */
  variant?: 'button' | 'inline' | 'icon';
  /** Optional className override */
  className?: string;
  /** Callback after successful copy */
  onCopy?: () => void;
}

/**
 * Issue #450 — Reusable copy-to-clipboard component for claim links.
 *
 * Uses the Clipboard API with a fallback for older browsers.
 * Shows a brief "Copied!" confirmation after a successful copy.
 */
export function CopyToClipboard({
  value,
  label = 'Copy link',
  copiedLabel = 'Copied!',
  variant = 'button',
  className = '',
  onCopy,
}: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setCopied(true);
    onCopy?.();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, [value, onCopy]);

  const baseClasses = variant === 'inline'
    ? 'inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition'
    : variant === 'icon'
      ? `inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${className}`
      : `inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${className}`;

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={baseClasses}
      aria-label={copied ? copiedLabel : `Copy: ${value}`}
      aria-live="polite"
    >
      {copied ? (
        <>
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{copiedLabel}</span>
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          {variant !== 'icon' && <span>{label}</span>}
        </>
      )}
    </button>
  );
}
