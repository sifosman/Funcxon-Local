/**
 * HubSpot CMS Blog integration
 *
 * Uses Vercel serverless function proxy to avoid CORS issues when calling HubSpot API from browser.
 * The serverless function stores the token server-side.
 */

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
    `${proxyUrl}?action=slug&slug=${encodeURIComponent(slug)}`,
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
    slug: p.slug,
    title: p.name,
  }));
}

export async function fetchHubSpotRelatedPosts(currentId: string, limit = 2): Promise<AppBlogPost[]> {
  const allPosts = await fetchHubSpotBlogPosts(20);
  return allPosts.filter((p) => p.id !== currentId).slice(0, limit);
}
