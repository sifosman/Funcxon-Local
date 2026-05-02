import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, radii, typography } from '../theme';
import { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { AppFooter } from '../components/AppFooter';
import { supabase } from '../lib/supabaseClient';

type NavigationProp = NativeStackNavigationProp<AttendeeStackParamList>;

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

type Review = {
  id: number;
  name: string;
  rating: number;
  comment: string;
};

const REVIEWS: Review[] = [
  {
    id: 1,
    name: 'Thandi M.',
    rating: 5,
    comment: 'Funcxon made finding the perfect venue so easy! The platform is intuitive and the vendors are top quality.',
  },
  {
    id: 2,
    name: 'James K.',
    rating: 5,
    comment: 'As a venue owner, listing on Funcxon has brought us so many new clients. Highly recommend!',
  },
  {
    id: 3,
    name: 'Nomsa D.',
    rating: 4,
    comment: 'Great selection of vendors and the booking process was smooth. Will definitely use again.',
  },
];

export default function ListersPortalScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { session, user } = useAuth();

  const getUsername = () => {
    if (!user) return null;
    const displayName = user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name;
    if (displayName) return displayName;
    if (user.email) {
      return user.email.split('@')[0];
    }
    return null;
  };

  const username = getUsername();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <MaterialIcons
        key={i}
        name={i < rating ? 'star' : 'star-border'}
        size={16}
        color={i < rating ? '#FFB800' : colors.textMuted}
      />
    ));
  };

  const handleLogin = () => {
    navigation.navigate('Auth' as never, { screen: 'SignIn' } as never);
  };

  const handleRegisterVenue = () => {
    if (!session) {
      handleLogin();
      return;
    }
    // Navigate to Venue Listing Plans (Account tab)
    navigation.getParent()?.navigate('Account', {
      screen: 'VenueListingPlans',
    } as never);
  };

  const handleRegisterVendor = () => {
    if (!session) {
      handleLogin();
      return;
    }
    // Navigate to Vendor & Services Subscription Plans (Account tab)
    navigation.getParent()?.navigate('Account', {
      screen: 'SubscriptionPlans',
    } as never);
  };

  // Fetch listers-specific blog posts from Supabase
  const { data: blogPosts, isLoading: blogLoading } = useQuery({
    queryKey: ['blog-posts-listers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, cover_image_url, author_name, category, published_at, read_time_minutes')
        .eq('is_published', true)
        .in('audience', ['listers', 'all'])
        .order('published_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching listers blog posts:', error);
        return [];
      }
      return (data || []) as BlogPost[];
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Login / Greeting Section */}
      <View style={styles.authSection}>
        {session ? (
          <View style={styles.greetingContainer}>
            <MaterialIcons name="person" size={24} color={colors.primary} />
            <Text style={styles.greetingText}>Hi {username}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <MaterialIcons name="login" size={20} color={colors.surface} />
            <Text style={styles.loginButtonText}>LOGIN</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Welcome Section */}
      <View style={styles.section}>
        <Text style={styles.welcomeTitle}>Welcome to Funcxon</Text>
        <Text style={styles.welcomeSubtitle}>
          Your one-stop platform for discovering and listing amazing venues, vendors, and services across South Africa.
        </Text>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <Text style={styles.bodyText}>
          Funcxon is South Africa's premier event planning platform, connecting hosts with the best venues, vendors, and services for every occasion. Whether you're planning a wedding, corporate event, birthday party, or any celebration, we make it easy to find, compare, and book the perfect professionals for your needs.
        </Text>
        <Text style={[styles.bodyText, styles.bodyTextSpacing]}>
          Our mission is to simplify event planning by bringing together a curated network of trusted listers who are passionate about making your events unforgettable. From stunning venues to talented vendors, Funcxon is your trusted partner in creating memorable experiences.
        </Text>
      </View>

      {/* Marketing Hook */}
      <View style={styles.marketingSection}>
        <Text style={styles.marketingText}>
          ✨ Join thousands of happy hosts and listers who trust Funcxon for their event planning needs!
        </Text>
      </View>

      {/* CTA Buttons */}
      <View style={styles.ctaSection}>
        <TouchableOpacity style={styles.ctaButtonPrimary} onPress={handleRegisterVenue}>
          <Text style={styles.ctaButtonTextPrimary}>Register your venue portfolio now!</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctaButtonSecondary} onPress={handleRegisterVendor}>
          <Text style={styles.ctaButtonTextSecondary}>Register your vendor/services now!</Text>
        </TouchableOpacity>
      </View>

      {/* Social Proof */}
      <View style={styles.section}>
        <Text style={styles.socialProofText}>
          Still not sure? Here's what other listers are saying...
        </Text>
      </View>

      {/* Reviews Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
        {REVIEWS.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewName}>{review.name}</Text>
              <View style={styles.starsContainer}>{renderStars(review.rating)}</View>
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
          </View>
        ))}
      </View>

      {/* CTA Buttons (Repeated) */}
      <View style={styles.ctaSection}>
        <TouchableOpacity style={styles.ctaButtonPrimary} onPress={handleRegisterVenue}>
          <Text style={styles.ctaButtonTextPrimary}>Register your venue portfolio now!</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctaButtonSecondary} onPress={handleRegisterVendor}>
          <Text style={styles.ctaButtonTextSecondary}>Register your vendor/services now!</Text>
        </TouchableOpacity>
      </View>

      {/* Listers Blog Section */}
      <View style={styles.section}>
        <View style={styles.blogHeader}>
          <View>
            <Text style={styles.sectionTitle}>Listers Blog</Text>
            <Text style={styles.blogSubtitle}>Tips, guides, and insights for listers</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('BlogList' as never)}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {blogLoading ? (
          <View style={styles.loadingContainer}>
            <MaterialIcons name="hourglass-empty" size={32} color={colors.textMuted} />
            <Text style={styles.loadingText}>Loading blog posts...</Text>
          </View>
        ) : blogPosts && blogPosts.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.blogScrollContainer}>
            {blogPosts.map((post) => (
              <TouchableOpacity
                key={post.id}
                activeOpacity={0.9}
                style={styles.blogCard}
                onPress={() => navigation.navigate('BlogDetail', { slug: post.slug })}
              >
                <View style={styles.blogCardInner}>
                  {post.cover_image_url ? (
                    <Image source={{ uri: post.cover_image_url }} style={styles.blogCardImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.blogCardImagePlaceholder}>
                      <MaterialIcons name="article" size={40} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.blogCardContent}>
                    <View>
                      <View style={styles.blogCategoryBadge}>
                        <Text style={styles.blogCategoryText}>{post.category}</Text>
                      </View>
                      <Text style={styles.blogCardTitle} numberOfLines={2}>{post.title}</Text>
                      <Text style={styles.blogCardExcerpt} numberOfLines={2}>{post.excerpt}</Text>
                    </View>
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
            <Text style={styles.emptyBlogSubtext}>Check back soon for lister tips and guides!</Text>
          </View>
        )}
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />

      {/* Footer */}
      <AppFooter
        onNavigateToFAQs={() => Alert.alert('FAQs', 'FAQs page coming soon!')}
        onNavigateToHelpDesk={() => Alert.alert('Help Desk', 'Help desk coming soon!')}
        onNavigateToTerms={() => navigation.navigate('TermsAndPolicies' as never)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Auth Section
  authSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
  },
  greetingText: {
    ...typography.titleMedium,
    color: colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
  },
  loginButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
    fontSize: 16,
  },

  // Sections
  section: {
    marginBottom: spacing.xl,
  },

  // Welcome
  welcomeTitle: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  // About
  sectionTitle: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  bodyText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  bodyTextSpacing: {
    marginTop: spacing.md,
  },

  // Marketing
  marketingSection: {
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  marketingText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
    lineHeight: 24,
  },

  // CTA Buttons
  ctaSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  ctaButtonPrimary: {
    backgroundColor: colors.textPrimary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  ctaButtonTextPrimary: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  ctaButtonSecondary: {
    backgroundColor: colors.background,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.borderSubtle,
  },
  ctaButtonTextSecondary: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },

  // Social Proof
  socialProofText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  // Reviews
  reviewCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Blog Section
  blogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  blogSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  viewAllText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
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
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
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
    fontSize: 10,
  },
  blogCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blogCardReadTime: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.xs,
    fontSize: 10,
  },

  // Loading / Empty states
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
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
  emptyBlogSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  // Bottom spacing
  bottomSpacing: {
    height: spacing.xxl,
  },
});
