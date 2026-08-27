'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SendFormState } from '../index';
import { ClaimQrCode } from '../claim-qr-code';
import { useNfc } from '@/hooks/use-nfc';
import { BridgeletClient, RateLimitError } from '@/lib/api/client';
import { createEphemeralAccount, type EphemeralAccount } from '@/lib/bridgelet';
import { estimateCreateAccountFee } from '@/lib/fee-estimation';
import { getXlmUsdRate } from '@/lib/xlm-price';
import {
  FreighterSenderSigningError,
  toCreateAccountRequestWithFreighterSignature,
  tryFreighterSenderSigning,
} from '@/lib/freighter-sender-signing';
import {
  classifyAccountCreationError,
  AccountCreationErrorCode,
  type AccountCreationErrorInfo,
} from '@/lib/account-errors';
import { publicEnv } from '@/lib/env';

/**
 * Default claim window for accounts created from the send form.
 * CreateAccountRequest.expiresIn is required by the backend (min 3600,
 * max 2592000 seconds). This constant is kept as a fallback only;
 * the send form now lets the sender choose the expiry.
 */
const DEFAULT_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;
const MAX_RETRIES = 3;

const client = new BridgeletClient();

function classifyError(err: unknown): AccountCreationErrorInfo {
  if (err instanceof FreighterSenderSigningError) {
    return {
      code: AccountCreationErrorCode.INVALID_REQUEST,
      userMessage: err.message,
      retryable: err.code === 'USER_REJECTED',
      suggestion:
        err.code === 'SIGNER_MISMATCH'
          ? 'Reconnect the Freighter wallet that funds this payment, then try again.'
          : 'Approve the Freighter prompt, or go back and reconnect your wallet.',
    };
  }
  if (err instanceof RateLimitError) {
    return {
      code: AccountCreationErrorCode.RATE_LIMITED,
      userMessage: err.message,
      retryable: true,
      suggestion: 'Please wait before retrying.',
    };
  }
  return classifyAccountCreationError(err);
}

type ConfirmStepProps = {
  state: SendFormState;
  onBack: () => void;
};

type SubmitPhase = 'idle' | 'preparing' | 'awaiting-freighter' | 'submitting' | 'success';

interface FeeDisplay {
  xlm: string;
  fiat: string | null;
  capacityUsage: number;
}

/**
 * Issue #421 — after this many milliseconds spent in the 'submitting'
 * phase, we start describing the wait as "pending confirmation" instead
 * of "submitting", since the create-account request has almost certainly
 * left the browser and is now waiting on Stellar network confirmation.
 */
const PENDING_CONFIRMATION_AFTER_MS = 4_000;
/** After this long, reassure the sender the app hasn't frozen. */
const SLOW_NOTICE_AFTER_MS = 12_000;

