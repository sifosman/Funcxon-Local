// WEB ONLY — deploy-web/src/context/PendingSearchContext.tsx
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type PendingSearchSnapshot = {
  search: string;
  serviceType: 'Venues' | 'Vendors' | 'Service Providers' | 'All';
  selectedCategoryIds: number[];
  selectedVenueTypes: string[];
  selectedSubcategories: string[];
  selectedVenueAmenities: string[];
  selectedProvinces: string[];
  selectedCities: string[];
  categorySearchQuery: string;
  citySearchQuery: string;
  venueAmenitiesQuery: string;
  distanceKm: string;
  selectedCapacity: {
    id: number;
    type: 'event_type' | 'province' | 'capacity_band';
    code: string;
    label: string;
    sort_order: number | null;
  } | null;
  singleDayEvent: boolean;
  fromDate: string | null;
  toDate: string | null;
  detectedProvinceLabel: string | null;
  locationCity: string | null;
  locationRegion: string | null;
  sortBy: 'name' | 'rating' | 'price' | 'distance';
  sortOrder: 'asc' | 'desc';
  mapCenter: { latitude: number; longitude: number } | null;
  mapRadius: number;
};

type PendingSearchContextValue = {
  pendingSearch: PendingSearchSnapshot | null;
  shouldApplyPendingSearch: boolean;
  savePendingSearch: (snapshot: PendingSearchSnapshot) => void;
  clearPendingSearch: () => void;
  markPendingSearchConsumed: () => void;
};

const PendingSearchContext = createContext<PendingSearchContextValue | undefined>(undefined);
const PENDING_SEARCH_STORAGE_KEY = 'funcxon.pendingSearch';
const PENDING_SEARCH_SHOULD_APPLY_KEY = 'funcxon.pendingSearch.shouldApply';

export function PendingSearchProvider({ children }: { children: ReactNode }) {
  const [pendingSearch, setPendingSearch] = useState<PendingSearchSnapshot | null>(null);
  const [shouldApplyPendingSearch, setShouldApplyPendingSearch] = useState(false);

  useEffect(() => {
    const hydratePendingSearch = () => {
      try {
        const storedSearch = localStorage.getItem(PENDING_SEARCH_STORAGE_KEY);
        const storedShouldApply = localStorage.getItem(PENDING_SEARCH_SHOULD_APPLY_KEY);

        if (storedSearch) {
          setPendingSearch(JSON.parse(storedSearch) as PendingSearchSnapshot);
        }

        if (storedShouldApply) {
          setShouldApplyPendingSearch(storedShouldApply === 'true');
        }
      } catch {
        setPendingSearch(null);
        setShouldApplyPendingSearch(false);
      }
    };

    hydratePendingSearch();
  }, []);

  const value = useMemo<PendingSearchContextValue>(
    () => ({
      pendingSearch,
      shouldApplyPendingSearch,
      savePendingSearch: (snapshot) => {
        setPendingSearch(snapshot);
        setShouldApplyPendingSearch(true);
        try {
          localStorage.setItem(PENDING_SEARCH_STORAGE_KEY, JSON.stringify(snapshot));
          localStorage.setItem(PENDING_SEARCH_SHOULD_APPLY_KEY, 'true');
        } catch {
          // ignore storage errors
        }
      },
      clearPendingSearch: () => {
        setPendingSearch(null);
        setShouldApplyPendingSearch(false);
        try {
          localStorage.removeItem(PENDING_SEARCH_STORAGE_KEY);
          localStorage.removeItem(PENDING_SEARCH_SHOULD_APPLY_KEY);
        } catch {
          // ignore storage errors
        }
      },
      markPendingSearchConsumed: () => {
        setShouldApplyPendingSearch(false);
        try {
          localStorage.setItem(PENDING_SEARCH_SHOULD_APPLY_KEY, 'false');
        } catch {
          // ignore storage errors
        }
      },
    }),
    [pendingSearch, shouldApplyPendingSearch],
  );

  return <PendingSearchContext.Provider value={value}>{children}</PendingSearchContext.Provider>;
}

export function usePendingSearch() {
  const context = useContext(PendingSearchContext);
  if (!context) {
    throw new Error('usePendingSearch must be used within PendingSearchProvider');
  }
  return context;
}
