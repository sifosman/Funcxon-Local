import { Text, View, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, spacing, radii, typography } from '../theme';
import { useIsDesktop } from '../hooks/useIsDesktop';

const adminCards = [
  { icon: 'people' as const, label: 'Users', value: '—' },
  { icon: 'store' as const, label: 'Vendors', value: '—' },
  { icon: 'location-city' as const, label: 'Venues', value: '—' },
  { icon: 'event' as const, label: 'Bookings', value: '—' },
];

export default function AdminDashboardScreen() {
  const isDesktop = useIsDesktop();

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      {isDesktop ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 48,
            paddingTop: spacing.sm,
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
                    borderColor: colors.outlineVariant,
                    padding: spacing.lg,
                    alignItems: 'center',
                  }}
                >
                  <MaterialIcons name={card.icon} size={32} color={colors.primary} />
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