export function ConfirmStep({ state, onBack }: ConfirmStepProps) {
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>('idle');
  const [signingModeUsed, setSigningModeUsed] = useState<'freighter-client' | 'backend' | null>(
    null,
  );
  const [errorInfo, setErrorInfo] = useState<AccountCreationErrorInfo | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [claimUrl, setClaimUrl] = useState<string | null>(null);
  // Issue #422 — timestamp captured the moment the account was created, used
  // to compute the claim link's absolute expiration deadline.
  const [successAt, setSuccessAt] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const { isSupported, writeUrl, isWriting, error: nfcError } = useNfc();

  // Issue #421 — pending/timeout UI state. `pendingConfirmation` flips the
  // "submitting" phase's copy over to a "waiting for network confirmation"
  // framing once enough time has passed that this is the more accurate
  // description; `showSlowNotice` reassures the sender that a long wait
  // isn't a frozen page.
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    if (submitPhase !== 'submitting') {
      setPendingConfirmation(false);
      setShowSlowNotice(false);
      return;
    }
    const pendingTimer = setTimeout(
      () => setPendingConfirmation(true),
      PENDING_CONFIRMATION_AFTER_MS,
    );
    const slowTimer = setTimeout(() => setShowSlowNotice(true), SLOW_NOTICE_AFTER_MS);
    return () => {
      clearTimeout(pendingTimer);
      clearTimeout(slowTimer);
    };
  }, [submitPhase]);

  // Fee estimation state
  const [feeDisplay, setFeeDisplay] = useState<FeeDisplay | null>(null);
  const [feeLoading, setFeeLoading] = useState(true);
  const [feeError, setFeeError] = useState<string | null>(null);

  const fetchFee = useCallback(async () => {
    setFeeLoading(true);
    setFeeError(null);
    try {
      const xlmRate = await getXlmUsdRate();
      const fee = await estimateCreateAccountFee(xlmRate > 0 ? xlmRate : null);
      setFeeDisplay({ xlm: fee.xlm, fiat: fee.fiat, capacityUsage: fee.capacityUsage });
    } catch {
      setFeeError('Could not fetch fee estimate. Network fee may apply.');
    } finally {
      setFeeLoading(false);
    }
  }, []);

  // Fetch fee on mount and refresh every 30 seconds while idle
  useEffect(() => {
    fetchFee();
    const interval = setInterval(() => {
      if (submitPhase === 'idle') fetchFee();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchFee, submitPhase]);

  const submitting = submitPhase !== 'idle' && submitPhase !== 'success';

  function buildCreateAccountPayload() {
    return {
      fundingSource: state.publicKey,
      recovery_address: state.publicKey,
      amount: state.amountXlm,
      asset_code: state.assetCode !== 'XLM' ? state.assetCode : undefined,
      expiresIn: state.expiresIn || DEFAULT_EXPIRES_IN_SECONDS,
      metadata: {
        recipientName: state.recipientName || undefined,
        recipientEmail: state.recipientEmail || undefined,
        memo: state.memo || undefined,
      },
    };
  }

  async function executeCreateAccount(attempt: number) {
    setSubmitPhase('preparing');
    setErrorInfo(null);
    setRetryAfter(null);
    try {
      const payload = buildCreateAccountPayload();

      setSubmitPhase('awaiting-freighter');
      const signing = await tryFreighterSenderSigning(client, payload);

      setSubmitPhase('submitting');
      let account: EphemeralAccount;
      if (signing.mode === 'freighter-client') {
        account = await createEphemeralAccount(
          toCreateAccountRequestWithFreighterSignature(payload, signing.signed),
        );
        setSigningModeUsed('freighter-client');
      } else {
        account = await createEphemeralAccount(payload);
        setSigningModeUsed('backend');
      }

      if (!account.claimUrl) {
        throw new Error(
          'Account was created but no claim link was returned. Please contact support.',
        );
      }

      setClaimUrl(account.claimUrl);
      setSuccessAt(Date.now());
      setSubmitPhase('success');
    } catch (err) {
      const info = classifyError(err);
      setErrorInfo(info);
      if (err instanceof RateLimitError) {
        setRetryAfter(err.retryAfter);
      } else {
        setRetryAfter(null);
      }
      setRetryCount(attempt);
      setSubmitPhase('idle');
    }
  }

  function handleConfirm() {
    executeCreateAccount(1);
  }

  // Issue #422 — one-click copy-to-clipboard for the claim link.
  async function handleCopyClaimUrl() {
    if (!claimUrl) return;
    try {
      await navigator.clipboard.writeText(claimUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — no-op; the
      // link is still visible and selectable for manual copying.
    }
  }

  function handleRetry() {
    const nextAttempt = retryCount + 1;
    if (nextAttempt > MAX_RETRIES) return;
    executeCreateAccount(nextAttempt);
  }

  function submittingLabel(): string {
    if (submitPhase === 'awaiting-freighter') return 'Waiting for Freighter…';
    if (submitPhase === 'preparing') return 'Preparing transaction…';
    if (submitPhase === 'submitting' && pendingConfirmation) return 'Pending confirmation…';
    return 'Submitting…';
  }

  if (submitPhase === 'success') {
    const claimLink = claimUrl || (typeof window !== 'undefined' ? `${window.location.origin}/claim` : 'https://bridgelet.org/claim');
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Here is your payment claim link via Bridgelet: ${claimLink}`)}`;

    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 space-y-3 dark:border-green-800 dark:bg-green-950"
      >
        <div>
          <p className="font-medium text-green-800 dark:text-green-300">Payment sent!</p>
          <p className="mt-1 text-sm text-green-700 dark:text-green-400">
            {state.recipientEmail ? (
              <>
                A claim link has been sent to <strong>{state.recipientEmail}</strong>.
              </>
            ) : (
              <>Your claim link is ready to share with your recipient.</>
            )}{' '}
            They have {formatExpiryLabel(state.expiresIn || DEFAULT_EXPIRES_IN_SECONDS)} to claim
            their funds.
          </p>
        </div>
        {signingModeUsed === 'freighter-client' && (
          <p className="mt-2 text-xs text-green-700 dark:text-green-400">
            Account creation was authorised with Freighter client-side signing.
          </p>
        )}

        {/* Issue #422 — the claim link, shown in full with a one-click copy
            button and its absolute claim-by deadline, so the sender doesn't
            have to rely on relative "7 days" phrasing alone when sharing it. */}
        {claimUrl && (
          <div className="rounded-lg border border-green-200 bg-white p-3 dark:border-green-800 dark:bg-slate-900">
            <p className="text-xs font-medium text-green-800 dark:text-green-300">Claim link</p>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 break-all rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {claimUrl}
              </code>
              <button
                type="button"
                onClick={handleCopyClaimUrl}
                className="shrink-0 rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                {linkCopied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
            <p className="mt-2 text-xs text-green-700 dark:text-green-400">
              Expires: {formatAbsoluteExpiry(successAt, state.expiresIn || DEFAULT_EXPIRES_IN_SECONDS)}
            </p>
          </div>
        )}

        {/* Issue #423 — scannable QR code for in-person or SMS-limited sharing. */}
        {claimUrl && (
          <div className="flex justify-center pt-1">
            <ClaimQrCode value={claimUrl} size={160} />
          </div>
        )}

        {claimUrl && (
          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
            >
              <span>Share via WhatsApp</span>
            </a>
          </div>
        )}

        {isSupported && claimUrl && (
          <div className="border-t border-green-200 pt-4 dark:border-green-800">
            <button
              onClick={() => writeUrl(claimUrl)}
              disabled={isWriting}
              className="inline-flex items-center rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:opacity-60 dark:bg-green-600 dark:hover:bg-green-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              {isWriting ? 'Ready to tap... hold tag to back of phone' : 'Write to NFC Tag'}
            </button>
            {nfcError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{nfcError}</p>}
          </div>
        )}
      </div>
    );
  }

  const canRetry = errorInfo !== null && errorInfo.retryable && retryCount < MAX_RETRIES;

  const supportEmail = publicEnv.NEXT_PUBLIC_SUPPORT_EMAIL;

  return (
    <div className="space-y-4">
      <dl className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex justify-between py-1.5">
          <dt className="font-medium text-slate-700 dark:text-slate-300">From wallet</dt>
          <dd className="max-w-[56%] break-all text-right font-mono text-xs text-slate-600 dark:text-slate-400">
            {state.publicKey}
          </dd>
        </div>
        <div className="flex justify-between py-1.5">
          <dt className="font-medium text-slate-700 dark:text-slate-300">Recipient</dt>
          <dd className="text-slate-600 dark:text-slate-400">
            {[state.recipientName, state.recipientEmail].filter(Boolean).join(' — ') ||
              'Not specified'}
          </dd>
        </div>
        <div className="flex justify-between py-1.5">
          <dt className="font-medium text-slate-700 dark:text-slate-300">Amount</dt>
          <dd className="text-slate-600 dark:text-slate-400">
            {state.amountXlm} {state.assetCode}
          </dd>
        </div>
        {state.memo && (
          <div className="flex justify-between py-1.5">
            <dt className="font-medium text-slate-700 dark:text-slate-300">Memo</dt>
            <dd className="text-slate-600 dark:text-slate-400">{state.memo}</dd>
          </div>
        )}
        {/* Issue #425 — expiry summary */}
        <div className="flex justify-between py-1.5">
          <dt className="font-medium text-slate-700 dark:text-slate-300">Claim expires</dt>
          <dd className="text-slate-600 dark:text-slate-400">
            {formatExpiryLabel(state.expiresIn || DEFAULT_EXPIRES_IN_SECONDS)} from now
          </dd>
        </div>
        <div className="flex justify-between py-1.5">
          <dt className="font-medium text-slate-700 dark:text-slate-300">Signing</dt>
          <dd className="text-slate-600 dark:text-slate-400">Freighter (experimental) with backend fallback</dd>
        </div>
      </dl>

      {/* Issue #426 — fee estimation */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Estimated network fee
          </span>
          <button
            type="button"
            onClick={fetchFee}
            disabled={feeLoading}
            aria-label="Refresh fee estimate"
            className="rounded p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-40 dark:text-slate-500 dark:hover:text-slate-200"
          >
            {/* Refresh icon */}
            <svg
              className={`h-4 w-4 ${feeLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <div aria-live="polite" className="mt-1">
          {feeLoading && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Fetching fee estimate…</p>
          )}
          {!feeLoading && feeError && (
            <p className="text-sm text-amber-700 dark:text-amber-400">{feeError}</p>
          )}
          {!feeLoading && feeDisplay && (
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {feeDisplay.xlm} XLM
                {feeDisplay.fiat && (
                  <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                    {feeDisplay.fiat}
                  </span>
                )}
              </p>
              {feeDisplay.capacityUsage > 0.8 && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Network is currently busy — fees may be higher than usual.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Issue #421 — distinct visual state for the submitting / pending-confirmation
          gap between "Confirm & Send" and the success screen, so the sender can
          tell the app is actively working rather than frozen. */}
      {submitting && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950"
        >
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{submittingLabel()}</p>
            <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
              {submitPhase === 'awaiting-freighter'
                ? 'Approve the request in your Freighter wallet extension.'
                : pendingConfirmation
                  ? 'Your transaction has been submitted and is waiting for confirmation on the Stellar network.'
                  : "Please don't close this window."}
            </p>
            {showSlowNotice && (
              <p className="mt-2 text-xs text-blue-700 dark:text-blue-400" role="alert">
                This is taking longer than usual. Your funds have not left your wallet unless
                confirmation completes — hang tight a little longer, or check back shortly.
              </p>
            )}
          </div>
        </div>
      )}

      {errorInfo && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <div className="flex items-start">
            <svg
              className="mr-2 h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{errorInfo.userMessage}</p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">{errorInfo.suggestion}</p>
              {retryAfter !== null && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Please wait {retryAfter} second{retryAfter !== 1 ? 's' : ''} before retrying.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Back
        </button>
        {errorInfo && canRetry ? (
          <button
            type="button"
            onClick={handleRetry}
            disabled={submitting}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 disabled:opacity-60 dark:bg-red-600 dark:hover:bg-red-500"
          >
            {submitting ? submittingLabel() : `Try Again (${MAX_RETRIES - retryCount} left)`}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {submitting ? submittingLabel() : 'Confirm & Send'}
          </button>
        )}
      </div>

      {errorInfo && retryCount >= MAX_RETRIES && supportEmail && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Still having trouble?{' '}
          <a
            href={`mailto:${supportEmail}`}
            className="font-medium text-red-700 underline hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Contact support
          </a>
          .
        </p>
      )}
    </div>
  );
}

function formatExpiryLabel(seconds: number): string {
  const days = Math.round(seconds / (24 * 60 * 60));
  if (days === 1) return '24 hours';
  if (days < 7) return `${days} days`;
  if (days === 7) return '7 days';
  if (days === 30) return '30 days';
  return `${days} days`;
}

/**
 * Issue #422 — absolute claim-by deadline, computed from the moment the
 * account was created plus its expiry window. Falls back to a relative-only
 * description if the creation timestamp isn't available yet.
 */
function formatAbsoluteExpiry(createdAtMs: number | null, expiresInSeconds: number): string {
  if (createdAtMs === null) return `in ${formatExpiryLabel(expiresInSeconds)}`;
  const deadline = new Date(createdAtMs + expiresInSeconds * 1000);
  const formatted = deadline.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return `${formatted} (in ${formatExpiryLabel(expiresInSeconds)})`;
}
