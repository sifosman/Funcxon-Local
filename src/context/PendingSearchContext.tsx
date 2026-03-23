import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PendingSearchSnapshot = {
  search: string;
  serviceType: 'Venues' | 'Vendors' | 'Service Providers' | 'All';
  selectedCategoryIds: number[];
  selectedVenueTypes: string[];
  selectedSubcategories: string[];
  selectedVenueAmenities: string[];
  selectedProvinces: string[];
  selectedCities: string[];
  citySearchQuery: string;
  distanceKm: string;
  selectedCapacity: {
    id: number;
    type: 'event_type' | 'province' | 'capacity_band';
    code: string;
    label: string;
    sort_order: number | null;
  } | null;
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

export function PendingSearchProvider({ children }: { children: React.ReactNode }) {
  const [pendingSearch, setPendingSearch] = useState<PendingSearchSnapshot | null>(null);
  const [shouldApplyPendingSearch, setShouldApplyPendingSearch] = useState(false);

  useEffect(() => {
    const hydratePendingSearch = async () => {
      try {
        const [storedSearch, storedShouldApply] = await Promise.all([
          AsyncStorage.getItem(PENDING_SEARCH_STORAGE_KEY),
          AsyncStorage.getItem(PENDING_SEARCH_SHOULD_APPLY_KEY),
        ]);

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
        AsyncStorage.multiSet([
          [PENDING_SEARCH_STORAGE_KEY, JSON.stringify(snapshot)],
          [PENDING_SEARCH_SHOULD_APPLY_KEY, 'true'],
        ]).catch(() => undefined);
      },
      clearPendingSearch: () => {
        setPendingSearch(null);
        setShouldApplyPendingSearch(false);
        AsyncStorage.multiRemove([PENDING_SEARCH_STORAGE_KEY, PENDING_SEARCH_SHOULD_APPLY_KEY]).catch(() => undefined);
      },
      markPendingSearchConsumed: () => {
        setShouldApplyPendingSearch(false);
        AsyncStorage.setItem(PENDING_SEARCH_SHOULD_APPLY_KEY, 'false').catch(() => undefined);
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
