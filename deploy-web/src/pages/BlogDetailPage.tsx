import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchBlogPostBySlug, fetchAllSlugs, type AppBlogPost } from '../lib/hubspotBlog';
import { BookOpen, Calendar, ChevronLeft, User, ChevronRight } from 'lucide-react';

interface PostRef {
  id: string;
  slug: string;
  title: string;
}

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<AppBlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevPost, setPrevPost] = useState<PostRef | null>(null);
  const [nextPost, setNextPost] = useState<PostRef | null>(null);

  useEffect(() => {
    if (slug) loadPost();
  }, [slug]);

  async function loadPost() {
    setLoading(true);
    setError(null);
    try {
      const [data, slugs] = await Promise.all([
        fetchBlogPostBySlug(slug!),
        fetchAllSlugs(),
      ]);
      setPost(data);

      // Find current post index and set prev/next
      const currentIndex = slugs.findIndex(p => p.slug === slug);
      if (currentIndex > 0) {
        setPrevPost(slugs[currentIndex - 1]);
      }
      if (currentIndex < slugs.length - 1) {
        setNextPost(slugs[currentIndex + 1]);
      }
    } catch (err) {
      console.error('Error loading blog post:', err);
      setError('Unable to load this article. Please check your connection or try again later.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="fx-container py-12">
        <div className="mx-auto max-w-3xl">
          <div className="h-[300px] animate-pulse rounded-xl bg-surface-container" />
          <div className="mt-6 h-8 w-2/3 animate-pulse rounded bg-surface-container" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fx-container py-20 text-center">
        <BookOpen className="mx-auto h-12 w-12 text-on-surface-variant" />
        <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Could not load article</h2>
        <p className="mt-2 text-sm text-on-surface-variant">{error}</p>
        <button
          onClick={loadPost}
          className="mt-4 text-sm font-semibold text-primary hover:underline"
        >
          Try again
        </button>
        <div className="mt-2">
          <Link to="/blog" className="text-sm text-primary hover:underline">Back to blog</Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="fx-container py-20 text-center">
        <BookOpen className="mx-auto h-12 w-12 text-on-surface-variant" />
        <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Post not found</h2>
        <Link to="/blog" className="mt-4 inline-block text-primary hover:underline">Back to blog</Link>
      </div>
    );
  }

  return (
    <div className="fx-container py-6 md:py-10">
      <div className="mx-auto max-w-3xl">
        <Link to="/blog" className="mb-4 inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Back to blog
        </Link>

        {post.cover_image_url && (
          <img src={post.cover_image_url} alt={post.title} className="h-[300px] w-full rounded-xl object-cover md:h-[400px]" />
        )}

        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
            {post.author_name && <span className="flex items-center gap-1"><User className="h-4 w-4" />{post.author_name}</span>}
            {post.published_at && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(post.published_at).toLocaleDateString()}</span>}
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-on-surface md:text-4xl">{post.title}</h1>
          {post.content && (
            <div
              className="prose mt-6 max-w-none text-on-surface-variant"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

          {/* Prev/Next Navigation */}
          {(prevPost || nextPost) && (
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {prevPost && (
                <Link
                  to={`/blog/${prevPost.slug}`}
                  className="flex items-start gap-3 rounded-xl border border-outline-variant bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <ChevronLeft className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-on-surface-variant">Previous</p>
                    <p className="mt-1 font-display text-sm font-semibold text-on-surface line-clamp-2">{prevPost.title}</p>
                  </div>
                </Link>
              )}
              {nextPost && (
                <Link
                  to={`/blog/${nextPost.slug}`}
                  className="flex items-start gap-3 rounded-xl border border-outline-variant bg-white p-4 transition-shadow hover:shadow-md md:text-right"
                >
                  <div className="flex-1">
                    <p className="text-xs font-medium text-on-surface-variant">Next</p>
                    <p className="mt-1 font-display text-sm font-semibold text-on-surface line-clamp-2">{nextPost.title}</p>
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
