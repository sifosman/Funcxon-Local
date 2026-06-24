import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchHubSpotBlogPostBySlug } from '../lib/hubspotBlog';
import { BookOpen, Calendar, ChevronLeft, User } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  content?: string;
  featuredImage?: string;
  publishDate?: string;
  author?: string;
}

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadPost();
  }, [id]);

  async function loadPost() {
    setLoading(true);
    try {
      const data = await fetchHubSpotBlogPostBySlug(id!);
      setPost(data);
    } catch (err) {
      console.error('Error loading blog post:', err);
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

        {post.featuredImage && (
          <img src={post.featuredImage} alt={post.title} className="h-[300px] w-full rounded-xl object-cover md:h-[400px]" />
        )}

        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
            {post.author && <span className="flex items-center gap-1"><User className="h-4 w-4" />{post.author}</span>}
            {post.publishDate && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(post.publishDate).toLocaleDateString()}</span>}
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-on-surface md:text-4xl">{post.title}</h1>
          {post.content && (
            <div
              className="prose mt-6 max-w-none text-on-surface-variant"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
