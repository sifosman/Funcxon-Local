import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { Star, Send, ChevronLeft } from 'lucide-react';

export default function CreateReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return;
    try {
      await supabase.from('reviews').insert({
        user_id: user.id,
        venue_id: id,
        rating,
        comment,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting review:', err);
    }
  };

  if (submitted) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm border border-outline-variant">
          <h2 className="font-display text-2xl font-bold text-on-surface">Thank you!</h2>
          <p className="mt-4 text-on-surface-variant">Your review has been submitted.</p>
          <Link to={`/venue/${id}`} className="mt-6 inline-block text-primary hover:underline">Back to venue</Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="text-center">
          <Star className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Sign in to leave a review</h2>
          <Link to="/signin" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <Link to={`/venue/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <div className="rounded-xl bg-white p-8 shadow-sm border border-outline-variant">
          <h1 className="font-display text-2xl font-bold text-on-surface">Write a Review</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1"
                  >
                    <Star className={`h-8 w-8 ${star <= (hoverRating || rating) ? 'fill-current text-warning' : 'text-on-surface-variant'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Comment</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="fx-input min-h-[120px]"
                placeholder="Share your experience..."
                required
              />
            </div>
            <button type="submit" disabled={rating === 0} className="fx-btn-primary w-full disabled:opacity-50">
              <Send className="mr-2 h-4 w-4" /> Submit Review
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
