import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SharePrompt } from './share-prompt';

// NfcShareButton is tested in its own suite; stub it here.
vi.mock('./nfc-share-button', () => ({
  NfcShareButton: ({ claimUrl }: { claimUrl: string }) => (
    <button data-testid="nfc-share-button" data-url={claimUrl}>
      NFC Share
    </button>
  ),
}));

const APP_URL = 'https://bridgelet.org/claim?token=abc123';

describe('SharePrompt', () => {
  // ── Static content ─────────────────────────────────────────────────────────

  it('renders the app URL in the code block', () => {
    render(<SharePrompt appUrl={APP_URL} />);
    expect(screen.getByText(APP_URL)).toBeInTheDocument();
  });

  it('renders the promotional heading and description', () => {
    render(<SharePrompt appUrl={APP_URL} />);
    expect(screen.getByText(/do you send payments to your team/i)).toBeInTheDocument();
    expect(screen.getByText(/claim directly from a link/i)).toBeInTheDocument();
  });

  // ── Copy button ────────────────────────────────────────────────────────────

  it('renders the Copy link button', () => {
    render(<SharePrompt appUrl={APP_URL} />);
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
  });

  it('shows "Copied!" after clicking copy and reverts after 2 s', async () => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });

    render(<SharePrompt appUrl={APP_URL} />);
    await user.click(screen.getByRole('button', { name: /copy link/i }));

    expect(await screen.findByRole('button', { name: /copied!/i })).toBeInTheDocument();

    vi.advanceTimersByTime(2000);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument(),
    );
    vi.useRealTimers();
  });

  it('does not throw when the clipboard API is unavailable', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('not allowed')),
      },
    });
    const user = userEvent.setup();
    render(<SharePrompt appUrl={APP_URL} />);

    // Should not throw
    await user.click(screen.getByRole('button', { name: /copy link/i }));
    // Button label stays the same since copy failed silently
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
  });

  // ── WhatsApp share ─────────────────────────────────────────────────────────

  it('renders a WhatsApp share link with the correct wa.me deep-link', () => {
    render(<SharePrompt appUrl={APP_URL} />);
    const link = screen.getByRole('link', { name: /share on whatsapp/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('https://wa.me/?text='));
    expect(link).toHaveAttribute('href', expect.stringContaining(encodeURIComponent(APP_URL)));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  // ── X (Twitter) share ──────────────────────────────────────────────────────

  it('renders a Share on X link pointing to twitter.com/intent/tweet', () => {
    render(<SharePrompt appUrl={APP_URL} />);
    const link = screen.getByRole('link', { name: /share on x/i });
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('https://twitter.com/intent/tweet'),
    );
    expect(link).toHaveAttribute('href', expect.stringContaining(encodeURIComponent(APP_URL)));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  // ── LinkedIn share ─────────────────────────────────────────────────────────

  it('renders a Share on LinkedIn link', () => {
    render(<SharePrompt appUrl={APP_URL} />);
    const link = screen.getByRole('link', { name: /share on linkedin/i });
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('linkedin.com/sharing/share-offsite'),
    );
    expect(link).toHaveAttribute('href', expect.stringContaining(encodeURIComponent(APP_URL)));
    expect(link).toHaveAttribute('target', '_blank');
  });

  // ── NFC share button ───────────────────────────────────────────────────────

  it('passes the appUrl to the NfcShareButton', () => {
    render(<SharePrompt appUrl={APP_URL} />);
    expect(screen.getByTestId('nfc-share-button')).toHaveAttribute('data-url', APP_URL);
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it('opens every external link in a new tab with noopener noreferrer', () => {
    render(<SharePrompt appUrl={APP_URL} />);
    const externalLinks = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('target') === '_blank');
    externalLinks.forEach((link) => {
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    });
  });
});
