import React, { createContext, useContext, useMemo, useState } from 'react';

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

export function PendingSearchProvider({ children }: { children: React.ReactNode }) {
  const [pendingSearch, setPendingSearch] = useState<PendingSearchSnapshot | null>(null);
  const [shouldApplyPendingSearch, setShouldApplyPendingSearch] = useState(false);

  const value = useMemo<PendingSearchContextValue>(
    () => ({
      pendingSearch,
      shouldApplyPendingSearch,
      savePendingSearch: (snapshot) => {
        setPendingSearch(snapshot);
        setShouldApplyPendingSearch(true);
      },
      clearPendingSearch: () => {
        setPendingSearch(null);
        setShouldApplyPendingSearch(false);
      },
      markPendingSearchConsumed: () => {
        setShouldApplyPendingSearch(false);
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
