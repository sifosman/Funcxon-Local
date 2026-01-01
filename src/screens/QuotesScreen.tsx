import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import type { QuotesStackParamList } from '../navigation/QuotesNavigator';

type QuoteRequest = {
  id: number;
  vendor_id: number | null;
  name: string | null;
  email: string | null;
  status: string | null;
  details?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  budget?: string | null;
  quote_amount?: number | null;
  created_at?: string | null;
};

export default function QuotesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<QuotesStackParamList>>();

  const { data, isLoading, error } = useQuery<QuoteRequest[]>({
    queryKey: ['attendee-quotes'],
    queryFn: async () => {
      const { data: userRows, error: userError } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', 'demo_attendee')
        .limit(1);

      if (userError) {
        throw userError;
      }

      const demoUser = userRows?.[0] ?? { id: 6 };

      if (!demoUser) {
        return [];
      }

      const { data: quotes, error: quotesError } = await supabase
        .from('quote_requests')
        .select('id, vendor_id, name, email, status, details, event_type, event_date, budget, quote_amount, created_at')
        .eq('user_id', demoUser.id)
        .order('id', { ascending: false })
        .limit(50);

      if (quotesError) {
        throw quotesError;
      }

      return (quotes as QuoteRequest[]) ?? [];
    },
  });

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (error instanceof Error) {
    return (
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Failed to load quotes.</Text>
        <Text style={{ marginTop: spacing.sm, ...typography.body, color: colors.textMuted }}>{error.message}</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ textAlign: 'center', ...typography.body, color: colors.textPrimary }}>
          You have not requested any quotes yet.
        </Text>
        <Text
          style={{
            textAlign: 'center',
            marginTop: spacing.sm,
            ...typography.body,
            color: colors.textMuted,
          }}
        >
          Request a quote from a vendor to see it listed here.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        backgroundColor: colors.background,
      }}
    >
      <Text
        style={{
          ...typography.titleMedium,
          color: colors.textPrimary,
          marginBottom: spacing.md,
        }}
      >
        My quotes (demo)
      </Text>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('QuoteDetail', { quoteId: item.id })}
            style={{ marginBottom: spacing.sm }}
          >
            <View
              style={{
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text
                style={{
                  ...typography.body,
                  color: colors.textPrimary,
                  fontWeight: '600',
                }}
              >
                {item.name ?? 'Unnamed enquiry'}
              </Text>
              {item.event_type && (
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.textSecondary,
                    marginTop: spacing.xs,
                  }}
                >
                  Event type: {item.event_type}
                </Text>
              )}
              {item.email && (
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.textSecondary,
                    marginTop: spacing.xs,
                  }}
                >
                  {item.email}
                </Text>
              )}
              {(item.event_date || item.created_at) && (
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.textSecondary,
                    marginTop: spacing.xs,
                  }}
                >
                  Requested for:{' '}
                  {new Date(item.event_date || item.created_at || '').toLocaleDateString()}
                </Text>
              )}
              {item.budget && (
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.textSecondary,
                    marginTop: spacing.xs,
                  }}
                >
                  Budget: {item.budget}
                </Text>
              )}
              {typeof item.quote_amount === 'number' && (
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.textSecondary,
                    marginTop: spacing.xs,
                  }}
                >
                  Quoted amount: {item.quote_amount.toLocaleString()}
                </Text>
              )}
              {item.details && (
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.textSecondary,
                    marginTop: spacing.xs,
                  }}
                  numberOfLines={3}
                >
                  {item.details}
                </Text>
              )}
              <Text
                style={{
                  ...typography.caption,
                  color: colors.textSecondary,
                  marginTop: spacing.xs,
                }}
              >
                Status: {item.status ?? 'pending'}
              </Text>
              {item.vendor_id && (
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.textMuted,
                    marginTop: spacing.xs,
                  }}
                >
                  Vendor ID: {item.vendor_id}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
