/**
 * HubSpot CMS Blog integration
 *
 * Uses Vercel serverless function proxy to avoid CORS issues when calling HubSpot API from browser.
 * The serverless function stores the token server-side.
 * Falls back to Supabase blog_posts table when the proxy is unavailable.
 */

import { supabase } from './supabaseClient';

const getProxyUrl = (): string => {
  // On web, use relative path to the same domain
  if (typeof window !== 'undefined') {
    return '/api/hubspot-blog-proxy';
  }
  // On native, use the deployed Vercel API
  return 'https://funxon-web.vercel.app/api/hubspot-blog-proxy';
};

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

function normalizeSlug(slug: string): string {
  return slug.replace(/^blog\//, '');
}

function mapHubSpotToAppPost(post: HubSpotBlogPost): AppBlogPost {
  return {
    id: post.id,
    title: post.name,
    slug: normalizeSlug(post.slug),
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

export async function fetchHubSpotBlogPosts(limit = 20): Promise<AppBlogPost[]> {
  const proxyUrl = getProxyUrl();

  const response = await fetch(
    `${proxyUrl}?action=list&limit=${limit}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HubSpot API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const posts: HubSpotBlogPost[] = data.results || [];
  return posts.map(mapHubSpotToAppPost);
}

export async function fetchHubSpotBlogPostBySlug(slug: string): Promise<AppBlogPost | null> {
  const proxyUrl = getProxyUrl();

  const response = await fetch(
    `${proxyUrl}?action=slug&slug=${encodeURIComponent(`blog/${slug}`)}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HubSpot API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const post: HubSpotBlogPost | undefined = data.results?.[0];
  if (!post) return null;
  return mapHubSpotToAppPost(post);
}

export async function fetchHubSpotAllSlugs(): Promise<{ id: string; slug: string; title: string }[]> {
  const proxyUrl = getProxyUrl();

  const response = await fetch(
    `${proxyUrl}?action=slugs`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HubSpot API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const posts: HubSpotBlogPost[] = data.results || [];
  return posts.map((p) => ({
    id: p.id,
    slug: normalizeSlug(p.slug),
    title: p.name,
  }));
}

export async function fetchHubSpotRelatedPosts(currentId: string, limit = 2): Promise<AppBlogPost[]> {
  const allPosts = await fetchHubSpotBlogPosts(20);
  return allPosts.filter((p) => p.id !== currentId).slice(0, limit);
}

// ── Supabase fallback ──
// Used when the HubSpot proxy is unavailable (e.g. dev mode without API key).
// Reads from the public.blog_posts table.

interface SupabaseBlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  cover_image_url?: string;
  author_name?: string;
  published_at?: string;
}

function mapSupabaseToAppPost(post: SupabaseBlogPost): AppBlogPost {
  return {
    id: String(post.id),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || '',
    content: post.content || '',
    cover_image_url: post.cover_image_url || null,
    author_name: post.author_name || 'Funxon Team',
    category: 'Blog',
    published_at: post.published_at || '',
    read_time_minutes: Math.max(1, Math.ceil((post.content || '').split(/\s+/).length / 200)),
    tags: [],
  };
}

export async function fetchBlogPosts(limit = 20): Promise<AppBlogPost[]> {
  try {
    return await fetchHubSpotBlogPosts(limit);
  } catch {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, content, cover_image_url, author_name, published_at')
      .order('published_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(mapSupabaseToAppPost);
  }
}

export async function fetchBlogPostBySlug(slug: string): Promise<AppBlogPost | null> {
  try {
    return await fetchHubSpotBlogPostBySlug(slug);
  } catch {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, content, cover_image_url, author_name, published_at')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapSupabaseToAppPost(data);
  }
}

export async function fetchAllSlugs(): Promise<{ id: string; slug: string; title: string }[]> {
  try {
    return await fetchHubSpotAllSlugs();
  } catch {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug')
      .order('published_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((p: any) => ({ id: String(p.id), slug: p.slug, title: p.title }));
  }
}

export async function fetchRelatedPosts(currentId: string, limit = 2): Promise<AppBlogPost[]> {
  try {
    return await fetchHubSpotRelatedPosts(currentId, limit);
  } catch {
    const posts = await fetchBlogPosts(limit + 1);
    return posts.filter((p) => p.id !== currentId).slice(0, limit);
  }
}
