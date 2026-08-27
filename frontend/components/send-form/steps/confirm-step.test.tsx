import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmStep } from './confirm-step';
import type { SendFormState } from '../index';

vi.mock('@/hooks/use-nfc', () => ({
  useNfc: () => ({ isSupported: false, writeUrl: vi.fn(), isWriting: false, error: null }),
}));

vi.mock('@/lib/env', () => ({
  publicEnv: { NEXT_PUBLIC_SUPPORT_EMAIL: 'support@example.com' },
}));

vi.mock('@/lib/fee-estimation', () => ({
  estimateCreateAccountFee: vi.fn().mockResolvedValue({ xlm: '0.0001000', fiat: null, capacityUsage: 0 }),
}));

vi.mock('@/lib/xlm-price', () => ({
  getXlmUsdRate: vi.fn().mockResolvedValue(0),
}));

// Always take the "backend" signing path — Freighter client-side signing is
// exercised elsewhere; this file focuses on issue #421's pending/loading states.
vi.mock('@/lib/freighter-sender-signing', () => ({
  tryFreighterSenderSigning: vi.fn().mockResolvedValue({ mode: 'backend', reason: 'test' }),
  toCreateAccountRequestWithFreighterSignature: vi.fn(),
  FreighterSenderSigningError: class extends Error {},
}));

let createAccountResolve: (value: unknown) => void;
let createAccountReject: (err: unknown) => void;
const createEphemeralAccount = vi.fn();
vi.mock('@/lib/bridgelet', () => ({
  createEphemeralAccount: (...args: unknown[]) => createEphemeralAccount(...args),
}));

const STATE: SendFormState = {
  publicKey: 'G' + 'A'.repeat(55),
  recipientName: 'Amina',
  recipientEmail: '',
  amountXlm: '10',
  assetCode: 'XLM',
  memo: '',
  expiresIn: 7 * 24 * 60 * 60,
};

const SUCCESS_ACCOUNT = {
  accountId: 'acct_1',
  publicKey: 'GACCOUNT',
  claimUrl: 'https://bridgelet.org/claim/test-token-123',
  amount: '10',
  asset: 'XLM',
  status: 'pending',
  expiresAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

describe('ConfirmStep — issue #421 pending/loading states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createEphemeralAccount.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          createAccountResolve = resolve;
          createAccountReject = reject;
        }),
    );
  });

  it('shows a distinct pending banner and disables the submit button while submitting', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ConfirmStep state={STATE} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /confirm & send/i }));

    // The pending banner (role="status") and the submit button both reflect
    // the "submitting" phase.
    await waitFor(() => {
      const statuses = screen.getAllByRole('status');
      expect(statuses.some((el) => /submitting/i.test(el.textContent ?? ''))).toBe(true);
    });
    expect(screen.getByRole('button', { name: /confirm & send|submitting|sending/i })).toBeDisabled();

    createAccountResolve(SUCCESS_ACCOUNT);
    await waitFor(() => expect(screen.getByText(/payment sent/i)).toBeInTheDocument());
  });

  it('returns to an enabled, idle state if account creation fails', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ConfirmStep state={STATE} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /confirm & send/i }));
    createAccountReject(new TypeError('fetch failed'));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /confirm & send/i })).not.toBeDisabled(),
    );
  });
});
