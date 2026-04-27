import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

type ActivityItem = {
  id: string;
  recipient: string;
  amount: string;
  asset: string;
  status: 'unclaimed' | 'claimed' | 'expired';
  createdAt: string;
};

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'tr_001',
    recipient: 'Nene Obi',
    amount: '24.50',
    asset: 'USDC',
    status: 'unclaimed',
    createdAt: '2026-04-26',
  },
  {
    id: 'tr_002',
    recipient: 'Musa Bello',
    amount: '5.00',
    asset: 'XLM',
    status: 'claimed',
    createdAt: '2026-04-25',
  },
  {
    id: 'tr_003',
    recipient: 'Ada Nwosu',
    amount: '8.10',
    asset: 'USDC',
    status: 'expired',
    createdAt: '2026-04-22',
  },
];

const statusColors: Record<ActivityItem['status'], string> = {
  unclaimed: '#F59E0B',
  claimed: '#22C55E',
  expired: '#EF4444',
};

const SkeletonCard = () => <View style={styles.skeletonBlock} />;

export default function SenderDashboardScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActivity(MOCK_ACTIVITY);
      setIsLoading(false);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  const summary = useMemo(() => {
    const totalSent = activity.reduce((sum, item) => {
      const value = Number.parseFloat(item.amount);
      return Number.isNaN(value) ? sum : sum + value;
    }, 0);

    return {
      totalTransfers: activity.length,
      activeClaims: activity.filter((item) => item.status === 'unclaimed').length,
      totalSent: totalSent.toFixed(2),
    };
  }, [activity]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Sender Dashboard</Text>
        <Text style={styles.subheading}>
          Track your transfer activity and create new claims in one place.
        </Text>

        <View style={styles.cardGrid}>
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.cardLabel}>Total Sent</Text>
                <Text style={styles.cardValue}>{summary.totalSent}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.cardLabel}>Transfers</Text>
                <Text style={styles.cardValue}>{summary.totalTransfers}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.cardLabel}>Active Claims</Text>
                <Text style={styles.cardValue}>{summary.activeClaims}</Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/send/create')}
        >
          <Text style={styles.primaryButtonText}>Create Transfer</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Recent Activity</Text>
        </View>

        {isLoading ? (
          <View style={styles.activityList}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : activity.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first transfer to see activity here.
            </Text>
          </View>
        ) : (
          <View style={styles.activityList}>
            {activity.map((item) => (
              <View key={item.id} style={styles.activityItem}>
                <View>
                  <Text style={styles.activityRecipient}>{item.recipient}</Text>
                  <Text style={styles.activityMeta}>{item.createdAt}</Text>
                </View>
                <View style={styles.activityRight}>
                  <Text style={styles.activityAmount}>
                    {item.amount} {item.asset}
                  </Text>
                  <Text
                    style={[
                      styles.activityStatus,
                      { color: statusColors[item.status] },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    gap: 14,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  subheading: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 21,
  },
  cardGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    padding: 12,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  cardValue: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#2563EB',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    marginTop: 2,
  },
  sectionHeading: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '700',
  },
  activityList: {
    gap: 10,
  },
  activityItem: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityRecipient: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  activityMeta: {
    color: '#64748B',
    marginTop: 2,
    fontSize: 12,
  },
  activityRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  activityAmount: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  activityStatus: {
    textTransform: 'capitalize',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    padding: 18,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    marginTop: 6,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  skeletonBlock: {
    height: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    flex: 1,
  },
});
