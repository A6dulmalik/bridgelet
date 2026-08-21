import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QRCode, QRCodeModalButton } from './qr-code';

describe('Client-Side QR Code Generator (Issue #409)', () => {
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders QR code SVG locally without making remote network calls', () => {
    const claimUrl = 'https://bridgelet.org/claim/secret-token-12345';
    render(<QRCode value={claimUrl} size={200} />);

    const svgElement = screen.getByRole('img', { name: new RegExp(claimUrl, 'i') });
    expect(svgElement).toBeInTheDocument();
    expect(svgElement.tagName.toLowerCase()).toBe('svg');

    // Security Verification: Guarantee zero external network calls occurred
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('toggles QR code modal button and renders claim link locally', () => {
    const claimUrl = 'https://bridgelet.org/claim/secret-token-67890';
    render(<QRCodeModalButton claimUrl={claimUrl} />);

    const button = screen.getByRole('button', { name: /show qr code/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByRole('button', { name: /hide qr code/i })).toBeInTheDocument();
    expect(screen.getByText(/rendered 100% locally/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
