'use client';

import { useState } from 'react';
import { SendForm } from '@/components/send-form';
import { BatchSendForm } from '@/components/batch-send-form';

type SendMode = 'single' | 'batch';

/**
 * Client wrapper for the /send page.
 *
 * Lets the sender choose between:
 *   - Single recipient — the existing multi-step SendForm
 *   - Batch recipients — the new BatchSendForm (Issue #427)
 */
export function SendPageClient() {
  const [mode, setMode] = useState<SendMode>('single');

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setMode('single')}
          aria-pressed={mode === 'single'}
          className={`rounded px-4 py-1.5 text-sm font-medium transition ${
            mode === 'single'
              ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-slate-100'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Single recipient
        </button>
        <button
          type="button"
          onClick={() => setMode('batch')}
          aria-pressed={mode === 'batch'}
          className={`rounded px-4 py-1.5 text-sm font-medium transition ${
            mode === 'batch'
              ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-slate-100'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Batch recipients
        </button>
      </div>

      {mode === 'single' ? (
        <SendForm />
      ) : (
        <div>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            Send to multiple recipients at once. Add rows manually or upload a CSV with columns:{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">
              name, email, amount, asset
            </code>
            . Each recipient gets an independent claim link. The default claim window is{' '}
            <strong>7 days</strong>.
          </p>
          <BatchSendForm />
        </div>
      )}
    </div>
  );
}
