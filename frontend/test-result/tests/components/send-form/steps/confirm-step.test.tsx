import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BridgeletApiError, RateLimitError } from '../../../../../lib/create-bridgelet-client';
import { ConfirmStep } from '../../../../../components/send-form/steps/confirm-step';

vi.mock('../../../../../hooks/use-nfc', () => ({
  useNfc: () => ({
    isSupported: false,
    writeUrl: vi.fn(),
    isWriting: false,
    error: null,
  }),
}));

vi.mock('../../../../../lib/env', () => ({
  publicEnv: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_API_BASE_URL: 'http://localhost:4000',
    NEXT_PUBLIC_CRYPTO_NETWORK: 'stellar-testnet',
    NEXT_PUBLIC_SUPPORT_EMAIL: 'support@example.com',
  },
}));

let createAccountImpl: () => Promise<any>;

vi.mock('../../../../../lib/create-bridgelet-client', async () => {
  const actual = await vi.importActual<typeof import('../../../../../lib/create-bridgelet-client')>('../../../../../lib/create-bridgelet-client');

  return {
    ...actual,
    BridgeletClient: class extends actual.BridgeletClient {
      override createAccount(): Promise<any> {
        return createAccountImpl();
      }
      override prepareAccountTransaction(): Promise<any> {
        return Promise.resolve({ unsignedTxXdr: 'test' });
      }
    },
  };
});

vi.mock('../../../../../lib/wallet', async () => {
  const actual = await vi.importActual<typeof import('../../../../../lib/wallet')>('../../../../../lib/wallet');
  return {
    ...actual,
    isFreighterTransactionSigningAvailable: vi.fn().mockReturnValue(false),
    signFreighterTransaction: vi.fn(),
  };
});

function mockCreateAccount(value: any) {
  createAccountImpl = () => Promise.resolve(value);
}

function mockCreateAccountRejects(err: unknown) {
  createAccountImpl = () => Promise.reject(err);
}

const STATE = {
  publicKey: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ23456789012345',
  recipientName: 'Test Recipient',
  recipientEmail: 'test@example.com',
  amountXlm: '10',
  assetCode: 'XLM',
  memo: 'Thanks!',
  expiresIn: 7 * 24 * 60 * 60,
};

describe('ConfirmStep error handling', () => {
  beforeEach(() => {
    mockCreateAccount({
      accountId: 'acct_1',
      publicKey: 'GABC',
      claimUrl: '/claim/1',
      amount: '10',
      asset: 'XLM',
      status: 'pending_payment',
      expiresAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    vi.clearAllMocks();
  });

  it('shows a user-friendly network error with a retry button', async () => {
    mockCreateAccountRejects(new TypeError('fetch failed'));

    const user = userEvent.setup();
    render(<ConfirmStep state={STATE} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /confirm & send/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/network error/i),
    );

    expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('shows a user-friendly insufficient funds error without a retry button', async () => {
    mockCreateAccountRejects(
      new BridgeletApiError(
        { error: { code: 'INSUFFICIENT_BALANCE', message: 'No funds' } },
        402,
      ),
    );

    const user = userEvent.setup();
    render(<ConfirmStep state={STATE} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /confirm & send/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/doesn.t have enough funds/i),
    );

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm & send/i })).toBeInTheDocument();
  });

  it('shows a user-friendly Stellar creation failure with retry', async () => {
    mockCreateAccountRejects(
      new BridgeletApiError(
        { error: { code: 'STELLAR_ERROR', message: 'tx failed' } },
        500,
      ),
    );

    const user = userEvent.setup();
    render(<ConfirmStep state={STATE} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /confirm & send/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/create the payment on the stellar network/i),
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('increments retry count and limits to MAX_RETRIES', async () => {
    mockCreateAccountRejects(new TypeError('fetch failed'));

    const user = userEvent.setup();
    render(<ConfirmStep state={STATE} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /confirm & send/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument());

    let tryAgainBtn = screen.getByRole('button', { name: /try again/i });
    expect(tryAgainBtn).toHaveTextContent(/2 left/);

    await user.click(tryAgainBtn);
    await waitFor(() => {
      tryAgainBtn = screen.getByRole('button', { name: /try again/i });
      expect(tryAgainBtn).toHaveTextContent(/1 left/);
    });

    await user.click(tryAgainBtn);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });
  });

  it('shows contact support after max retries', async () => {
    mockCreateAccountRejects(new TypeError('fetch failed'));

    const user = userEvent.setup();
    render(<ConfirmStep state={STATE} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /confirm & send/i }));
    for (let i = 0; i < 2; i++) {
      await waitFor(() => expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument());
      await user.click(screen.getByRole('button', { name: /try again/i }));
    }

    await waitFor(() => expect(screen.getByText(/contact support/i)).toBeInTheDocument());
  });

  it('keeps the Back button functional on error', async () => {
    const onBack = vi.fn();
    mockCreateAccountRejects(new TypeError('fetch failed'));

    const user = userEvent.setup();
    render(<ConfirmStep state={STATE} onBack={onBack} />);

    await user.click(screen.getByRole('button', { name: /confirm & send/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
