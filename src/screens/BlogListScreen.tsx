import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';

import { fetchHubSpotBlogPosts, type AppBlogPost } from '../lib/hubspotBlog';
import { colors, spacing, radii, typography } from '../theme';
import { useIsDesktop } from '../hooks/useIsDesktop';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';

type BlogPost = AppBlogPost;

type NavigationProp = NativeStackNavigationProp<AttendeeStackParamList>;

const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  return await fetchHubSpotBlogPosts(20);
};

const BlogPostCard = ({ post, isDesktop }: { post: BlogPost; isDesktop?: boolean }) => {
  const navigation = useNavigation<NavigationProp>();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      style={{
        backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
        borderRadius: radii.lg,
        marginBottom: isDesktop ? 0 : spacing.lg,
        overflow: 'hidden',
        borderWidth: isDesktop ? 1 : 0,
        borderColor: isDesktop ? colors.outlineVariant : undefined,
        shadowColor: isDesktop ? undefined : '#000',
        shadowOffset: isDesktop ? undefined : { width: 0, height: 2 },
        shadowOpacity: isDesktop ? undefined : 0.1,
        shadowRadius: isDesktop ? undefined : 4,
        elevation: isDesktop ? undefined : 3,
      }}
      onPress={() => navigation.navigate('BlogDetail', { slug: post.slug })}
      activeOpacity={0.7}
    >
      {post.cover_image_url && (
        <Image
          source={{ uri: post.cover_image_url }}
          style={{
            width: '100%',
            height: isDesktop ? 220 : 180,
            resizeMode: 'cover',
          }}
        />
      )}
      <View style={{ padding: isDesktop ? spacing.xl : spacing.lg }}>
        <View
          style={{
            backgroundColor: colors.accent,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: radii.sm,
            alignSelf: 'flex-start',
            marginBottom: spacing.sm,
          }}
        >
          <Text
            style={{
              color: colors.primary,
              ...(isDesktop ? typography.labelMd : { fontSize: 12, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold' }),
            }}
          >
            {post.category}
          </Text>
        </View>
        <Text
          style={{
            ...(isDesktop ? typography.headlineSm : typography.titleMedium),
            color: colors.textPrimary,
            marginBottom: spacing.sm,
          }}
          numberOfLines={2}
        >
          {post.title}
        </Text>
        <Text
          style={{
            ...(isDesktop ? typography.bodyMd : typography.body),
            color: colors.textSecondary,
            marginBottom: spacing.md,
            lineHeight: isDesktop ? 26 : 20,
          }}
          numberOfLines={isDesktop ? 4 : 3}
        >
          {post.excerpt}
        </Text>
        <View
          style={{
            flexDirection: isDesktop ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isDesktop ? 'flex-start' : 'center',
            gap: isDesktop ? spacing.xs : 0,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="person" size={isDesktop ? 16 : 14} color={colors.textMuted} />
            <Text
              style={{
                ...(isDesktop ? typography.bodyMd : typography.caption),
                color: colors.textMuted,
                marginLeft: spacing.xs,
              }}
            >
              {post.author_name}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="schedule" size={isDesktop ? 16 : 14} color={colors.textMuted} />
            <Text
              style={{
                ...(isDesktop ? typography.bodyMd : typography.caption),
                color: colors.textMuted,
                marginLeft: spacing.xs,
              }}
            >
              {formatDate(post.published_at)} · {post.read_time_minutes} min read
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function BlogListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isDesktop = useIsDesktop();
  const [refreshing, setRefreshing] = useState(false);

  const { data: posts, isLoading, error, refetch } = useQuery({
    queryKey: ['blog-posts', 'hubspot'],
    queryFn: fetchBlogPosts,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const renderHeader = () => (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
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
          Back to Home
        </Text>
      </TouchableOpacity>
      <Text style={{ ...typography.displayLarge, color: colors.textPrimary }}>
        Funxons Blog
      </Text>
      <Text
        style={{
          ...typography.body,
          color: colors.textSecondary,
          marginTop: spacing.xs,
        }}
      >
        Tips, guides, and inspiration for your next event
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.md }}>
          Loading articles...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
        <MaterialIcons name="error-outline" size={48} color={colors.destructive} />
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.md }}>
          Failed to load articles
        </Text>
        <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }}>
          Please check your connection and try again
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            borderRadius: radii.md,
            marginTop: spacing.lg,
          }}
          onPress={() => refetch()}
        >
          <Text style={{ ...typography.bodySemiBold, color: colors.primaryForeground }}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      {isDesktop ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 48,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xxl,
            maxWidth: 1200,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ ...typography.labelMd, color: colors.dustyRose, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.05 }}>
              Latest
            </Text>
            <Text style={{ ...typography.headlineMd, color: colors.textPrimary }}>Funxons Blog</Text>
            <Text style={{ ...typography.bodyMd, color: colors.textSecondary, marginTop: spacing.xs }}>
              Tips, guides, and inspiration for your next event
            </Text>
          </View>
          {posts && posts.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 } as any}>
              {posts.map((post) => (
                <View key={post.id} style={{ width: 'calc(33.3333% - 16px)' } as any}>
                  <BlogPostCard post={post} isDesktop={isDesktop} />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <MaterialIcons name="article" size={48} color={colors.textMuted} />
              <Text style={{ ...typography.titleMedium, color: colors.textSecondary, marginTop: spacing.md }}>
                No articles yet
              </Text>
              <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.sm }}>
                Check back soon for new content!
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BlogPostCard post={item} isDesktop={isDesktop} />}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <MaterialIcons name="article" size={48} color={colors.textMuted} />
              <Text style={{ ...typography.titleMedium, color: colors.textSecondary, marginTop: spacing.md }}>
                No articles yet
              </Text>
              <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.sm }}>
                Check back soon for new content!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
