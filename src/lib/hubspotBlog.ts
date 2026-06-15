/**
 * HubSpot CMS Blog integration
 *
 * Auth: Generate a Service Key in HubSpot Settings > Account Defaults > Service Keys
 * (Private App tokens also work, but Service Keys are HubSpot's recommended path.)
 * Required scope for blog read access: content
 */
import { getEnv } from './env';
import { supabase } from './supabaseClient';

const HUBSPOT_API_BASE = 'https://api.hubapi.com/cms/blogs/2026-03/posts';
const HUBSPOT_ACCESS_TOKEN = getEnv('EXPO_PUBLIC_HUBSPOT_ACCESS_TOKEN') || getEnv('HUBSPOT_ACCESS_TOKEN');

export interface HubSpotBlogPost {
  id: string;
  slug: string;
  name: string;
  postSummary: string;
  postBody: string;
  featuredImage: string;
  authorName: string;
  blogAuthorId: string;
  publishDate: string;
  url: string;
  state: string;
  tagIds: number[];
  metaDescription: string;
  categoryId?: number;
}

export interface AppBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  author_name: string;
  category: string;
  published_at: string;
  read_time_minutes: number;
  author_avatar_url?: string | null;
  tags?: string[];
}

function calculateReadTime(htmlContent: string): number {
  const text = htmlContent.replace(/<[^>]+>/g, '').trim();
  const wordCount = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function mapHubSpotToAppPost(post: HubSpotBlogPost): AppBlogPost {
  return {
    id: post.id,
    title: post.name,
    slug: post.slug,
    excerpt: post.postSummary || post.metaDescription || '',
    content: stripHtmlToPlainText(post.postBody),
    cover_image_url: post.featuredImage || null,
    author_name: post.authorName || 'HubSpot Author',
    category: 'Blog',
    published_at: post.publishDate,
    read_time_minutes: calculateReadTime(post.postBody),
    tags: [],
  };
}

function mapSupabaseToAppPost(post: any): AppBlogPost {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || '',
    content: post.content || '',
    cover_image_url: post.cover_image_url || null,
    author_name: post.author_name || 'Funxons Team',
    category: post.category || 'Blog',
    published_at: post.published_at,
    read_time_minutes: post.read_time_minutes || 5,
    author_avatar_url: post.author_avatar_url || null,
    tags: post.tags || [],
  };
}

async function fetchSupabaseBlogPosts(limit = 20): Promise<AppBlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Supabase blog fetch error: ${error.message}`);
  }

  return (data || []).map(mapSupabaseToAppPost);
}

async function fetchSupabaseBlogPostBySlug(slug: string): Promise<AppBlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Supabase blog fetch error: ${error.message}`);
  }

  return data ? mapSupabaseToAppPost(data) : null;
}

async function fetchSupabaseAllSlugs(): Promise<{ id: string; slug: string; title: string }[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error) {
    throw new Error(`Supabase blog fetch error: ${error.message}`);
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
  }));
}

export async function fetchHubSpotBlogPosts(limit = 20): Promise<AppBlogPost[]> {
  if (!HUBSPOT_ACCESS_TOKEN) {
    console.warn('HubSpot access token not configured; falling back to Supabase blog_posts');
    return fetchSupabaseBlogPosts(limit);
  }

  try {
    const response = await fetch(
      `${HUBSPOT_API_BASE}?state__eq=PUBLISHED&limit=${limit}&sort=-publishDate`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const posts: HubSpotBlogPost[] = data.results || [];
    return posts.map(mapHubSpotToAppPost);
  } catch (err) {
    console.warn('HubSpot fetch failed; falling back to Supabase blog_posts:', err);
    return fetchSupabaseBlogPosts(limit);
  }
}

export async function fetchHubSpotBlogPostBySlug(slug: string): Promise<AppBlogPost | null> {
  if (!HUBSPOT_ACCESS_TOKEN) {
    console.warn('HubSpot access token not configured; falling back to Supabase blog_posts');
    return fetchSupabaseBlogPostBySlug(slug);
  }

  try {
    const response = await fetch(
      `${HUBSPOT_API_BASE}?slug__eq=${encodeURIComponent(slug)}&state__eq=PUBLISHED&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const post: HubSpotBlogPost | undefined = data.results?.[0];
    if (!post) return null;
    return mapHubSpotToAppPost(post);
  } catch (err) {
    console.warn('HubSpot fetch failed; falling back to Supabase blog_posts:', err);
    return fetchSupabaseBlogPostBySlug(slug);
  }
}

export async function fetchHubSpotAllSlugs(): Promise<{ id: string; slug: string; title: string }[]> {
  if (!HUBSPOT_ACCESS_TOKEN) {
    console.warn('HubSpot access token not configured; falling back to Supabase blog_posts');
    return fetchSupabaseAllSlugs();
  }

  try {
    const response = await fetch(
      `${HUBSPOT_API_BASE}?state__eq=PUBLISHED&limit=100&sort=-publishDate`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const posts: HubSpotBlogPost[] = data.results || [];
    return posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.name,
    }));
  } catch (err) {
    console.warn('HubSpot fetch failed; falling back to Supabase blog_posts:', err);
    return fetchSupabaseAllSlugs();
  }
}

export async function fetchHubSpotRelatedPosts(currentId: string, limit = 2): Promise<AppBlogPost[]> {
  const allPosts = await fetchHubSpotBlogPosts(20);
  return allPosts.filter((p) => p.id !== currentId).slice(0, limit);
}
