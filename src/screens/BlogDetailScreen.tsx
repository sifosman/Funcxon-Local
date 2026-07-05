import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';

import { fetchHubSpotBlogPostBySlug, fetchHubSpotRelatedPosts, fetchHubSpotAllSlugs, type AppBlogPost } from '../lib/hubspotBlog';
import { colors, spacing, radii, typography } from '../theme';
import { useIsDesktop } from '../hooks/useIsDesktop';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';

type BlogDetailRouteProp = RouteProp<AttendeeStackParamList, 'BlogDetail'>;
type NavigationProp = NativeStackNavigationProp<AttendeeStackParamList>;

type BlogPost = AppBlogPost;

const fetchBlogPostBySlug = async (slug: string): Promise<BlogPost> => {
  const post = await fetchHubSpotBlogPostBySlug(slug);
  if (!post) {
    throw new Error('Blog post not found');
  }
  return post;
};

const fetchRelatedPosts = async (currentId: string): Promise<BlogPost[]> => {
  return await fetchHubSpotRelatedPosts(currentId, 2);
};

const fetchAllPublishedSlugs = async (): Promise<{ id: string; slug: string; title: string }[]> => {
  return await fetchHubSpotAllSlugs();
};

export default function BlogDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BlogDetailRouteProp>();
  const isDesktop = useIsDesktop();
  const { slug } = route.params;

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => fetchBlogPostBySlug(slug),
  });

  const { data: relatedPosts } = useQuery({
    queryKey: ['related-posts', post?.id],
    queryFn: () => fetchRelatedPosts(post!.id),
    enabled: !!post,
  });

  const { data: allSlugs } = useQuery({
    queryKey: ['all-blog-slugs', 'hubspot'],
    queryFn: fetchAllPublishedSlugs,
  });

  const currentIndex = React.useMemo(() => {
    if (!allSlugs || !post) return -1;
    return allSlugs.findIndex((p) => p.id === post.id);
  }, [allSlugs, post]);

  const prevPost = React.useMemo(() => {
    if (currentIndex <= 0 || !allSlugs) return null;
    return allSlugs[currentIndex - 1];
  }, [currentIndex, allSlugs]);

  const nextPost = React.useMemo(() => {
    if (currentIndex === -1 || currentIndex >= (allSlugs?.length ?? 0) - 1 || !allSlugs) return null;
    return allSlugs[currentIndex + 1];
  }, [currentIndex, allSlugs]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleShare = async () => {
    if (post) {
      try {
        await Share.share({
          message: `Check out this article: ${post.title}\n\n${post.excerpt}`,
          title: post.title,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        elements.push(<View key={index} style={{ height: isDesktop ? spacing.lg : spacing.md }} />);
        return;
      }

      if (trimmedLine.startsWith('## ')) {
        elements.push(
          <Text
            key={index}
            style={{
              ...(isDesktop ? typography.headlineSm : typography.titleLarge),
              color: colors.textPrimary,
              marginTop: spacing.lg,
              marginBottom: spacing.sm,
            }}
          >
            {trimmedLine.replace('## ', '')}
          </Text>
        );
      } else if (trimmedLine.match(/^\d+\.\s/)) {
        elements.push(
          <View key={index} style={{ flexDirection: 'row', marginBottom: spacing.sm }}>
            <Text style={{ ...typography.bodySemiBold, color: colors.primary, marginRight: spacing.sm }}>
              {trimmedLine.split('.')[0]}.
            </Text>
            <Text style={{ ...(isDesktop ? typography.bodyMd : typography.body), color: colors.textPrimary, flex: 1, lineHeight: isDesktop ? 28 : 22 }}>
              {trimmedLine.replace(/^\d+\.\s/, '')}
            </Text>
          </View>
        );
      } else if (trimmedLine.startsWith('- ')) {
        elements.push(
          <View key={index} style={{ flexDirection: 'row', marginBottom: spacing.sm, marginLeft: spacing.lg }}>
            <Text style={{ ...typography.body, color: colors.primary, marginRight: spacing.sm }}>•</Text>
            <Text style={{ ...(isDesktop ? typography.bodyMd : typography.body), color: colors.textPrimary, flex: 1, lineHeight: isDesktop ? 28 : 22 }}>
              {trimmedLine.replace('- ', '')}
            </Text>
          </View>
        );
      } else {
        elements.push(
          <Text
            key={index}
            style={{
              ...(isDesktop ? typography.bodyMd : typography.body),
              color: colors.textPrimary,
              lineHeight: isDesktop ? 28 : 22,
              marginBottom: spacing.sm,
            }}
          >
            {trimmedLine}
          </Text>
        );
      }
    });

    return elements;
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.md }}>
          Loading article...
        </Text>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
        <MaterialIcons name="error-outline" size={48} color={colors.destructive} />
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.md }}>
          Article not found
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            borderRadius: radii.md,
            marginTop: spacing.lg,
          }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ ...typography.bodySemiBold, color: colors.primaryForeground }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderDesktopArticle = () => (
    <View style={{ paddingHorizontal: 48, paddingTop: spacing.sm, paddingBottom: spacing.lg, maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{ ...typography.labelMd, color: colors.dustyRose, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.05 }}>
          {post.category}
        </Text>
        <Text style={{ ...typography.headlineMd, color: colors.textPrimary, marginBottom: spacing.md }}>
          {post.title}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.xl,
            paddingBottom: spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSubtle,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {post.author_avatar_url ? (
              <Image
                source={{ uri: post.author_avatar_url }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  marginRight: spacing.sm,
                }}
              />
            ) : (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.accent,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: spacing.sm,
                }}
              >
                <MaterialIcons name="person" size={24} color={colors.primary} />
              </View>
            )}
            <View>
              <Text style={{ ...typography.bodyMd, color: colors.textPrimary }}>
                {post.author_name}
              </Text>
              <Text style={{ ...typography.labelMd, color: colors.textMuted }}>
                {formatDate(post.published_at)} · {post.read_time_minutes} min read
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleShare} style={{ padding: spacing.sm }}>
            <MaterialIcons name="share" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {post.cover_image_url && (
        <Image
          source={{ uri: post.cover_image_url }}
          style={{
            width: '100%',
            height: 420,
            resizeMode: 'cover',
            borderRadius: radii.lg,
            marginBottom: spacing.xl,
          }}
        />
      )}

      <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
        <View style={{ marginBottom: spacing.xl }}>
          {renderContent(post.content)}
        </View>

        {post.tags && post.tags.length > 0 && (
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{ ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.md }}>
              Tags
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {post.tags.map((tag, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: colors.surfaceContainerLow,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radii.full,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                  }}
                >
                  <Text style={{ ...typography.bodyMd, color: colors.textSecondary }}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {relatedPosts && relatedPosts.length > 0 && (
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{ ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.lg }}>
              Related Articles
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.md } as any}>
              {relatedPosts.map((relatedPost) => (
                <TouchableOpacity
                  key={relatedPost.id}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surfaceContainerLowest,
                    borderRadius: radii.md,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                  }}
                  onPress={() => navigation.push('BlogDetail', { slug: relatedPost.slug })}
                  activeOpacity={0.7}
                >
                  {relatedPost.cover_image_url && (
                    <Image
                      source={{ uri: relatedPost.cover_image_url }}
                      style={{
                        width: '100%',
                        height: 140,
                        resizeMode: 'cover',
                      }}
                    />
                  )}
                  <View style={{ padding: spacing.md }}>
                    <Text
                      style={{
                        ...typography.titleMedium,
                        color: colors.textPrimary,
                        marginBottom: spacing.xs,
                      }}
                      numberOfLines={2}
                    >
                      {relatedPost.title}
                    </Text>
                    <Text style={{ ...typography.bodyMd, color: colors.textMuted }}>
                      {relatedPost.read_time_minutes} min read
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xxl }}>
          {prevPost ? (
            <TouchableOpacity
              style={{
                backgroundColor: colors.surfaceContainerLowest,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
                marginRight: spacing.sm,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
              }}
              onPress={() => navigation.replace('BlogDetail', { slug: prevPost.slug })}
            >
              <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <Text style={{ ...typography.labelMd, color: colors.textMuted }}>Previous</Text>
                <Text style={{ ...typography.bodyMd, color: colors.textPrimary }} numberOfLines={1}>
                  {prevPost.title}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1, marginRight: spacing.sm }} />
          )}

          {nextPost ? (
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
                marginLeft: spacing.sm,
              }}
              onPress={() => navigation.replace('BlogDetail', { slug: nextPost.slug })}
            >
              <View style={{ marginRight: spacing.sm, flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ ...typography.labelMd, color: colors.primaryForeground, opacity: 0.8 }}>Next</Text>
                <Text style={{ ...typography.bodyMd, color: colors.primaryForeground }} numberOfLines={1}>
                  {nextPost.title}
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color={colors.primaryForeground} />
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1, marginLeft: spacing.sm }} />
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {isDesktop ? renderDesktopArticle() : (<>
        {post.cover_image_url && (
          <Image
            source={{ uri: post.cover_image_url }}
            style={{
              width: '100%',
              height: 250,
              resizeMode: 'cover',
            }}
          />
        )}

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
            <Text
              style={{
                ...typography.body,
                color: colors.textPrimary,
                marginLeft: spacing.xs,
              }}
            >
              Back to Blog
            </Text>
          </TouchableOpacity>

          <View
            style={{
              backgroundColor: colors.accent,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: radii.sm,
              alignSelf: 'flex-start',
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: 12,
                fontWeight: '600',
                fontFamily: 'Montserrat_600SemiBold',
              }}
            >
              {post.category}
            </Text>
          </View>

          <Text style={{ ...typography.displayLarge, color: colors.textPrimary, marginBottom: spacing.md }}>
            {post.title}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.xl,
              paddingBottom: spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {post.author_avatar_url ? (
                <Image
                  source={{ uri: post.author_avatar_url }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    marginRight: spacing.sm,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: spacing.sm,
                  }}
                >
                  <MaterialIcons name="person" size={24} color={colors.primary} />
                </View>
              )}
              <View>
                <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>
                  {post.author_name}
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>
                  {formatDate(post.published_at)} · {post.read_time_minutes} min read
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleShare} style={{ padding: spacing.sm }}>
              <MaterialIcons name="share" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: spacing.xl }}>
            {renderContent(post.content)}
          </View>

          {post.tags && post.tags.length > 0 && (
            <View style={{ marginBottom: spacing.xl }}>
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                Tags
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {post.tags.map((tag, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: colors.surfaceMuted,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: radii.full,
                    }}
                  >
                    <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {relatedPosts && relatedPosts.length > 0 && (
            <View style={{ marginBottom: spacing.xl }}>
              <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.lg }}>
                Related Articles
              </Text>
              {relatedPosts.map((relatedPost) => (
                <TouchableOpacity
                  key={relatedPost.id}
                  style={{
                    flexDirection: 'row',
                    backgroundColor: colors.surface,
                    borderRadius: radii.md,
                    marginBottom: spacing.md,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                  onPress={() => navigation.push('BlogDetail', { slug: relatedPost.slug })}
                  activeOpacity={0.7}
                >
                  {relatedPost.cover_image_url && (
                    <Image
                      source={{ uri: relatedPost.cover_image_url }}
                      style={{
                        width: 100,
                        height: 100,
                        resizeMode: 'cover',
                      }}
                    />
                  )}
                  <View style={{ flex: 1, padding: spacing.md }}>
                    <Text
                      style={{
                        ...typography.titleMedium,
                        color: colors.textPrimary,
                        marginBottom: spacing.xs,
                      }}
                      numberOfLines={2}
                    >
                      {relatedPost.title}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>
                      {relatedPost.read_time_minutes} min read
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xxl }}>
            {prevPost ? (
              <TouchableOpacity
                style={{
                  backgroundColor: colors.surface,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderRadius: radii.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  flex: 1,
                  marginRight: spacing.sm,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 2,
                }}
                onPress={() => navigation.replace('BlogDetail', { slug: prevPost.slug })}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>Previous</Text>
                  <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }} numberOfLines={1}>
                    {prevPost.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1, marginRight: spacing.sm }} />
            )}

            {nextPost ? (
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderRadius: radii.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  flex: 1,
                  marginLeft: spacing.sm,
                }}
                onPress={() => navigation.replace('BlogDetail', { slug: nextPost.slug })}
              >
                <View style={{ marginRight: spacing.sm, flex: 1, alignItems: 'flex-end' }}>
                  <Text style={{ ...typography.caption, color: colors.primaryForeground, opacity: 0.8 }}>Next</Text>
                  <Text style={{ ...typography.bodySemiBold, color: colors.primaryForeground }} numberOfLines={1}>
                    {nextPost.title}
                  </Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color={colors.primaryForeground} />
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1, marginLeft: spacing.sm }} />
            )}
          </View>
        </View>
      </>)}
      </ScrollView>
    </View>
  );
}
