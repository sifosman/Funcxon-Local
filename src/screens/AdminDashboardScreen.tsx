import { Text, View, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { colors, spacing, radii, typography } from '../theme';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { supabase } from '../lib/supabaseClient';

type AdminCard = {
  icon: 'people' | 'store' | 'location-city' | 'event' | 'delete-forever';
  label: string;
  value: string;
  highlight?: boolean;
};

export default function AdminDashboardScreen() {
  const isDesktop = useIsDesktop();

  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [users, vendors, venues, deletionRequests] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('vendors').select('*', { count: 'exact', head: true }),
        supabase.from('venue_listings').select('*', { count: 'exact', head: true }),
        supabase
          .from('account_deletion_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

      return {
        users: users.count ?? 0,
        vendors: vendors.count ?? 0,
        venues: venues.count ?? 0,
        pendingDeletions: deletionRequests.count ?? 0,
      };
    },
  });

  const adminCards: AdminCard[] = [
    { icon: 'people', label: 'Users', value: stats ? String(stats.users) : '—' },
    { icon: 'store', label: 'Vendors', value: stats ? String(stats.vendors) : '—' },
    { icon: 'location-city', label: 'Venues', value: stats ? String(stats.venues) : '—' },
    { icon: 'event', label: 'Bookings', value: '—' },
    {
      icon: 'delete-forever',
      label: 'Deletion Requests',
      value: stats ? String(stats.pendingDeletions) : '—',
      highlight: (stats?.pendingDeletions ?? 0) > 0,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      {isDesktop ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 48,
            paddingTop: spacing.xl,
            paddingBottom: 120,
            maxWidth: 1200,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <Text
            style={{
              ...typography.labelMd,
              color: colors.dustyRose,
              marginBottom: spacing.sm,
              textTransform: 'uppercase',
              letterSpacing: 0.05,
            } as any}
          >
            Admin
          </Text>
          <Text style={{ ...typography.headlineMd, color: colors.primary, marginBottom: spacing.xl }}>
            Dashboard
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.gutter } as any}>
            {adminCards.map((card) => (
              <View key={card.label} style={{ flex: 1, minWidth: 240 } as any}>
                <View
                  style={{
                    backgroundColor: colors.surfaceContainerLowest,
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: card.highlight ? colors.dustyRose : colors.outlineVariant,
                    padding: spacing.lg,
                    alignItems: 'center',
                  }}
                >
                  <MaterialIcons name={card.icon} size={32} color={card.highlight ? colors.dustyRose : colors.primary} />
                  <Text
                    style={{
                      ...typography.headlineSm,
                      color: colors.textPrimary,
                      marginTop: spacing.md,
                    }}
                  >
                    {card.value}
                  </Text>
                  <Text
                    style={{
                      ...typography.labelMd,
                      color: colors.onSurfaceVariant,
                      marginTop: spacing.xs,
                    }}
                  >
                    {card.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <>
          <View
            style={{
              flex: 1,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.lg,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.background,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Admin dashboard</Text>
          </View>
        </>
      )}
    </View>
  );
}
