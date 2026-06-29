import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBlogPosts, type AppBlogPost } from '../lib/hubspotBlog';
import { BookOpen, Calendar, ArrowRight } from 'lucide-react';

export default function BlogListPage() {
  const [posts, setPosts] = useState<AppBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBlogPosts();
      setPosts(data || []);
    } catch (err) {
      console.error('Error loading blog posts:', err);
      setError('Unable to load blog posts. Please check your connection or try again later.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">Blog</h1>
        <p className="mt-2 text-on-surface-variant">Tips, trends, and inspiration for your next event</p>

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-red-400" />
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={loadPosts}
              className="mt-3 text-sm font-semibold text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="h-80 animate-pulse rounded-xl bg-surface-container" />)}
          </div>
        ) : !error && posts.length === 0 ? (
          <div className="mt-12 rounded-xl bg-white p-12 text-center shadow-sm border border-outline-variant">
            <BookOpen className="mx-auto h-12 w-12 text-on-surface-variant" />
            <h3 className="mt-4 font-display text-lg font-semibold text-on-surface">No posts yet</h3>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map(post => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm border border-outline-variant transition-shadow hover:shadow-md"
              >
                <div className="aspect-[16/10] overflow-hidden bg-surface-container">
                  {post.cover_image_url ? (
                    <img src={post.cover_image_url} alt={post.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface-container">
                      <BookOpen className="h-8 w-8 text-on-surface-variant" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    {post.published_at && (
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.published_at).toLocaleDateString()}</span>
                    )}
                    {post.author_name && <span>by {post.author_name}</span>}
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold text-on-surface group-hover:text-primary">{post.title}</h3>
                  {post.excerpt && <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant">{post.excerpt}</p>}
                  <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-primary">
                    Read more <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
