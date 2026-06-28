import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ClaimStatusCard } from './claim-status-card';

const meta: Meta<typeof ClaimStatusCard> = {
  title: 'Components/ClaimStatusCard',
  component: ClaimStatusCard,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof ClaimStatusCard>;

export const Loading: Story = {
  args: { status: 'loading' },
};

export const Unclaimed: Story = {
  args: { status: 'unclaimed', amount: '100', asset: 'USDC', expiresAt: '2026-07-15T12:00:00Z' },
};

export const Claimed: Story = {
  args: { status: 'claimed', amount: '100', asset: 'USDC' },
};

export const Expired: Story = {
  args: { status: 'expired', amount: '50', asset: 'XLM', expiresAt: '2026-06-01T00:00:00Z' },
};
