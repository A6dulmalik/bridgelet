'use client';

/**
 * BatchSendForm — Issue #427: Batch sending to multiple recipients.
 *
 * Allows senders to enter multiple recipients via:
 *   1. Manual row entry (name, email, amount, asset)
 *   2. CSV paste/upload (name, email, amount, asset)
 *
 * Each row is validated before submission. A per-recipient progress UI
 * shows success/failure as accounts are created sequentially.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  connectFreighter,
  loadPersistedWallet,
  persistWallet,
} from '@/lib/wallet';
import { createEphemeralAccount } from '@/lib/bridgelet';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BatchRecipient {
  id: string;
  name: string;
  email: string;
  amountXlm: string;
  assetCode: string;
}

type RecipientStatus = 'pending' | 'processing' | 'success' | 'error';

interface RecipientResult {
  id: string;
  status: RecipientStatus;
  claimUrl?: string;
  error?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days
const SUPPORTED_ASSETS = ['XLM', 'USDC'] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ROWS = 100;

// ─── Validation ──────────────────────────────────────────────────────────────

export interface RecipientError {
  name?: string;
  email?: string;
  amountXlm?: string;
  assetCode?: string;
}

export function validateRecipient(r: BatchRecipient): RecipientError {
  const errors: RecipientError = {};
  if (!r.name.trim()) errors.name = 'Name is required.';
  if (r.email.trim() && !EMAIL_RE.test(r.email.trim()))
    errors.email = 'Enter a valid email or leave empty.';
  const amt = Number(r.amountXlm);
  if (!r.amountXlm.trim() || isNaN(amt) || amt <= 0)
    errors.amountXlm = 'Enter a positive amount.';
  if (!SUPPORTED_ASSETS.includes(r.assetCode as (typeof SUPPORTED_ASSETS)[number]))
    errors.assetCode = 'Select an asset.';
  return errors;
}

// ─── CSV parsing ─────────────────────────────────────────────────────────────

/**
 * Parses a CSV string into BatchRecipient rows.
 * Expected columns (first row = header, ignored):
 *   name, email, amount, asset
 */
