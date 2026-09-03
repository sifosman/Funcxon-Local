import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, radii, typography } from '../theme';
import { useIsDesktop } from '../hooks/useIsDesktop';

export default function DebugUserScreen() {
  const { user, session, userRole } = useAuth();
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const fetchDebugData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const [
          { data: usersRow, error: usersError },
          { data: vendorsRow, error: vendorsError },
          { data: venueListingsRow, error: venueListingsError },
        ] = await Promise.all([
          supabase.from('users').select('*').eq('auth_user_id', user.id).maybeSingle(),
          supabase.from('vendors').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('venue_listings').select('*').eq('user_id', user.id).maybeSingle(),
        ]);

        setDebugData({
          userId: user.id,
          userEmail: user.email,
          userRole,
          users: { data: usersRow, error: usersError },
          vendors: { data: vendorsRow, error: vendorsError },
          venue_listings: { data: venueListingsRow, error: venueListingsError },
        });
      } catch (err) {
        setDebugData({ error: err });
      } finally {
        setLoading(false);
      }
    };

    fetchDebugData();
  }, [user?.id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading debug data...</Text>
      </View>
    );
  }

  const renderDebugCard = (title: string, data: any) => (
    <View
      key={title}
      style={{
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        padding: spacing.lg,
        marginBottom: spacing.lg,
      }}
    >
      <Text style={{ ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.md }}>
        {title}
      </Text>
      <Text style={{ ...typography.bodyMd, color: colors.onSurface }}>{JSON.stringify(data, null, 2)}</Text>
    </View>
  );

  return (
    <ScrollView
      style={isDesktop ? { flex: 1, backgroundColor: colors.surfaceBg } : styles.container}
      contentContainerStyle={
        isDesktop
          ? {
              paddingHorizontal: 48,
              paddingTop: spacing.xl,
              paddingBottom: spacing.lg,
              maxWidth: 1200,
              width: '100%',
              alignSelf: 'center',
            }
          : undefined
      }
    >
      {isDesktop ? (
        <View>
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
            Debug User Data
          </Text>

          <View style={{ flexDirection: 'row', gap: spacing.gutter, marginBottom: spacing.lg } as any}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surfaceContainerLowest,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
                padding: spacing.lg,
              }}
            >
              <Text style={{ ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm }}>
                Email
              </Text>
              <Text style={{ ...typography.bodyMd, color: colors.onSurface }}>{user?.email ?? '—'}</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surfaceContainerLowest,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
                padding: spacing.lg,
              }}
            >
              <Text style={{ ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm }}>
                User ID
              </Text>
              <Text style={{ ...typography.bodyMd, color: colors.onSurface }}>{user?.id ?? '—'}</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surfaceContainerLowest,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
                padding: spacing.lg,
              }}
            >
              <Text style={{ ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm }}>
                Current Role
              </Text>
              <Text style={{ ...typography.bodyMd, color: colors.onSurface }}>{userRole ?? '—'}</Text>
            </View>
          </View>

          {debugData && (
            <View>
              {renderDebugCard('Users Table', debugData.users)}
              {renderDebugCard('Vendors Table', debugData.vendors)}
              {renderDebugCard('Venue Listings Table', debugData.venue_listings)}
            </View>
          )}
        </View>
      ) : (
        <>
          <Text style={styles.title}>Debug User Data</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Auth User</Text>
            <Text>Email: {user?.email}</Text>
            <Text>ID: {user?.id}</Text>
            <Text>Current Role: {userRole}</Text>
          </View>

          {debugData && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Users Table</Text>
                <Text>{JSON.stringify(debugData.users, null, 2)}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vendors Table</Text>
                <Text>{JSON.stringify(debugData.vendors, null, 2)}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Venue Listings Table</Text>
                <Text>{JSON.stringify(debugData.venue_listings, null, 2)}</Text>
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
});
