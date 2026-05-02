import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  author_name: string;
  category: string;
  published_at: string;
  read_time_minutes: number;
};

type NavigationProp = NativeStackNavigationProp<AttendeeStackParamList>;

const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, author_name, category, published_at, read_time_minutes')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching blog posts:', error);
    throw error;
  }

  return data || [];
};

const BlogPostCard = ({ post }: { post: BlogPost }) => {
  const navigation = useNavigation<NavigationProp>();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        marginBottom: spacing.lg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
      onPress={() => navigation.navigate('BlogDetail', { slug: post.slug })}
      activeOpacity={0.7}
    >
      {post.cover_image_url && (
        <Image
          source={{ uri: post.cover_image_url }}
          style={{
            width: '100%',
            height: 180,
            resizeMode: 'cover',
          }}
        />
      )}
      <View style={{ padding: spacing.lg }}>
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
              fontSize: 12,
              fontWeight: '600',
              fontFamily: 'Montserrat_600SemiBold',
            }}
          >
            {post.category}
          </Text>
        </View>
        <Text
          style={{
            ...typography.titleMedium,
            color: colors.textPrimary,
            marginBottom: spacing.sm,
          }}
          numberOfLines={2}
        >
          {post.title}
        </Text>
        <Text
          style={{
            ...typography.body,
            color: colors.textSecondary,
            marginBottom: spacing.md,
            lineHeight: 20,
          }}
          numberOfLines={3}
        >
          {post.excerpt}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="person" size={14} color={colors.textMuted} />
            <Text
              style={{
                ...typography.caption,
                color: colors.textMuted,
                marginLeft: spacing.xs,
              }}
            >
              {post.author_name}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="schedule" size={14} color={colors.textMuted} />
            <Text
              style={{
                ...typography.caption,
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
  const [refreshing, setRefreshing] = useState(false);

  const { data: posts, isLoading, error, refetch } = useQuery({
    queryKey: ['blog-posts'],
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
    <View style={{ padding: spacing.lg, paddingBottom: spacing.md }}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.lg,
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
          <Text style={{ ...typography.body, color: colors.primaryForeground, fontWeight: '600' }}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <BlogPostCard post={item} />}
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
    </View>
  );
}
