import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchSendForm, validateRecipient, parseCsv } from './batch-send-form';

// ── Module mocks ─────────────────────────────────────────────────────────────

const mockConnectFreighter = vi.fn();
const mockLoadPersistedWallet = vi.fn().mockReturnValue(null);
const mockPersistWallet = vi.fn();
const mockCreateEphemeralAccount = vi.fn();

vi.mock('@/lib/wallet', () => ({
  connectFreighter: () => mockConnectFreighter(),
  loadPersistedWallet: () => mockLoadPersistedWallet(),
  persistWallet: (w: unknown) => mockPersistWallet(w),
  clearPersistedWallet: vi.fn(),
}));

vi.mock('@/lib/bridgelet', () => ({
  createEphemeralAccount: (data: unknown) => mockCreateEphemeralAccount(data),
}));

// ── Pure utility tests ────────────────────────────────────────────────────────

describe('validateRecipient', () => {
  it('returns no errors for a valid recipient', () => {
    expect(
      validateRecipient({ id: '1', name: 'Alice', email: 'alice@example.com', amountXlm: '10', assetCode: 'XLM' }),
    ).toEqual({});
  });

  it('returns an error when name is empty', () => {
    const errors = validateRecipient({ id: '1', name: '', email: '', amountXlm: '10', assetCode: 'XLM' });
    expect(errors.name).toBeTruthy();
  });

  it('returns an error for an invalid email', () => {
    const errors = validateRecipient({ id: '1', name: 'Alice', email: 'not-an-email', amountXlm: '10', assetCode: 'XLM' });
    expect(errors.email).toBeTruthy();
  });

  it('accepts an empty email without errors', () => {
    const errors = validateRecipient({ id: '1', name: 'Alice', email: '', amountXlm: '10', assetCode: 'XLM' });
    expect(errors.email).toBeUndefined();
  });

  it('returns an error when amount is 0', () => {
    const errors = validateRecipient({ id: '1', name: 'Alice', email: '', amountXlm: '0', assetCode: 'XLM' });
    expect(errors.amountXlm).toBeTruthy();
  });

  it('returns an error when amount is negative', () => {
    const errors = validateRecipient({ id: '1', name: 'Alice', email: '', amountXlm: '-5', assetCode: 'XLM' });
    expect(errors.amountXlm).toBeTruthy();
  });

  it('returns an error for an unsupported asset', () => {
    const errors = validateRecipient({ id: '1', name: 'Alice', email: '', amountXlm: '10', assetCode: 'ETH' });
    expect(errors.assetCode).toBeTruthy();
  });
});

describe('parseCsv', () => {
  it('parses a CSV without a header row', () => {
    const rows = parseCsv('Alice,alice@example.com,10,XLM\nBob,bob@example.com,5,USDC');
    expect(rows).toHaveLength(2);
    expect(rows[0]!.name).toBe('Alice');
    expect(rows[1]!.assetCode).toBe('USDC');
  });

  it('skips a header row starting with "name"', () => {
    const rows = parseCsv('name,email,amount,asset\nAlice,,10,XLM');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.name).toBe('Alice');
  });

  it('defaults asset to XLM when column is missing', () => {
    const rows = parseCsv('Alice,,10,');
    expect(rows[0]!.assetCode).toBe('XLM');
  });

  it('strips surrounding quotes from values', () => {
    const rows = parseCsv('"Alice","alice@example.com","10","XLM"');
    expect(rows[0]!.name).toBe('Alice');
    expect(rows[0]!.email).toBe('alice@example.com');
  });

  it('respects the MAX_ROWS cap of 100', () => {
    const lines = Array.from({ length: 110 }, (_, i) => `Recipient${i},,10,XLM`).join('\n');
    const rows = parseCsv(lines);
    expect(rows.length).toBeLessThanOrEqual(100);
  });
});

// ── Component tests ───────────────────────────────────────────────────────────

describe('BatchSendForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadPersistedWallet.mockReturnValue(null);
  });

  it('renders the wallet connect button when no wallet is persisted', () => {
    render(<BatchSendForm />);
    expect(screen.getByRole('button', { name: /connect freighter wallet/i })).toBeInTheDocument();
  });

  it('restores persisted wallet on mount', async () => {
    const savedKey = 'G' + 'B'.repeat(55);
    mockLoadPersistedWallet.mockReturnValue({ publicKey: savedKey, type: 'freighter' });
    render(<BatchSendForm />);
    await waitFor(() => {
      expect(screen.getByText(savedKey)).toBeInTheDocument();
    });
  });

  it('renders one empty recipient row by default', () => {
    render(<BatchSendForm />);
    // The recipients list container holds one row
    const list = screen.getByLabelText(/recipients list/i);
    expect(list.children).toHaveLength(1);
  });

  it('adds a new row when "Add recipient" is clicked', async () => {
    const user = userEvent.setup();
    render(<BatchSendForm />);

    await user.click(screen.getByRole('button', { name: /add recipient/i }));
    const list = screen.getByLabelText(/recipients list/i);
    expect(list.children).toHaveLength(2);
  });

  it('removes a row when the remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<BatchSendForm />);

    await user.click(screen.getByRole('button', { name: /add recipient/i }));
    const list = screen.getByLabelText(/recipients list/i);
    expect(list.children).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: /remove recipient 2/i }));
    expect(list.children).toHaveLength(1);
  });

  it('shows validation errors when submitting with empty fields', async () => {
    const key = 'G' + 'A'.repeat(55);
    mockLoadPersistedWallet.mockReturnValue({ publicKey: key, type: 'freighter' });
    const user = userEvent.setup();
    render(<BatchSendForm />);

    await waitFor(() => expect(screen.getByText(key)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /send to/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  it('shows batch progress and success state', async () => {
    const key = 'G' + 'A'.repeat(55);
    mockLoadPersistedWallet.mockReturnValue({ publicKey: key, type: 'freighter' });
    mockCreateEphemeralAccount.mockResolvedValue({
      claimUrl: 'https://example.com/claim/abc',
      accountId: 'acc-1',
    });
    const user = userEvent.setup();
    render(<BatchSendForm />);

    await waitFor(() => expect(screen.getByText(key)).toBeInTheDocument());

    // Fill in the one recipient row
    const list = screen.getByLabelText(/recipients list/i);
    const row = list.children[0] as HTMLElement;
    await user.type(within(row).getByLabelText(/^name/i), 'Alice');
    await user.type(within(row).getByLabelText(/amount/i), '10');

    await user.click(screen.getByRole('button', { name: /send to/i }));

    await waitFor(() => {
      expect(screen.getByText('Sent')).toBeInTheDocument();
    });
    expect(screen.getByRole('status')).toHaveTextContent(/1 succeeded/i);
  });

  it('shows error state when account creation fails', async () => {
    const key = 'G' + 'A'.repeat(55);
    mockLoadPersistedWallet.mockReturnValue({ publicKey: key, type: 'freighter' });
    mockCreateEphemeralAccount.mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    render(<BatchSendForm />);

    await waitFor(() => expect(screen.getByText(key)).toBeInTheDocument());

    const list = screen.getByLabelText(/recipients list/i);
    const row = list.children[0] as HTMLElement;
    await user.type(within(row).getByLabelText(/^name/i), 'Bob');
    await user.type(within(row).getByLabelText(/amount/i), '5');

    await user.click(screen.getByRole('button', { name: /send to/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed: network error/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('status')).toHaveTextContent(/1 failed/i);
  });
});
