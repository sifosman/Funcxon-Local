import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHubSpotBlogPosts } from '../lib/hubspotBlog';
import { BookOpen, Calendar, ArrowRight } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt?: string;
  featuredImage?: string;
  publishDate?: string;
  author?: string;
  url?: string;
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const data = await fetchHubSpotBlogPosts();
      setPosts(data || []);
    } catch (err) {
      console.error('Error loading blog posts:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">Blog</h1>
        <p className="mt-2 text-on-surface-variant">Tips, trends, and inspiration for your next event</p>

        {loading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="h-80 animate-pulse rounded-xl bg-surface-container" />)}
          </div>
        ) : posts.length === 0 ? (
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
                  {post.featuredImage ? (
                    <img src={post.featuredImage} alt={post.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface-container">
                      <BookOpen className="h-8 w-8 text-on-surface-variant" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    {post.publishDate && (
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.publishDate).toLocaleDateString()}</span>
                    )}
                    {post.author && <span>by {post.author}</span>}
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
