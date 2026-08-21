import { useNotificationStore } from '../store/notificationStore';

const MAX_BADGE_COUNT = 9;

/**
 * Returns the badge label for the notifications tab.
 *
 * - Returns `undefined` when there are no unread notifications (hides badge).
 * - Returns `'9+'` when the unread count exceeds MAX_BADGE_COUNT.
 * - Returns the numeric count as a string otherwise.
 *
 * Pass the result directly to Expo Router's `tabBarBadge` prop.
 */
export function useNotificationBadge(): string | undefined {
  const unreadCount = useNotificationStore((state: { unreadCount: number }) => state.unreadCount);

  if (unreadCount <= 0) return undefined;
  if (unreadCount > MAX_BADGE_COUNT) return '9+';
  return String(unreadCount);
}