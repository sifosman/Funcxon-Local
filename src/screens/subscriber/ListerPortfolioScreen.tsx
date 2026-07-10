import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
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
import { fetchHubSpotBlogPosts, type AppBlogPost } from '../../lib/hubspotBlog';
import { AppFooter } from '../../components/AppFooter';
import { HelpCenterModal } from '../../components/HelpCenterModal';
import ThemedAlert from '../../components/ThemedAlert';
import { useFocusEffect } from '@react-navigation/native';
import { SUPPORT_WHATSAPP } from '../../utils/env';
import type { ProfileStackParamList } from '../../navigation/ProfileNavigator';
import { useIsDesktop } from '../../hooks/useIsDesktop';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

type BlogPost = AppBlogPost;

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
  subscription_expires_at?: string | null;
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
  const isDesktop = useIsDesktop();
  const [vendorListing, setVendorListing] = useState<VendorListing | null>(null);
  const [venueListing, setVenueListing] = useState<VenueListing | null>(null);
  const [venueListingNeedsSetup, setVenueListingNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [helpVisible, setHelpVisible] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);

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
        .select('id, auth_user_id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      const listingUserId = userRow?.auth_user_id ?? user.id;

      const [{ data: vendorData }, { data: venueData }, { data: venuesData }] = await Promise.all([
        supabase.from('vendors').select('id, name, subscription_tier, subscription_status, subscription_expires_at').eq('user_id', listingUserId).maybeSingle(),
        supabase.from('venue_listings').select('id, name, subscription_plan, subscription_status').eq('user_id', listingUserId).maybeSingle(),
        supabase.from('venues').select('id, name, subscription_plan_key, subscription_status, subscription_expires_at').eq('user_id', listingUserId).maybeSingle(),
      ]);

      if (vendorData) setVendorListing(vendorData);
      if (venueData) {
        setVenueListing(venueData);
        setVenueListingNeedsSetup(false);
      } else if (venuesData) {
        setVenueListing({
          id: venuesData.id,
          name: venuesData.name,
          subscription_plan: venuesData.subscription_plan_key,
          subscription_status: venuesData.subscription_status,
          subscription_expires_at: venuesData.subscription_expires_at,
        });
        setVenueListingNeedsSetup(true);
      } else {
        setVenueListingNeedsSetup(false);
      }
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
    queryKey: ['blog-posts-lister-portfolio', 'hubspot'],
    queryFn: async () => {
      try {
        return await fetchHubSpotBlogPosts(4);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        return [];
      }
    },
  });

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      setAlertState({ visible: true, title: 'Sign out failed', message: error.message });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user-account', {});
      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Failed to delete account');
      }

      try {
        await signOut();
      } catch (signOutErr) {
        console.warn('Sign out after account deletion failed (ignored):', signOutErr);
      }
      const rootNav = navigation.getParent()?.getParent() as any;
      rootNav?.navigate?.('Auth', { screen: 'SignIn' });
    } catch (err: any) {
      setAlertState({
        visible: true,
        title: 'Deletion Failed',
        message: err?.message || 'Could not delete account. Please try again or contact support.',
        buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }],
      });
    }
  };

  const portfolioActions: ActionItem[] = [
    {
      id: 'new-application',
      label: 'Capture new portfolio application',
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
          setAlertState({
            visible: true,
            title: 'View Portfolio',
            message: 'Which portfolio would you like to view?',
            buttons: [
              { text: 'Vendor', style: 'default', onPress: () => { setAlertState(null); parentNav?.navigate?.('Main', { screen: 'Home', params: { screen: 'VendorProfile', params: { vendorId: vendorListing.id } } }); } },
              { text: 'Venue', style: 'default', onPress: () => {
                setAlertState(null);
                if (venueListingNeedsSetup) {
                  setAlertState({ visible: true, title: 'Venue Listing Setup', message: 'Your venue listing needs to be completed before it can be viewed publicly. Tap "Edit your portfolio details" to finish setting it up.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
                } else {
                  parentNav?.navigate?.('Main', { screen: 'Home', params: { screen: 'VenueProfile', params: { venueId: venueListing.id } } });
                }
              } },
              { text: 'Cancel', style: 'cancel', onPress: () => setAlertState(null) },
            ],
          });
        } else if (vendorListing) {
          parentNav?.navigate?.('Main', { screen: 'Home', params: { screen: 'VendorProfile', params: { vendorId: vendorListing.id } } });
        } else if (venueListing) {
          if (venueListingNeedsSetup) {
            setAlertState({ visible: true, title: 'Venue Listing Setup', message: 'Your venue listing needs to be completed before it can be viewed publicly. Tap "Edit your portfolio details" to finish setting it up.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
          } else {
            parentNav?.navigate?.('Main', { screen: 'Home', params: { screen: 'VenueProfile', params: { venueId: venueListing.id } } });
          }
        } else {
          setAlertState({ visible: true, title: 'No portfolio found', message: 'You do not have an active portfolio yet. Create one first.' });
        }
      },
    },
    {
      id: 'edit-portfolio',
      label: 'Edit your portfolio details',
      icon: 'edit',
      action: () => {
        if (vendorListing && venueListing) {
          setAlertState({
            visible: true,
            title: 'Edit Portfolio',
            message: 'Which portfolio would you like to edit?',
            buttons: [
              { text: 'Vendor', style: 'default', onPress: () => { setAlertState(null); navigation.navigate('UpdateVendorPortfolio'); } },
              { text: 'Venue', style: 'default', onPress: () => { setAlertState(null); navigation.navigate('UpdateVenuePortfolio'); } },
              { text: 'Cancel', style: 'cancel', onPress: () => setAlertState(null) },
            ],
          });
        } else if (vendorListing) {
          navigation.navigate('UpdateVendorPortfolio');
        } else if (venueListing) {
          navigation.navigate('UpdateVenuePortfolio');
        } else {
          setAlertState({ visible: true, title: 'No portfolio found', message: 'You do not have an active portfolio yet. Create one first.' });
        }
      },
    },
    {
      id: 'edit-catalogue',
      label: 'Edit catalogue items',
      icon: 'list',
      action: () => {
        if (vendorListing && venueListing) {
          setAlertState({
            visible: true,
            title: 'Edit Catalogue',
            message: 'Which catalogue would you like to edit?',
            buttons: [
              { text: 'Vendor', style: 'default', onPress: () => { setAlertState(null); navigation.navigate('VendorCatalogue'); } },
              { text: 'Venue', style: 'default', onPress: () => { setAlertState(null); navigation.navigate('VenueCatalogue'); } },
              { text: 'Cancel', style: 'cancel', onPress: () => setAlertState(null) },
            ],
          });
        } else if (vendorListing) {
          navigation.navigate('VendorCatalogue');
        } else if (venueListing) {
          navigation.navigate('VenueCatalogue');
        } else {
          setAlertState({ visible: true, title: 'No portfolio found', message: 'You do not have an active portfolio yet. Create one first.' });
        }
      },
    },
    {
      id: 'update-photos',
      label: 'Update photos & videos',
      icon: 'photo-library',
      action: () => {
        if (vendorListing && venueListing) {
          setAlertState({
            visible: true,
            title: 'Update Photos',
            message: 'Which portfolio would you like to update?',
            buttons: [
              { text: 'Vendor', style: 'default', onPress: () => { setAlertState(null); navigation.navigate('UpdateVendorPortfolio'); } },
              { text: 'Venue', style: 'default', onPress: () => { setAlertState(null); navigation.navigate('UpdateVenuePortfolio'); } },
              { text: 'Cancel', style: 'cancel', onPress: () => setAlertState(null) },
            ],
          });
        } else if (vendorListing) {
          navigation.navigate('UpdateVendorPortfolio');
        } else if (venueListing) {
          navigation.navigate('UpdateVenuePortfolio');
        } else {
          setAlertState({ visible: true, title: 'No portfolio found', message: 'You do not have an active portfolio yet. Create one first.' });
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
        setAlertState({
          visible: true,
          title: 'Delete Account',
          message: 'This will permanently delete your account and all associated data. Are you absolutely sure?',
          buttons: [
            { text: 'Cancel', style: 'cancel', onPress: () => setAlertState(null) },
            {
              text: 'Delete Forever',
              style: 'destructive',
              onPress: () => { setAlertState(null); handleDeleteAccount(); },
            },
          ],
        });
      },
    },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  const desktopContainerStyle = {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center' as const,
    paddingHorizontal: isDesktop ? 48 : spacing.lg,
    paddingBottom: spacing.xxl,
  };

  const cardStyle = {
    backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
    borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
  };

  const renderActionCard = (item: ActionItem, index: number, total: number) => {
    const isLast = index === total - 1;
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.actionRow, !isLast && styles.actionRowBorder]}
        onPress={item.action}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <MaterialIcons name={item.icon} size={22} color={colors.textPrimary} style={{ marginRight: spacing.md }} />
          <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary } as any : { ...typography.body, color: colors.textPrimary }}>
            {item.label}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDesktop ? colors.surfaceBg : colors.background }]} contentContainerStyle={desktopContainerStyle as any}>
      {/* Welcome Section */}
      <View style={styles.section}>
        <Text style={isDesktop ? { ...typography.headlineMd, color: colors.primary, marginBottom: spacing.xs } as any : styles.welcomeTitle}>Welcome back {getUsername()}</Text>
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant } as any : styles.welcomeSubtitle}>Let's get into it!!!</Text>
      </View>

      {isDesktop ? (
        <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
          <View style={{ flex: 1 } as any}>
            {/* Portfolio Actions Card */}
            <View style={[styles.card, cardStyle]}>
              <Text style={styles.cardTitle}>Portfolio</Text>
              {portfolioActions.map((item, i) => renderActionCard(item, i, portfolioActions.length))}
            </View>
          </View>
          <View style={{ flex: 1 } as any}>
            {/* Profile & Settings Card */}
            <View style={[styles.card, cardStyle]}>
              <Text style={styles.cardTitle}>Profile & Settings</Text>
              {settingsActions.map((item, i) => renderActionCard(item, i, settingsActions.length))}
            </View>
          </View>
        </View>
      ) : (
        <>
          {/* Portfolio Actions Card */}
          <View style={[styles.card, cardStyle]}>
            <Text style={styles.cardTitle}>Portfolio</Text>
            {portfolioActions.map((item, i) => renderActionCard(item, i, portfolioActions.length))}
          </View>

          {/* Profile & Settings Card */}
          <View style={[styles.card, cardStyle]}>
            <Text style={styles.cardTitle}>Profile & Settings</Text>
            {settingsActions.map((item, i) => renderActionCard(item, i, settingsActions.length))}
          </View>
        </>
      )}

      {/* Submit Review & Featured CTA */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('CreateReview', { type: 'app' })}
        >
          <MaterialIcons name="rate-review" size={18} color={colors.surface} style={{ marginRight: spacing.sm }} />
          <Text style={styles.ctaButtonText}>Submit a Funxon app review</Text>
        </TouchableOpacity>

        <View style={[styles.featuredCard, { backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.accent, borderColor: isDesktop ? colors.outlineVariant : undefined, borderWidth: isDesktop ? 1 : 0 }]}>
          <Text style={styles.featuredLabel}>Want priority exposure?</Text>
          <TouchableOpacity
            style={styles.featuredButton}
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            <Text style={styles.featuredButtonText}>GET FEATURED</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Listers Blog Section */}
      <View style={styles.section}>
        <View style={styles.blogHeader}>
          <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.md } as any : styles.sectionTitle}>Listers Blog</Text>
          <TouchableOpacity onPress={() => {
            const parentNav = (navigation as any).getParent?.();
            parentNav?.navigate?.('Main', { screen: 'Home', params: { screen: 'BlogList' } });
          }}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {blogLoading ? (
          <ActivityIndicator color={colors.textPrimary} style={{ marginVertical: spacing.lg }} />
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
                <View style={[styles.blogCardInner, cardStyle]}>
                  {post.cover_image_url ? (
                    <Image source={{ uri: post.cover_image_url }} style={styles.blogCardImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.blogCardImagePlaceholder}>
                      <MaterialIcons name="article" size={40} color={colors.textPrimary} />
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
      <View style={[styles.card, cardStyle]}>
        <Text style={styles.cardTitle}>Support</Text>
        {[
          { id: 'faqs', label: "FAQ's", icon: 'help-outline' as keyof typeof MaterialIcons.glyphMap, action: () => setHelpVisible(true) },
          { id: 'helpdesk', label: 'Need app assistance? Contact our helpdesk', icon: 'support-agent' as keyof typeof MaterialIcons.glyphMap, action: () => setHelpVisible(true) },
          { id: 'report', label: 'Report a problem to Funxon', icon: 'report-problem' as keyof typeof MaterialIcons.glyphMap, action: () => Linking.openURL('mailto:support@funxon.co.za?subject=Problem%20Report%20-%20Funxon') },
          { id: 'whatsapp', label: 'Chat with Funxon via WhatsApp', icon: 'chat' as keyof typeof MaterialIcons.glyphMap, action: () => Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP.replace(/[^0-9]/g, '')}`) },
          { id: 'email', label: 'Chat with Funxon via email', icon: 'email' as keyof typeof MaterialIcons.glyphMap, action: () => Linking.openURL('mailto:support@funxon.co.za') },
          { id: 'terms', label: 'Terms & Policies', icon: 'policy' as keyof typeof MaterialIcons.glyphMap, action: () => navigation.navigate('TermsAndPolicies') },
        ].map((item, i, arr) => renderActionCard(item, i, arr.length))}
      </View>

      <View style={{ height: spacing.xl }} />

      <AppFooter
        onNavigateToFAQs={() => navigation.navigate('PortfolioAssistance', { openFaqs: true })}
        onNavigateToHelpDesk={() => setHelpVisible(true)}
        onNavigateToTerms={() => navigation.navigate('TermsAndPolicies')}
      />
      <HelpCenterModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        onNavigateToHelp={() => {
          setHelpVisible(false);
          navigation.navigate('PortfolioAssistance', { openFaqs: true });
        }}
      />

      {alertState && (
        <ThemedAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={alertState.buttons ?? [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
          onDismiss={() => setAlertState(null)}
        />
      )}
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
    ...typography.titleLarge,
    color: colors.textPrimary,
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
    backgroundColor: colors.cta,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  ctaButtonText: {
    ...typography.bodySemiBold,
    color: colors.surface,
    fontSize: 15,
  },
  featuredCard: {
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.textPrimary,
  },
  featuredLabel: {
    ...typography.bodySemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  featuredButton: {
    backgroundColor: colors.cta,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
  },
  featuredButtonText: {
    ...typography.bodyBold,
    color: colors.surface,
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
  },
  blogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllText: {
    ...typography.bodySemiBold,
    color: colors.textPrimary,
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
    ...typography.captionSemiBold,
    color: colors.textPrimary,
    fontSize: 10,
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
