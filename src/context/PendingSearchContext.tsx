import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

  // Stable callbacks so consumers don't trigger infinite re-renders
  const savePendingSearch = useCallback((snapshot: PendingSearchSnapshot) => {
    setPendingSearch(snapshot);
    setShouldApplyPendingSearch(true);
    AsyncStorage.multiSet([
      [PENDING_SEARCH_STORAGE_KEY, JSON.stringify(snapshot)],
      [PENDING_SEARCH_SHOULD_APPLY_KEY, 'true'],
    ]).catch(() => undefined);
  }, []);

  const clearPendingSearch = useCallback(() => {
    setPendingSearch(null);
    setShouldApplyPendingSearch(false);
    AsyncStorage.multiRemove([PENDING_SEARCH_STORAGE_KEY, PENDING_SEARCH_SHOULD_APPLY_KEY]).catch(() => undefined);
  }, []);

  const markPendingSearchConsumed = useCallback(() => {
    setShouldApplyPendingSearch(false);
    AsyncStorage.setItem(PENDING_SEARCH_SHOULD_APPLY_KEY, 'false').catch(() => undefined);
  }, []);

  const value = useMemo<PendingSearchContextValue>(
    () => ({
      pendingSearch,
      shouldApplyPendingSearch,
      savePendingSearch,
      clearPendingSearch,
      markPendingSearchConsumed,
    }),
    [pendingSearch, shouldApplyPendingSearch, savePendingSearch, clearPendingSearch, markPendingSearchConsumed],
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
