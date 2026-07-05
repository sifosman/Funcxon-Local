import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, radii, typography } from '../theme';
import { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { AppFooter } from '../components/AppFooter';
import { HelpCenterModal } from '../components/HelpCenterModal';
import { fetchHubSpotBlogPosts, type AppBlogPost } from '../lib/hubspotBlog';
import ThemedAlert from '../components/ThemedAlert';

type NavigationProp = NativeStackNavigationProp<AttendeeStackParamList>;

type BlogPost = AppBlogPost;

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
    comment: 'Funxon made finding the perfect venue so easy! The platform is intuitive and the vendors are top quality.',
  },
  {
    id: 2,
    name: 'James K.',
    rating: 5,
    comment: 'As a venue owner, listing on Funxon has brought us so many new clients. Highly recommend!',
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
  const isDesktop = useIsDesktop();
  const { session, user, userRole } = useAuth();
  const [helpVisible, setHelpVisible] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);

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
  const isLister = !!session && userRole === 'vendor';

  useFocusEffect(
    useCallback(() => {
      if (isLister) {
        const parentNav = navigation.getParent()?.getParent() as any;
        parentNav?.navigate?.('Account');
      }
    }, [isLister, navigation])
  );

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
    (navigation as any).navigate('Auth', { screen: 'SignIn' });
  };

  const handleRegisterVenue = () => {
    navigation.navigate('VenueListingPlans' as never);
  };

  const handleRegisterVendor = () => {
    navigation.navigate('SubscriptionPlans' as never);
  };

  // Fetch blog posts from HubSpot
  const { data: blogPosts, isLoading: blogLoading } = useQuery({
    queryKey: ['blog-posts-listers', 'hubspot'],
    queryFn: async () => {
      try {
        return await fetchHubSpotBlogPosts(6);
      } catch (err) {
        console.error('Error fetching listers blog posts:', err);
        return [];
      }
    },
  });

  const renderHeroCard = () => (
    <View
      style={{
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        padding: spacing.xxl,
        width: '100%',
        maxWidth: 480,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'center' }}>
        Join as a Lister
      </Text>
      <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.xl, textAlign: 'center', lineHeight: 24 }}>
        Register your venue or vendor services to start reaching event hosts today.
      </Text>

      <View style={{ gap: spacing.md } as any}>
        <TouchableOpacity
          style={{
            backgroundColor: colors.textPrimary,
            borderRadius: radii.lg,
            paddingVertical: spacing.lg,
            alignItems: 'center',
          }}
          onPress={handleRegisterVenue}
          activeOpacity={0.9}
        >
          <Text style={{ ...typography.bodySemiBold, color: colors.surface, fontSize: 16 }}>
            Register your venue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            borderRadius: radii.lg,
            paddingVertical: spacing.lg,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: colors.primary,
          }}
          onPress={handleRegisterVendor}
          activeOpacity={0.9}
        >
          <Text style={{ ...typography.bodySemiBold, color: colors.surface, fontSize: 16 }}>
            Register your services
          </Text>
        </TouchableOpacity>
      </View>

      {!session && (
        <TouchableOpacity
          onPress={handleLogin}
          style={{ marginTop: spacing.lg, alignItems: 'center' }}
        >
          <Text style={{ ...typography.bodyMd, color: colors.textPrimary }}>
            Already have an account? <Text style={{ fontWeight: '600' }}>Log in</Text>
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderListerTypeCards = () => {
    const cards = [
      {
        icon: 'location-city',
        title: 'Venues',
        description: 'Showcase your event space and attract bookings from party planners, weddings, and corporate events.',
        action: handleRegisterVenue,
      },
      {
        icon: 'store',
        title: 'Vendors',
        description: 'Offer your services — from catering and photography to decor, entertainment, and more.',
        action: handleRegisterVendor,
      },
      {
        icon: 'event',
        title: 'Service Partners',
        description: 'Reach clients looking for planners, florists, transport, and other essential event services.',
        action: handleRegisterVendor,
      },
    ];

    return (
      <View style={{ flexDirection: 'row', gap: 24, flexWrap: 'wrap', justifyContent: 'center' } as any}>
        {cards.map((card, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.9}
            onPress={card.action}
            style={{
              flex: 1,
              minWidth: 300,
              maxWidth: 360,
              backgroundColor: colors.surfaceContainerLowest,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.outlineVariant,
              padding: spacing.xl,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.lg,
              }}
            >
              <MaterialIcons name={card.icon as any} size={28} color={colors.primary} />
            </View>
            <Text style={{ ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.sm }}>
              {card.title}
            </Text>
            <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 24 }}>
              {card.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReviewCard = (review: Review) => (
    <View
      key={review.id}
      style={{
        flex: 1,
        minWidth: 300,
        maxWidth: 360,
        backgroundColor: colors.surfaceContainerLowest,
        padding: spacing.xl,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
        <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>{review.name}</Text>
        <View style={{ flexDirection: 'row', gap: 2 } as any}>{renderStars(review.rating)}</View>
      </View>
      <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 24 }}>
        {review.comment}
      </Text>
    </View>
  );

  const renderBlogGrid = () => (
    <View style={{ flexDirection: 'row', gap: 24, flexWrap: 'wrap', justifyContent: 'center' } as any}>
      {blogPosts && blogPosts.slice(0, 6).map((post) => (
        <TouchableOpacity
          key={post.id}
          activeOpacity={0.9}
          style={{
            flex: 1,
            minWidth: 300,
            maxWidth: 360,
          }}
          onPress={() => navigation.navigate('BlogDetail', { slug: post.slug })}
        >
          <View
            style={{
              backgroundColor: colors.surfaceContainerLowest,
              borderRadius: radii.lg,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.outlineVariant,
              height: 360,
            }}
          >
            {post.cover_image_url ? (
              <Image source={{ uri: post.cover_image_url }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
            ) : (
              <View style={{ width: '100%', height: 160, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="article" size={40} color={colors.primary} />
              </View>
            )}
            <View style={{ flex: 1, padding: spacing.lg, justifyContent: 'space-between' }}>
              <View>
                <View style={{ backgroundColor: colors.accent, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.sm, alignSelf: 'flex-start', marginBottom: spacing.sm }}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold' }}>{post.category}</Text>
                </View>
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs, fontSize: 15 }} numberOfLines={2}>{post.title}</Text>
                <Text style={{ ...typography.body, color: colors.onSurfaceVariant }} numberOfLines={2}>{post.excerpt}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="schedule" size={14} color={colors.textMuted} />
                <Text style={{ ...typography.caption, color: colors.textMuted, marginLeft: spacing.xs, fontSize: 12 }}>{post.read_time_minutes} min read</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const desktopContent = (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceBg }} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      {/* Hero Section */}
      <View style={{ paddingHorizontal: 48, paddingTop: spacing.xxl, paddingBottom: spacing.xxl }}>
        <View style={{ maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 48, alignItems: 'center' } as any}>
            {/* Left: Value proposition */}
            <View style={{ flex: 1, gap: spacing.lg } as any}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md } as any}>
                <MaterialIcons name="star" size={18} color={colors.gold} />
                <Text style={{ ...typography.labelMd, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.05 }}>
                  Trusted by South Africa's top event listers
                </Text>
              </View>
              <Text style={{ ...typography.headlineMd, color: colors.textPrimary, fontWeight: '700' }}>
                Grow your event business with Funxon
              </Text>
              <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 28, maxWidth: 560 }}>
                List your venue or vendor services on South Africa's premier event planning platform and connect with thousands of hosts planning weddings, corporate events, parties, and celebrations.
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.xl, marginTop: spacing.md } as any}>
                <View>
                  <Text style={{ ...typography.headlineMd, color: colors.primary }}>1000+</Text>
                  <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>Active hosts</Text>
                </View>
                <View>
                  <Text style={{ ...typography.headlineMd, color: colors.primary }}>500+</Text>
                  <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>Listed venues</Text>
                </View>
                <View>
                  <Text style={{ ...typography.headlineMd, color: colors.primary }}>300+</Text>
                  <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>Vendors</Text>
                </View>
              </View>
            </View>

            {/* Right: CTA card */}
            <View style={{ width: 480, flexShrink: 0 } as any}>
              {renderHeroCard()}
            </View>
          </View>
        </View>
      </View>

      {/* Lister Types Grid */}
      <View style={{ paddingHorizontal: 48, marginBottom: spacing.xxl }}>
        <View style={{ maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <Text style={{ ...typography.headlineMd, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm }}>
              Who can list on Funxon?
            </Text>
            <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', maxWidth: 600 }}>
              Partner with us and showcase your offering to the right audience.
            </Text>
          </View>
          {renderListerTypeCards()}
        </View>
      </View>

      {/* About Section */}
      <View style={{ paddingHorizontal: 48, marginBottom: spacing.xxl }}>
        <View style={{ maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
          <View style={{ backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.outlineVariant, padding: spacing.xxl } as any}>
            <Text style={{ ...typography.labelMd, color: colors.primary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.05 }}>
              About Funxon
            </Text>
            <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 28, marginBottom: spacing.md }}>
              Funxon is South Africa's premier event planning platform, connecting hosts with the best venues, vendors, and services for every occasion. Whether you're planning a wedding, corporate event, birthday party, or any celebration, we make it easy to find, compare, and book the perfect professionals for your needs.
            </Text>
            <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 28 }}>
              Our mission is to simplify event planning by bringing together a curated network of trusted listers who are passionate about making your events unforgettable. From stunning venues to talented vendors, Funxon is your trusted partner in creating memorable experiences.
            </Text>
          </View>
        </View>
      </View>

      {/* Reviews Section */}
      <View style={{ paddingHorizontal: 48, marginBottom: spacing.xxl }}>
        <View style={{ maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
          <Text style={{ ...typography.headlineMd, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm }}>
            What listers are saying
          </Text>
          <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing.xl, maxWidth: 600, alignSelf: 'center' }}>
            Join thousands of happy hosts and listers who trust Funxon for their event planning needs.
          </Text>
          <View style={{ flexDirection: 'row', gap: 24, flexWrap: 'wrap', justifyContent: 'center' } as any}>
            {REVIEWS.map((review) => renderReviewCard(review))}
          </View>
        </View>
      </View>

      {/* Blog Section */}
      <View style={{ paddingHorizontal: 48, marginBottom: spacing.xxl }}>
        <View style={{ maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl }}>
            <View>
              <Text style={{ ...typography.headlineMd, color: colors.textPrimary }}>Listers Blog</Text>
              <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.xs }}>Tips, guides, and insights for listers</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('BlogList' as never)}>
              <Text style={{ ...typography.bodySemiBold, color: colors.secondaryBlue }}>View all →</Text>
            </TouchableOpacity>
          </View>

          {blogLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
              <MaterialIcons name="hourglass-empty" size={32} color={colors.textMuted} />
              <Text style={{ ...typography.bodyMd, color: colors.textMuted, marginTop: spacing.md }}>Loading blog posts...</Text>
            </View>
          ) : blogPosts && blogPosts.length > 0 ? (
            renderBlogGrid()
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
              <MaterialIcons name="article" size={48} color={colors.textMuted} />
              <Text style={{ ...typography.bodyMd, color: colors.textMuted, marginTop: spacing.md }}>No blog posts available yet.</Text>
              <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.xs }}>Check back soon for lister tips and guides!</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={{ paddingHorizontal: 48, marginBottom: spacing.xxl }}>
        <View style={{ maxWidth: 1200, width: '100%', alignSelf: 'center', backgroundColor: colors.primary, borderRadius: radii.lg, padding: spacing.xxl, alignItems: 'center' } as any}>
          <Text style={{ ...typography.headlineMd, color: '#FFFFFF', textAlign: 'center', marginBottom: spacing.sm }}>
            Ready to grow your event business?
          </Text>
          <Text style={{ ...typography.bodyMd, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: spacing.xl, maxWidth: 600 }}>
            Create your listing today and start connecting with event hosts across South Africa.
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md } as any}>
            <TouchableOpacity
              style={{ backgroundColor: '#FFFFFF', paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radii.lg }}
              onPress={handleRegisterVenue}
              activeOpacity={0.9}
            >
              <Text style={{ ...typography.bodySemiBold, color: colors.primary }}>Register venue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: 'transparent', paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radii.lg, borderWidth: 1, borderColor: '#FFFFFF' }}
              onPress={handleRegisterVendor}
              activeOpacity={0.9}
            >
              <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>Register services</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: spacing.xxl }} />

      {/* Footer */}
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
          buttons={[{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
          onDismiss={() => setAlertState(null)}
        />
      )}
    </ScrollView>
  );

  return (
    <>
      {isDesktop ? (
        desktopContent
      ) : (
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
            <Text style={styles.welcomeTitle}>Welcome to Funxon</Text>
            <Text style={styles.welcomeSubtitle}>
              Your one-stop platform for discovering and listing amazing venues, vendors, and services across South Africa.
            </Text>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ABOUT</Text>
            <Text style={styles.bodyText}>
              Funxon is South Africa's premier event planning platform, connecting hosts with the best venues, vendors, and services for every occasion. Whether you're planning a wedding, corporate event, birthday party, or any celebration, we make it easy to find, compare, and book the perfect professionals for your needs.
            </Text>
            <Text style={[styles.bodyText, styles.bodyTextSpacing]}>
              Our mission is to simplify event planning by bringing together a curated network of trusted listers who are passionate about making your events unforgettable. From stunning venues to talented vendors, Funxon is your trusted partner in creating memorable experiences.
            </Text>
          </View>

          {/* Marketing Hook */}
          <View style={styles.marketingSection}>
            <Text style={styles.marketingText}>
              ✨ Join thousands of happy hosts and listers who trust Funxon for their event planning needs!
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
              buttons={[{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
              onDismiss={() => setAlertState(null)}
            />
          )}
        </ScrollView>
      )}
    </>
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
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ctaButtonTextSecondary: {
    color: colors.surface,
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
