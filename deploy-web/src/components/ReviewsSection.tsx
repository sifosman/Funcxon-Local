import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { StarRating, StarRatingLegend } from './StarRating';
import { Star, ChevronRight } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  created_at?: string;
  user_name?: string;
  user_email?: string;
  is_verified?: boolean;
}

interface ReviewsSectionProps {
  type: 'venue' | 'vendor';
  targetId: string;
  tableName: string;
  idColumn: string;
}

export function ReviewsSection({ type, targetId, tableName, idColumn }: ReviewsSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 5;

  useEffect(() => {
    if (targetId) fetchReviews(0);
  }, [targetId]);

  async function fetchReviews(pageNum: number) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select(`
          id, rating, comment, created_at,
          user:users(name, email)
        `)
        .eq(idColumn, targetId)
        .order('created_at', { ascending: false })
        .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1);

      if (error) throw error;

      const mapped = (data || []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        user_name: r.user?.name || r.user?.email?.split('@')[0] || 'Anonymous',
        user_email: r.user?.email,
      }));

      if (pageNum === 0) {
        setReviews(mapped);
      } else {
        setReviews(prev => [...prev, ...mapped]);
      }
      setHasMore(mapped.length === pageSize);
      setPage(pageNum);

      // Fetch average rating
      const { data: avgData } = await supabase
        .from(tableName)
        .select('rating')
        .eq(idColumn, targetId);

      if (avgData && avgData.length > 0) {
        const avg = avgData.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / avgData.length;
        setAvgRating(avg);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-primary">Reviews</h2>
        {user && (
          <Link
            to={`/create-review?type=${type}&id=${targetId}`}
            className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-bold transition-colors hover:bg-surface-container"
            style={{ borderColor: '#123f5c', color: '#123f5c' }}
          >
            <Star className="mr-1.5 h-4 w-4" /> Write a Review
          </Link>
        )}
      </div>

      {/* Rating Summary */}
      {avgRating !== null && reviews.length > 0 && (
        <div className="flex items-center gap-4 rounded-xl border bg-white p-5" style={{ borderColor: '#f7f5f0' }}>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{avgRating.toFixed(1)}</p>
            <StarRating rating={avgRating} size="sm" />
            <p className="mt-1 text-xs text-on-surface-variant">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
          </div>
          <div className="h-12 w-px bg-border-subtle" />
          <p className="text-sm text-on-surface-variant">
            Based on verified Funxon users who have interacted with this {type}.
          </p>
        </div>
      )}

      {/* Reviews List */}
      {loading && page === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-container" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center" style={{ borderColor: '#f7f5f0' }}>
          <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-40">rate_review</span>
          <p className="mt-3 text-sm font-medium text-on-surface">No reviews yet</p>
          <p className="mt-1 text-xs text-on-surface-variant">Be the first to share your experience!</p>
          {user && (
            <Link
              to={`/create-review?type=${type}&id=${targetId}`}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-bold text-white"
              style={{ background: '#123f5c' }}
            >
              Write a Review
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="rounded-xl border bg-white p-5" style={{ borderColor: '#f7f5f0' }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ background: '#123f5c' }}>
                    <span className="text-sm font-bold">{(review.user_name || 'A')[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-on-surface">{review.user_name}</p>
                      {review.is_verified && (
                        <span className="flex items-center gap-0.5 rounded-full bg-success-container px-1.5 py-0.5 text-[10px] font-medium text-success">
                          <span className="material-symbols-outlined text-[10px]">verified</span> Verified
                        </span>
                      )}
                    </div>
                    {review.created_at && (
                      <p className="text-xs text-on-surface-variant">{new Date(review.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    )}
                  </div>
                </div>
                <StarRating rating={review.rating} size="sm" />
              </div>
              {review.comment && (
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{review.comment}</p>
              )}
            </div>
          ))}

          {hasMore && (
            <button
              onClick={() => fetchReviews(page + 1)}
              className="flex w-full items-center justify-center gap-1 rounded-xl border border-border-subtle bg-white py-3 text-sm font-medium text-primary hover:bg-surface-container transition-colors"
            >
              Load More Reviews <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Ratings Legend */}
      <StarRatingLegend />
    </div>
  );
}
