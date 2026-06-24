import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { getFavourites, toggleFavourite } from '../lib/favourites';
import { Heart, MapPin, Trash2 } from 'lucide-react';

type FavouriteItem = {
  id: number;
  type: 'vendor' | 'venue';
  name: string;
  city?: string | null;
  province?: string | null;
  image_url?: string | null;
};

export default function FavouritesPage() {
  const { user } = useAuth();
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavourites = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { vendorIds, venueIds } = await getFavourites(user);
      const items: FavouriteItem[] = [];

      if (vendorIds.length > 0) {
        const { data: vendors, error: vendorError } = await supabase
          .from('vendors')
          .select('id, name, city, province, image_url')
          .in('id', vendorIds);
        if (vendorError) throw vendorError;
        if (vendors) {
          for (const v of vendors) {
            items.push({ id: v.id, type: 'vendor', name: v.name, city: v.city, province: v.province, image_url: v.image_url });
          }
        }
      }

      if (venueIds.length > 0) {
        const { data: venues, error: venueError } = await supabase
          .from('venue_listings')
          .select('id, name, city, province, image_url')
          .in('id', venueIds);
        if (venueError) throw venueError;
        if (venues) {
          for (const v of venues) {
            items.push({ id: v.id, type: 'venue', name: v.name, city: v.city, province: v.province, image_url: v.image_url });
          }
        }
      }

      setFavourites(items);
    } catch (err) {
      console.error('Error fetching favourites:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavourites();
  }, [fetchFavourites]);

  async function removeFavourite(id: number, type: 'vendor' | 'venue') {
    if (!user) return;
    try {
      await toggleFavourite(user, id, type);
      setFavourites(prev => prev.filter(f => !(f.id === id && f.type === type)));
    } catch (err) {
      console.error('Error removing favourite:', err);
    }
  }

  if (!user) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="text-center">
          <Heart className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Sign in to view favourites</h2>
          <Link to="/signin" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">My Favourites</h1>

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="h-64 animate-pulse rounded-xl bg-surface-container" />)}
          </div>
        ) : favourites.length === 0 ? (
          <div className="mt-12 rounded-xl bg-white p-12 text-center shadow-sm border border-outline-variant">
            <Heart className="mx-auto h-12 w-12 text-on-surface-variant" />
            <h3 className="mt-4 font-display text-lg font-semibold text-on-surface">No favourites yet</h3>
            <p className="mt-2 text-on-surface-variant">Save venues and vendors you love to find them quickly.</p>
            <Link to="/discover" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Browse</Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {favourites.map(fav => (
                <div key={`${fav.type}-${fav.id}`} className="fx-card group relative overflow-hidden">
                  <Link to={`/${fav.type}/${fav.id}`}>
                    <div className="aspect-[4/3] overflow-hidden bg-surface-container">
                      {fav.image_url ? (
                        <img src={fav.image_url} alt={fav.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface-container">
                          <MapPin className="h-8 w-8 text-on-surface-variant" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="truncate font-display text-base font-semibold text-on-surface">{fav.name}</h3>
                      <div className="mt-1 flex items-center gap-1 text-xs text-on-surface-variant">
                        <MapPin className="h-3 w-3" />
                        <span>{fav.city || fav.province || 'South Africa'}</span>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => removeFavourite(fav.id, fav.type)}
                    className="absolute right-2 top-2 rounded-full bg-white/80 p-1.5 text-on-surface-variant hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
