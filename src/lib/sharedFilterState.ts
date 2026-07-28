export type CategoryFilter = 'all' | 'venues' | 'vendors' | 'services';

export type FilterState = {
  category: CategoryFilter;
  minRating: number | null;
  onlyWithPrice: boolean;
  featuredOnly: boolean;
  selectedVenueTypes: string[];
  selectedVenueAmenities: string[];
  selectedCapacity: string | null;
  selectedProvinces: string[];
  selectedCities: string[];
  selectedVendorCategories: number[];
  selectedVendorSubcategories: string[];
  selectedVendorProvinces: string[];
  selectedVendorCities: string[];
  selectedLocationProvince: string;
};

let _state: FilterState | null = null;

export function getSharedFilterState(): FilterState | null {
  return _state;
}

export function setSharedFilterState(state: FilterState) {
  _state = state;
}

export function clearSharedFilterState() {
  _state = null;
}