export function parseCsv(csv: string): BatchRecipient[] {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  // Skip header if first line looks like a header
  const start = /^name/i.test(lines[0] ?? '') ? 1 : 0;
  return lines.slice(start, start + MAX_ROWS).map((line, i) => {
    const [name = '', email = '', amountXlm = '', assetCode = 'XLM'] = line
      .split(',')
      .map((c) => c.trim().replace(/^"|"$/g, ''));
    return {
      id: `csv-${i}`,
      name,
      email,
      amountXlm,
      assetCode: assetCode || 'XLM',
    };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function emptyRow(): BatchRecipient {
  return { id: uid(), name: '', email: '', amountXlm: '', assetCode: 'XLM' };
}

interface RecipientRowProps {
  index: number;
  recipient: BatchRecipient;
  errors: RecipientError;
  result?: RecipientResult;
  onChange: (patch: Partial<BatchRecipient>) => void;
  onRemove: () => void;
  disabled: boolean;
}

function RecipientRow({
  index,
  recipient,
  errors,
  result,
  onChange,
  onRemove,
  disabled,
}: RecipientRowProps) {
  const rowNum = index + 1;

  return (
    <div
      className={`rounded-lg border p-3 transition ${
        result?.status === 'success'
          ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950'
          : result?.status === 'error'
            ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950'
            : result?.status === 'processing'
              ? 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
              : 'border-slate-200 dark:border-slate-700'
      }`}
      aria-label={`Recipient ${rowNum}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          #{rowNum}
        </span>
        {result?.status === 'processing' && (
          <span className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-400">
            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing…
          </span>
        )}
        {result?.status === 'success' && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            Sent
          </span>
        )}
        {result?.status === 'error' && (
          <span className="text-xs font-medium text-red-700 dark:text-red-400" role="alert">
            Failed: {result.error}
          </span>
        )}
        {!result && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`Remove recipient ${rowNum}`}
            className="text-slate-400 hover:text-red-600 disabled:opacity-40 dark:text-slate-500 dark:hover:text-red-400"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {/* Name */}
        <div>
          <label
            htmlFor={`batch-name-${recipient.id}`}
            className="block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id={`batch-name-${recipient.id}`}
            type="text"
            value={recipient.name}
            disabled={disabled}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Amina"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `batch-name-error-${recipient.id}` : undefined}
            className={`mt-0.5 block w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 ${
              errors.name
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                : 'border-slate-300 focus:border-slate-500 focus:ring-slate-500 dark:border-slate-600'
            }`}
          />
          {errors.name && (
            <p id={`batch-name-error-${recipient.id}`} className="mt-0.5 text-xs text-red-600 dark:text-red-400">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor={`batch-email-${recipient.id}`}
            className="block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            Email <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id={`batch-email-${recipient.id}`}
            type="email"
            value={recipient.email}
            disabled={disabled}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="recipient@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `batch-email-error-${recipient.id}` : undefined}
            className={`mt-0.5 block w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 ${
              errors.email
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                : 'border-slate-300 focus:border-slate-500 focus:ring-slate-500 dark:border-slate-600'
            }`}
          />
          {errors.email && (
            <p id={`batch-email-error-${recipient.id}`} className="mt-0.5 text-xs text-red-600 dark:text-red-400">
              {errors.email}
            </p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label
            htmlFor={`batch-amount-${recipient.id}`}
            className="block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            Amount <span className="text-red-500">*</span>
          </label>
          <div className="mt-0.5 flex gap-1">
            <input
              id={`batch-amount-${recipient.id}`}
              type="number"
              min="0.0000001"
              step="any"
              value={recipient.amountXlm}
              disabled={disabled}
              onChange={(e) => onChange({ amountXlm: e.target.value })}
              placeholder="0.00"
              aria-invalid={!!errors.amountXlm}
              aria-describedby={errors.amountXlm ? `batch-amount-error-${recipient.id}` : undefined}
              className={`block w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60 ${
                errors.amountXlm
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                  : 'border-slate-300 focus:border-slate-500 focus:ring-slate-500 dark:border-slate-600'
              }`}
            />
            <select
              aria-label="Asset"
              value={recipient.assetCode}
              disabled={disabled}
              onChange={(e) => onChange({ assetCode: e.target.value })}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60"
            >
              {SUPPORTED_ASSETS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          {errors.amountXlm && (
            <p id={`batch-amount-error-${recipient.id}`} className="mt-0.5 text-xs text-red-600 dark:text-red-400">
              {errors.amountXlm}
            </p>
          )}
        </div>
      </div>

      {/* Claim link on success */}
      {result?.status === 'success' && result.claimUrl && (
        <div className="mt-2 rounded bg-green-100 px-2 py-1 dark:bg-green-900">
          <p className="text-xs font-medium text-green-800 dark:text-green-300">Claim link:</p>
          <a
            href={result.claimUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-xs text-green-700 underline dark:text-green-400"
          >
            {result.claimUrl}
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BatchSendForm() {
  const [publicKey, setPublicKey] = useState('');
  const [walletStatus, setWalletStatus] = useState<'idle' | 'connecting' | 'error'>('idle');
  const [walletError, setWalletError] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<BatchRecipient[]>([emptyRow()]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, RecipientError>>({});
  const [results, setResults] = useState<Record<string, RecipientResult>>({});
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchDone, setBatchDone] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Restore persisted wallet on mount
  useEffect(() => {
    const saved = loadPersistedWallet();
    if (saved?.publicKey) setPublicKey(saved.publicKey);
  }, []);

  // ── Wallet ────────────────────────────────────────────────────────────────

  async function handleConnectWallet() {
    setWalletStatus('connecting');
    setWalletError(null);
    try {
      const wallet = await connectFreighter();
      persistWallet(wallet);
      setPublicKey(wallet.publicKey);
      setWalletStatus('idle');
    } catch (err) {
      setWalletStatus('error');
      setWalletError(
        err instanceof Error ? err.message : 'Failed to connect wallet. Please try again.',
      );
    }
  }

  // ── Recipient management ──────────────────────────────────────────────────

  function addRow() {
    if (recipients.length >= MAX_ROWS) return;
    setRecipients((prev) => [...prev, emptyRow()]);
  }

  function removeRow(id: string) {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function updateRow(id: string, patch: Partial<BatchRecipient>) {
    setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    // Re-validate on change if already touched
    if (fieldErrors[id]) {
      const row = recipients.find((r) => r.id === id)!;
      setFieldErrors((prev) => ({
        ...prev,
        [id]: validateRecipient({ ...row, ...patch }),
      }));
    }
  }

  // ── CSV import ────────────────────────────────────────────────────────────

  const handleCsvUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const rows = parseCsv(text);
        if (rows.length === 0) {
          setCsvError('No valid rows found in CSV. Expected columns: name, email, amount, asset.');
          return;
        }
        setRecipients(rows);
        setFieldErrors({});
        setResults({});
        setBatchDone(false);
      } catch {
        setCsvError('Failed to parse CSV. Please check the format.');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-uploaded
    e.target.value = '';
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────

  function validateAll(): boolean {
    const errors: Record<string, RecipientError> = {};
    let valid = true;
    for (const r of recipients) {
      const e = validateRecipient(r);
      errors[r.id] = e;
      if (Object.keys(e).length > 0) valid = false;
    }
    setFieldErrors(errors);
    return valid;
  }

  // ── Batch submission ──────────────────────────────────────────────────────

  async function handleBatchSend() {
    if (!validateAll()) return;
    setBatchRunning(true);
    setBatchDone(false);
    setResults({});

    for (const recipient of recipients) {
      setResults((prev) => ({
        ...prev,
        [recipient.id]: { id: recipient.id, status: 'processing' },
      }));

      try {
        const account = await createEphemeralAccount({
          fundingSource: publicKey,
          recovery_address: publicKey,
          amount: recipient.amountXlm,
          asset_code: recipient.assetCode !== 'XLM' ? recipient.assetCode : undefined,
          expiresIn: DEFAULT_EXPIRES_IN,
          metadata: {
            recipientName: recipient.name || undefined,
            recipientEmail: recipient.email || undefined,
          },
        });
        setResults((prev) => ({
          ...prev,
          [recipient.id]: {
            id: recipient.id,
            status: 'success',
            claimUrl: account.claimUrl ?? undefined,
          },
        }));
      } catch (err) {
        setResults((prev) => ({
          ...prev,
          [recipient.id]: {
            id: recipient.id,
            status: 'error',
            error: err instanceof Error ? err.message : 'Unexpected error.',
          },
        }));
      }
    }

    setBatchRunning(false);
    setBatchDone(true);
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const successCount = Object.values(results).filter((r) => r.status === 'success').length;
  const errorCount = Object.values(results).filter((r) => r.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Wallet connect */}
      {!publicKey ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Connect wallet to fund batch payments
          </p>
          <button
            type="button"
            onClick={handleConnectWallet}
            disabled={walletStatus === 'connecting'}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {walletStatus === 'connecting' ? 'Connecting…' : 'Connect Freighter Wallet'}
          </button>
          {walletStatus === 'error' && walletError && (
            <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">{walletError}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950">
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">Wallet connected</p>
            <p className="mt-0.5 break-all font-mono text-xs text-green-700 dark:text-green-400">{publicKey}</p>
          </div>
        </div>
      )}

      {/* CSV import */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Import recipients:</span>
        <label
          htmlFor="csv-upload"
          className="cursor-pointer rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:border-slate-500 hover:text-slate-800 dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-400 dark:hover:text-slate-200"
        >
          Upload CSV
        </label>
        <input
          id="csv-upload"
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleCsvUpload}
          className="sr-only"
          aria-label="Upload CSV file with recipient list"
        />
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Columns: <code className="font-mono">name, email, amount, asset</code>
        </span>
      </div>
      {csvError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{csvError}</p>
      )}

      {/* Recipient rows */}
      <div className="space-y-3" aria-label="Recipients list">
        {recipients.map((r, i) => (
          <RecipientRow
            key={r.id}
            index={i}
            recipient={r}
            errors={fieldErrors[r.id] ?? {}}
            result={results[r.id]}
            onChange={(patch) => updateRow(r.id, patch)}
            onRemove={() => removeRow(r.id)}
            disabled={batchRunning}
          />
        ))}
      </div>

      {/* Add row */}
      {!batchRunning && !batchDone && (
        <button
          type="button"
          onClick={addRow}
          disabled={recipients.length >= MAX_ROWS}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-slate-500 hover:text-slate-800 disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-400 dark:hover:text-slate-200"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add recipient
        </button>
      )}

      {/* Batch progress summary */}
      {batchDone && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-lg border p-4 ${
            errorCount === 0
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
              : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
          }`}
        >
          <p className={`text-sm font-medium ${errorCount === 0 ? 'text-green-800 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'}`}>
            Batch complete
          </p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            {successCount} succeeded, {errorCount} failed out of {recipients.length} total.
          </p>
        </div>
      )}

      {/* Send button */}
      {!batchDone && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBatchSend}
            disabled={batchRunning || !publicKey || recipients.length === 0}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {batchRunning
              ? `Sending (${Object.values(results).filter((r) => r.status !== 'pending').length}/${recipients.length})…`
              : `Send to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}`}
          </button>
          {batchRunning && (
            <span className="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
              {successCount} sent, {errorCount} failed
            </span>
          )}
        </div>
      )}

      {/* Retry failed */}
      {batchDone && errorCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setBatchDone(false);
            // Keep only failed recipients for retry
            setRecipients((prev) =>
              prev.filter((r) => results[r.id]?.status !== 'success'),
            );
            setResults({});
          }}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Retry {errorCount} failed
        </button>
      )}
    </div>
  );
}
