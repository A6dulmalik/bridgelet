import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SkeletonLoader, ClaimStatusCardSkeleton, AccountDetailsSkeleton } from './skeleton-loader';

const meta: Meta<typeof SkeletonLoader> = {
  title: 'Components/SkeletonLoader',
  component: SkeletonLoader,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof SkeletonLoader>;

export const Default: Story = {};

export const WithHeader: Story = {
  args: { showHeader: true, rows: 3 },
};

export const ManyRows: Story = {
  args: { rows: 6 },
};

export const ClaimCard: Story = {
  render: () => <ClaimStatusCardSkeleton />,
  name: 'ClaimStatusCard Skeleton',
};

export const AccountDetails: Story = {
  render: () => <AccountDetailsSkeleton />,
  name: 'AccountDetails Skeleton',
};
