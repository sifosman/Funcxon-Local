import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radii, typography } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { AppFooter } from '../../components/AppFooter';
import { useFocusEffect } from '@react-navigation/native';

type ProfileStackParamList = {
  ListerPortfolio: undefined;
  PortfolioType: undefined;
  ApplicationStep1: undefined;
  UpdateVendorPortfolio: undefined;
  UpdateVenuePortfolio: undefined;
  VendorCatalogue: undefined;
  VenueCatalogue: undefined;
  AccountSettings: undefined;
  ChangePassword: undefined;
  MarketingPermissions: undefined;
  Billing: undefined;
  TermsAndPolicies: undefined;
  SubscriptionPlans: undefined;
  VenueListingPlans: undefined;
};

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  author_name: string;
  category: string;
  published_at: string;
  read_time_minutes: number;
};

type VendorListing = {
  id: number;
  name: string;
  subscription_tier: string | null;
  subscription_status: string | null;
  subscription_expires_at: string | null;
};

type VenueListing = {
  id: number;
  name: string;
  subscription_plan: string | null;
  subscription_status: string | null;
  subscription_expires_at: string | null;
};

type ActionItem = {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  action: () => void;
};

export default function ListerPortfolioScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, userRole, signOut } = useAuth();
  const [vendorListing, setVendorListing] = useState<VendorListing | null>(null);
  const [venueListing, setVenueListing] = useState<VenueListing | null>(null);
  const [loading, setLoading] = useState(true);

  const getUsername = () => {
    if (!user) return 'Lister';
    const displayName = user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name;
    if (displayName) return displayName;
    if (user.email) return user.email.split('@')[0];
    return 'Lister';
  };

  const fetchListerData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      const internalUserId = userRow?.id ?? user.id;

      const [{ data: vendorData }, { data: venueData }] = await Promise.all([
        supabase.from('vendors').select('id, name, subscription_tier, subscription_status, subscription_expires_at').eq('user_id', internalUserId).maybeSingle(),
        supabase.from('venue_listings').select('id, name, subscription_plan, subscription_status, subscription_expires_at').eq('user_id', internalUserId).maybeSingle(),
      ]);

      if (vendorData) setVendorListing(vendorData);
      if (venueData) setVenueListing(venueData);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchListerData();
    }, [fetchListerData])
  );

  const { data: blogPosts, isLoading: blogLoading } = useQuery({
    queryKey: ['blog-posts-lister-portfolio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, cover_image_url, author_name, category, published_at, read_time_minutes')
        .eq('is_published', true)
        .in('audience', ['listers', 'all'])
        .order('published_at', { ascending: false })
        .limit(4);

      if (error) {
        console.error('Error fetching blog posts:', error);
        return [];
      }
      return (data || []) as BlogPost[];
    },
  });

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      Alert.alert('Sign out failed', error.message);
    }
  };

  const portfolioActions: ActionItem[] = [
    {
      id: 'new-application',
      label: 'Capture your new portfolio application',
      icon: 'add-business',
      action: () => navigation.navigate('PortfolioType'),
    },
    {
      id: 'view-portfolio',
      label: 'View your portfolio',
      icon: 'visibility',
      action: () => {
        const parentNav = (navigation as any).getParent?.();
        if (vendorListing && venueListing) {
          Alert.alert('View Portfolio', 'Which portfolio would you like to view?', [
            { text: 'Vendor', onPress: () => parentNav?.navigate?.('Main', { screen: 'Home', params: { screen: 'VendorProfile', params: { vendorId: vendorListing.id } } }) },
            { text: 'Venue', onPress: () => parentNav?.navigate?.('Main', { screen: 'Home', params: { screen: 'VenueProfile', params: { venueId: venueListing.id } } }) },
            { text: 'Cancel', style: 'cancel' },
          ]);
        } else if (vendorListing) {
          parentNav?.navigate?.('Main', { screen: 'Home', params: { screen: 'VendorProfile', params: { vendorId: vendorListing.id } } });
        } else if (venueListing) {
          parentNav?.navigate?.('Main', { screen: 'Home', params: { screen: 'VenueProfile', params: { venueId: venueListing.id } } });
        } else {
          Alert.alert('No portfolio found', 'You do not have an active portfolio yet. Create one first.');
        }
      },
    },
    {
      id: 'edit-portfolio',
      label: 'Edit your portfolio details',
      icon: 'edit',
      action: () => {
        if (vendorListing && venueListing) {
          Alert.alert('Edit Portfolio', 'Which portfolio would you like to edit?', [
            { text: 'Vendor', onPress: () => navigation.navigate('UpdateVendorPortfolio') },
            { text: 'Venue', onPress: () => navigation.navigate('UpdateVenuePortfolio') },
            { text: 'Cancel', style: 'cancel' },
          ]);
        } else if (vendorListing) {
          navigation.navigate('UpdateVendorPortfolio');
        } else if (venueListing) {
          navigation.navigate('UpdateVenuePortfolio');
        } else {
          Alert.alert('No portfolio found', 'You do not have an active portfolio yet. Create one first.');
        }
      },
    },
    {
      id: 'edit-catalogue',
      label: 'Edit catalogue items',
      icon: 'list',
      action: () => {
        if (vendorListing && venueListing) {
          Alert.alert('Edit Catalogue', 'Which catalogue would you like to edit?', [
            { text: 'Vendor', onPress: () => navigation.navigate('VendorCatalogue') },
            { text: 'Venue', onPress: () => navigation.navigate('VenueCatalogue') },
            { text: 'Cancel', style: 'cancel' },
          ]);
        } else if (vendorListing) {
          navigation.navigate('VendorCatalogue');
        } else if (venueListing) {
          navigation.navigate('VenueCatalogue');
        } else {
          Alert.alert('No portfolio found', 'You do not have an active portfolio yet. Create one first.');
        }
      },
    },
    {
      id: 'update-photos',
      label: 'Update photos & videos',
      icon: 'photo-library',
      action: () => {
        if (vendorListing && venueListing) {
          Alert.alert('Update Photos', 'Which portfolio would you like to update?', [
            { text: 'Vendor', onPress: () => navigation.navigate('UpdateVendorPortfolio') },
            { text: 'Venue', onPress: () => navigation.navigate('UpdateVenuePortfolio') },
            { text: 'Cancel', style: 'cancel' },
          ]);
        } else if (vendorListing) {
          navigation.navigate('UpdateVendorPortfolio');
        } else if (venueListing) {
          navigation.navigate('UpdateVenuePortfolio');
        } else {
          Alert.alert('No portfolio found', 'You do not have an active portfolio yet. Create one first.');
        }
      },
    },
  ];

  const settingsActions: ActionItem[] = [
    {
      id: 'edit-profile',
      label: 'Edit your profile and settings',
      icon: 'settings',
      action: () => navigation.navigate('AccountSettings'),
    },
    {
      id: 'marketing-permissions',
      label: 'Marketing Permissions',
      icon: 'campaign',
      action: () => navigation.navigate('MarketingPermissions'),
    },
    {
      id: 'change-password',
      label: 'Change Password',
      icon: 'lock',
      action: () => navigation.navigate('ChangePassword'),
    },
    {
      id: 'my-subscription',
      label: 'My Subscription',
      icon: 'credit-card',
      action: () => navigation.navigate('Billing'),
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'logout',
      action: handleLogout,
    },
    {
      id: 'delete-account',
      label: 'Delete Account',
      icon: 'delete-forever',
      action: () => {
        Alert.alert(
          'Delete Account',
          'This will permanently delete your account and all associated data. Are you absolutely sure?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete Forever',
              style: 'destructive',
              onPress: () =>
                Alert.alert('Feature Coming Soon', 'Account deletion will be available soon. For now, please contact support to delete your account.'),
            },
          ]
        );
      },
    },
  ];

  const renderActionCard = (item: ActionItem, index: number, total: number) => (
    <TouchableOpacity
      key={item.id}
      onPress={item.action}
      style={[
        styles.actionRow,
        index < total - 1 && styles.actionRowBorder,
      ]}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <MaterialIcons name={item.icon} size={22} color={colors.primaryTeal} style={{ marginRight: spacing.md }} />
        <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary }}>
          {item.label}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primaryTeal} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Welcome Section */}
      <View style={styles.section}>
        <Text style={styles.welcomeTitle}>Welcome back {getUsername()}</Text>
        <Text style={styles.welcomeSubtitle}>Let's get into it!!!</Text>
      </View>

      {/* Subscription Info Cards */}
      {vendorListing && (
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderSubtle }}>
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>Vendor Plan</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
              <Text style={{ ...typography.body, color: colors.textMuted, width: 110 }}>Plan:</Text>
              <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                {vendorListing.subscription_tier ? vendorListing.subscription_tier.charAt(0).toUpperCase() + vendorListing.subscription_tier.slice(1) : 'Free'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={{ ...typography.body, color: colors.textMuted, width: 110 }}>Expires:</Text>
              <Text style={{ ...typography.body, color: colors.textPrimary }}>
                {vendorListing.subscription_expires_at
                  ? new Date(vendorListing.subscription_expires_at).toLocaleDateString('en-ZA')
                  : '—'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('SubscriptionPlans')}
                style={{ flex: 1, borderWidth: 1, borderColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.sm, alignItems: 'center' }}
              >
                <Text style={{ ...typography.body, color: colors.primary, fontWeight: '600' }}>Renew</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('SubscriptionPlans')}
                style={{ flex: 1, backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.sm, alignItems: 'center' }}
              >
                <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '600' }}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {venueListing && (
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderSubtle }}>
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>Venue Plan</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
              <Text style={{ ...typography.body, color: colors.textMuted, width: 110 }}>Plan:</Text>
              <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                {venueListing.subscription_plan ? venueListing.subscription_plan.charAt(0).toUpperCase() + venueListing.subscription_plan.slice(1) : 'Free'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={{ ...typography.body, color: colors.textMuted, width: 110 }}>Expires:</Text>
              <Text style={{ ...typography.body, color: colors.textPrimary }}>
                {venueListing.subscription_expires_at
                  ? new Date(venueListing.subscription_expires_at).toLocaleDateString('en-ZA')
                  : '—'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('SubscriptionPlans')}
                style={{ flex: 1, borderWidth: 1, borderColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.sm, alignItems: 'center' }}
              >
                <Text style={{ ...typography.body, color: colors.primary, fontWeight: '600' }}>Renew</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('VenueListingPlans')}
                style={{ flex: 1, backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.sm, alignItems: 'center' }}
              >
                <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '600' }}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Portfolio Actions Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Portfolio</Text>
        {portfolioActions.map((item, i) => renderActionCard(item, i, portfolioActions.length))}
      </View>

      {/* Profile & Settings Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile & Settings</Text>
        {settingsActions.map((item, i) => renderActionCard(item, i, settingsActions.length))}
      </View>

      {/* Submit Review & Featured CTA */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => {
            const parentNav = (navigation as any).getParent?.();
            if (vendorListing) {
              parentNav?.navigate?.('Main', { screen: 'Home', params: { screen: 'CreateReview', params: { type: 'vendor', targetId: vendorListing.id, targetName: vendorListing.name } } });
            } else if (venueListing) {
              parentNav?.navigate?.('Main', { screen: 'Home', params: { screen: 'CreateReview', params: { type: 'venue', targetId: venueListing.id, targetName: venueListing.name } } });
            } else {
              Alert.alert('No portfolio found', 'Create a portfolio first before submitting a review.');
            }
          }}
        >
          <MaterialIcons name="rate-review" size={18} color={colors.surface} style={{ marginRight: spacing.sm }} />
          <Text style={styles.ctaButtonText}>Submit a Funxon app review</Text>
        </TouchableOpacity>

        <View style={styles.featuredCard}>
          <Text style={styles.featuredLabel}>Want priority exposure?</Text>
          <TouchableOpacity
            style={styles.featuredButton}
            onPress={() => Alert.alert('Coming Soon', 'Featured listings will be available in a later release.')}
          >
            <Text style={styles.featuredButtonText}>GET FEATURED</Text>
          </TouchableOpacity>
        </View>

        {/* Temporary debug button */}
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: '#dc2626' }]}
          onPress={() => (navigation as any).navigate('DebugUser')}
        >
          <Text style={styles.ctaButtonText}>DEBUG: View User Data</Text>
        </TouchableOpacity>
      </View>

      {/* Listers Blog Section */}
      <View style={styles.section}>
        <View style={styles.blogHeader}>
          <Text style={styles.sectionTitle}>Listers Blog</Text>
          <TouchableOpacity onPress={() => {
            const parentNav = (navigation as any).getParent?.();
            parentNav?.navigate?.('Main', { screen: 'Home', params: { screen: 'BlogList' } });
          }}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {blogLoading ? (
          <ActivityIndicator color={colors.primaryTeal} style={{ marginVertical: spacing.lg }} />
        ) : blogPosts && blogPosts.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.blogScrollContainer}>
            {blogPosts.map((post) => (
              <TouchableOpacity
                key={post.id}
                activeOpacity={0.9}
                style={styles.blogCard}
                onPress={() => {
                  const parentNav = (navigation as any).getParent?.();
                  parentNav?.navigate?.('Main', { screen: 'Home', params: { screen: 'BlogDetail', params: { slug: post.slug } } });
                }}
              >
                <View style={styles.blogCardInner}>
                  {post.cover_image_url ? (
                    <Image source={{ uri: post.cover_image_url }} style={styles.blogCardImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.blogCardImagePlaceholder}>
                      <MaterialIcons name="article" size={40} color={colors.primaryTeal} />
                    </View>
                  )}
                  <View style={styles.blogCardContent}>
                    <View style={styles.blogCategoryBadge}>
                      <Text style={styles.blogCategoryText}>{post.category}</Text>
                    </View>
                    <Text style={styles.blogCardTitle} numberOfLines={2}>{post.title}</Text>
                    <Text style={styles.blogCardExcerpt} numberOfLines={2}>{post.excerpt}</Text>
                    <View style={styles.blogCardFooter}>
                      <MaterialIcons name="schedule" size={12} color={colors.textMuted} />
                      <Text style={styles.blogCardReadTime}>{post.read_time_minutes} min read</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyBlogContainer}>
            <MaterialIcons name="article" size={48} color={colors.textMuted} />
            <Text style={styles.emptyBlogText}>No blog posts available yet.</Text>
          </View>
        )}
      </View>

      {/* Support Links */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Support</Text>
        {[
          { id: 'faqs', label: "FAQ's", icon: 'help-outline' as keyof typeof MaterialIcons.glyphMap, action: () => Alert.alert("FAQ's", "FAQs page coming soon!") },
          { id: 'helpdesk', label: 'Need app assistance? Contact our helpdesk', icon: 'support-agent' as keyof typeof MaterialIcons.glyphMap, action: () => Alert.alert('Help Desk', 'Help desk coming soon!') },
          { id: 'report', label: 'Report a problem to Funxon', icon: 'report-problem' as keyof typeof MaterialIcons.glyphMap, action: () => Alert.alert('Report Problem', 'Problem reporting coming soon!') },
          { id: 'whatsapp', label: 'Chat with Funxon via WhatsApp', icon: 'chat' as keyof typeof MaterialIcons.glyphMap, action: () => Linking.openURL('https://wa.me/') },
          { id: 'email', label: 'Chat with Funxon via email', icon: 'email' as keyof typeof MaterialIcons.glyphMap, action: () => Linking.openURL('mailto:support@funcxon.com') },
          { id: 'terms', label: 'Terms & Policies', icon: 'policy' as keyof typeof MaterialIcons.glyphMap, action: () => navigation.navigate('TermsAndPolicies') },
        ].map((item, i, arr) => renderActionCard(item, i, arr.length))}
      </View>

      <View style={{ height: spacing.xl }} />

      <AppFooter
        onNavigateToFAQs={() => Alert.alert("FAQ's", "FAQs page coming soon!")}
        onNavigateToHelpDesk={() => Alert.alert('Help Desk', 'Help desk coming soon!')}
        onNavigateToTerms={() => navigation.navigate('TermsAndPolicies')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  ctaSection: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  ctaButton: {
    backgroundColor: colors.textPrimary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  ctaButtonText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 15,
  },
  featuredCard: {
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryTeal,
  },
  featuredLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  featuredButton: {
    backgroundColor: colors.textPrimary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
  },
  featuredButtonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  featuredNote: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  blogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllText: {
    ...typography.body,
    color: colors.primaryTeal,
    fontWeight: '600',
  },
  blogScrollContainer: {
    paddingRight: spacing.lg,
  },
  blogCard: {
    width: 260,
    marginRight: spacing.md,
  },
  blogCardInner: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    height: 320,
  },
  blogCardImage: {
    width: '100%',
    height: 140,
  },
  blogCardImagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blogCardContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  blogCategoryBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  blogCategoryText: {
    color: colors.primaryTeal,
    fontSize: 10,
    fontWeight: '600',
  },
  blogCardTitle: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontSize: 13,
  },
  blogCardExcerpt: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 18,
  },
  blogCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  blogCardReadTime: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.xs,
    fontSize: 10,
  },
  emptyBlogContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyBlogText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
