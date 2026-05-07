import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, typography } from '../theme';

export default function DebugUserScreen() {
  const { user, session, userRole } = useAuth();
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <ScrollView style={styles.container}>
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
