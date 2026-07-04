import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function UpdatePortfolioPage() {
  const { user } = useAuth();
  const [type, setType] = useState<'vendor' | 'venue' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detect = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      const { data: vendor } = await supabase.from('vendors').select('id').eq('user_id', user.id).maybeSingle();
      if (vendor) {
        setType('vendor');
        setLoading(false);
        return;
      }
      const { data: venue } = await supabase.from('venue_listings').select('id').eq('user_id', user.id).maybeSingle();
      if (venue) setType('venue');
      setLoading(false);
    };
    detect();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="fx-container py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (type === 'vendor') return <Navigate to="/portfolio/vendor" replace />;
  if (type === 'venue') return <Navigate to="/portfolio/venue" replace />;
  return <Navigate to="/portfolio-type" replace />;
}
