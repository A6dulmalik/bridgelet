import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SkeletonLoader, ClaimStatusCardSkeleton, AccountDetailsSkeleton } from './skeleton-loader';

describe('SkeletonLoader', () => {
  it('renders with an accessible status role and label', () => {
    render(<SkeletonLoader />);
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders the default number of rows (3)', () => {
    const { container } = render(<SkeletonLoader />);
    const rows = container.querySelectorAll('[style]');
    expect(rows).toHaveLength(3);
  });

  it('renders a header block when showHeader=true', () => {
    const { container } = render(<SkeletonLoader showHeader />);
    const blocks = container.querySelectorAll('.bg-slate-200');
    expect(blocks.length).toBeGreaterThanOrEqual(4);
  });

  it('respects the rows prop', () => {
    const { container } = render(<SkeletonLoader rows={5} />);
    const rows = container.querySelectorAll('[style]');
    expect(rows).toHaveLength(5);
  });

  it('has a visually-hidden "Loading content" message', () => {
    render(<SkeletonLoader />);
    expect(screen.getByText(/loading content, please wait/i)).toBeInTheDocument();
  });
});

describe('ClaimStatusCardSkeleton', () => {
  it('renders with an accessible status role', () => {
    render(<ClaimStatusCardSkeleton />);
    expect(screen.getByRole('status', { name: /loading claim details/i })).toBeInTheDocument();
  });

  it('has a visually-hidden loading message', () => {
    render(<ClaimStatusCardSkeleton />);
    expect(screen.getByText(/loading claim details, please wait/i)).toBeInTheDocument();
  });

  it('renders with animate-pulse class', () => {
    const { container } = render(<ClaimStatusCardSkeleton />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });
});

describe('AccountDetailsSkeleton', () => {
  it('renders with an accessible status role', () => {
    render(<AccountDetailsSkeleton />);
    expect(screen.getByRole('status', { name: /loading account details/i })).toBeInTheDocument();
  });

  it('has a visually-hidden loading message', () => {
    render(<AccountDetailsSkeleton />);
    expect(screen.getByText(/loading account details, please wait/i)).toBeInTheDocument();
  });

  it('renders with animate-pulse class', () => {
    const { container } = render(<AccountDetailsSkeleton />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });
});
