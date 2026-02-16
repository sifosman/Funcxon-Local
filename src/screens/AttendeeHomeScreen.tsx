import { useEffect, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabaseClient';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { colors, spacing, radii, typography } from '../theme';
import { OutlineButton, PrimaryButton, ThemedInput } from '../components/ui';
import * as Location from 'expo-location';
import { getFavourites, toggleFavourite } from '../lib/favourites';
import { useAuth } from '../auth/AuthContext';
import { provinces, getCitiesByProvince } from '../config/locations';
import { amenitiesList } from '../config/venueTypes';
import MapRadiusSelector from '../components/MapRadiusSelector';

export type VendorListItem = {
  id: number;
  name: string | null;
  price_range: string | null;
  rating: number | null;
  review_count: number | null;
  image_url: string | null;
  description?: string | null;
  province?: string | null;
  city?: string | null;
  location?: string | null;
  category_id?: number | null;
  venue_type?: string | null;
  amenities?: string[] | null;
  service_options?: string[] | null;
  vendor_tags?: string[] | null;
  capacity?: number | null;
  features?: Record<string, any> | null;
  type: 'vendor' | 'venue'; // Discriminator
};

type ServiceType = 'Venues' | 'Vendors' | 'Service Providers' | 'All';

type DropdownOption = {
  id: number;
  type: 'event_type' | 'province' | 'capacity_band';
  code: string;
  label: string;
  sort_order: number | null;
};

type OpenPickerType =
  | 'category'
  | 'subcategory'
  | 'venue_amenities'
  | 'province'
  | 'city'
  | 'capacity_band'
  | 'distance'
  | null;

type CategoryOption = {
  id: number;
  label: string;
  subcategories: string[];
};

const VENDOR_CATEGORIES: CategoryOption[] = [
  {
    id: 1,
    label: 'Audio & Visual',
    subcategories: [
      'Indoor/Outdoor Sound',
      'Indoor & Stage Lighting',
      'Outdoor Lighting',
      ' AV Technician',
      ' Screens & Projectors',
      ' Special Effects',
      ' Live Feeds',
      ' Fireworks / Drone Pyrotechnics',
    ],
  },
  {
    id: 2,
    label: 'Catering - Edibles & Drinkables',
    subcategories: [
      'Cocktails / Mocktails',
      ' Hot Beverages',
      ' Food Chefs / Cooks',
      ' Desserts / Patisserie',
      ' Bakers',
      ' Savoury / Finger Foods',
      'Fruit Carvers',
      'Ice Sculptors',
    ],
  },
  {
    id: 3,
    label: 'Catering - Table Wear',
    subcategories: ['Cutlery', ' Crockery', ' Centre Pieces', ' Food Warmers', ' Urns', 'Table Cloths', 'Chair Covers'],
  },
  { id: 4, label: 'Waste Management', subcategories: ['Waste Removal', 'Recycling'] },
  {
    id: 5,
    label: 'Decor & Venue Styling ',
    subcategories: [
      'Interior Decorators',
      'Linen & Draping',
      'Florists',
      'Stage Stylists',
      'Carpets',
      'Backdrops',
      'Food Station Stylists',
    ],
  },
  {
    id: 6,
    label: 'Entertainment - Live Performers & Acts',
    subcategories: [
      'Celebrity Hosts',
      'Clowns',
      'Comedians',
      'Content Creators & Influencers',
      'Dancers',
      'Impersinators',
      'Instrumentalist (Violinist, Pianist)',
      "MC's",
      'Singers & Bands',
      'SPECIALITY ACTS: Acrobats, Fire Eaters, Jugglers, peupperteers, ventroliquists',
    ],
  },
  {
    id: 7,
    label: 'Entertainment Rentals - Rides & Games',
    subcategories: [
      'Craft stations',
      'Putt Putt',
      'Fun Fair Rides',
      'Petting Zoos',
      'Arcade Gaming',
      'VR Experiences',
      'Inflatables',
      'Mechanical Rides & Simulators',
      'Carnival & Interactive Games',
      'Face Painting',
    ],
  },
  {
    id: 8,
    label: 'Equipment Hire',
    subcategories: [
      'Braai stands',
      ' Stoves',
      ' Heaters/Heating',
      'Cooling/Air Conditioning',
      ' Refrigerators & Freezers',
      ' Spotlights',
      ' Electricity / Electrical',
    ],
  },
  { id: 9, label: 'Planners', subcategories: ['Event Planners', 'Concept Development', 'Promoters'] },
  {
    id: 10,
    label: 'Furniture Hire',
    subcategories: [
      'Lounge',
      ' Ottomans & poufs',
      ' Cocktail tables',
      ' Benches & stools',
      ' Bar units',
      ' Shelving displays',
      ' Tables',
      ' Chairs',
      ' Stage',
      ' Podiums',
      ' Dance Floor',
      ' Food Carts',
    ],
  },
  {
    id: 11,
    label: 'Personal Services',
    subcategories: [
      'Hair & Makeup',
      ' Nail Tech',
      ' Henna Artists',
      ' Seamstress',
      ' Styling Assistance',
      ' Outfit steaming & fitting',
    ],
  },
  { id: 12, label: 'Photography & Videography', subcategories: ['Photographer', ' Videographer', ' Drone Operator', ' Live Streaming', ' Social Media '] },
  {
    id: 13,
    label: 'Power & Load-Shedding Solutions',
    subcategories: ['Generators', ' Backup Power Solutions', ' Extension & Distribution Equipment'],
  },
  { id: 14, label: 'Props Hire', subcategories: ['Photo Booths', ' Themed décor', ' Backdrop Frames'] },
  {
    id: 15,
    label: 'Signage & Printing',
    subcategories: ['Welcome & Directional Signage', ' Seating Charts & Table Numbers', ' Branding & Banners', 'Invitations', 'Embossing'],
  },
  { id: 16, label: 'Stages & Rigging', subcategories: ['Stage Builds', ' Trussing & Rigging', ' Podiums & Platforms', 'Stage Balustrade'] },
  {
    id: 17,
    label: 'Staffing Professional & General',
    subcategories: [
      ' Security & Body Guards',
      ' Valet',
      ' Waiterers',
      ' General Workers',
      ' Cleaning Crews',
      ' Bartenders',
      ' Ushers / Hostesses',
      ' Ticketing Staff',
      ' Setup & Breakdown Crew',
      ' Technicians',
    ],
  },
  { id: 18, label: 'Tents & Marquees', subcategories: ['Frame Tents', ' Peg & Pole Marquees', ' Clear Roof / Stretch Tents', ' Gazebos'] },
  {
    id: 19,
    label: 'Transport & Logistics',
    subcategories: ['Shuttle/Passenger Services', ' Equipment Transport', " Vehicle Hire (Luxury/Sports/SUV's)"],
  },
  { id: 20, label: 'Sanitation Facilities', subcategories: ['Portable Toilets', ' Luxury Restrooms'] },
  {
    id: 21,
    label: 'Parcelling & Gifting',
    subcategories: ['Party Packs', ' Bride/Groom gift parcels', ' Thank you bags', ' Promotional Goodie bags'],
  },
  { id: 22, label: 'Ticketing & Access Control', subcategories: ['Onsight Ticketing', ' Access Management'] },
];

const VENUE_TYPES: string[] = [
  'Auditoriums',
  'Ballrooms',
  'Banquet halls',
  'Beach venues',
  'Boutiques',
  'Clubhouses',
  'Conference Centres',
  'Convention/Expo Centres',
  'Fairgrounds/Open Fields',
  'Farms',
  'Gardens',
  'Hotels',
  'Industrial venues',
  'Lodges',
  'Resorts',
  'Restaurants',
  'Rooftops',
  'Sports Courts & Arenas',
  'Theatres',
  'Wine estates',
];

export default function AttendeeHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AttendeeStackParamList>>();
  const scrollViewRef = useRef<ScrollView>(null);
  const featuredVendorsRef = useRef<View>(null);
  const [search, setSearch] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType>('All');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedVenueAmenities, setSelectedVenueAmenities] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [distanceKm, setDistanceKm] = useState<string>('');
  const [selectedCapacity, setSelectedCapacity] = useState<DropdownOption | null>(null);
  const [openPicker, setOpenPicker] = useState<OpenPickerType>(null);
  const [singleDayEvent, setSingleDayEvent] = useState(false);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [activeDatePicker, setActiveDatePicker] = useState<'from' | 'to' | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [detectedProvinceLabel, setDetectedProvinceLabel] = useState<string | null>(null);
  const [locationCity, setLocationCity] = useState<string | null>(null);
  const [locationRegion, setLocationRegion] = useState<string | null>(null);
  const [favouriteIds, setFavouriteIds] = useState<{ vendorIds: number[]; venueIds: number[] }>({
    vendorIds: [],
    venueIds: [],
  });
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'price' | 'distance'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showMapRadiusSelector, setShowMapRadiusSelector] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRadius, setMapRadius] = useState<number>(20);
  const [visibleFeaturedCount, setVisibleFeaturedCount] = useState(6);
  const { user } = useAuth();

  const parseLocationParts = (location?: string | null) => {
    const value = (location ?? '').trim();
    if (!value) {
      return { city: null as string | null, province: null as string | null };
    }

    const parts = value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 1) {
      return { city: parts[0], province: parts[0] };
    }

    return {
      city: parts[0] ?? null,
      province: parts[parts.length - 1] ?? null,
    };
  };

  const availableSubcategories = useMemo(() => {
    if (serviceType === 'Venues') return [] as string[];

    const resolvedCategoryIds = selectedCategoryIds.length
      ? selectedCategoryIds
      : VENDOR_CATEGORIES.map((c) => c.id);

    const subcats = resolvedCategoryIds
      .map((id) => VENDOR_CATEGORIES.find((c) => c.id === id)?.subcategories ?? [])
      .flat();

    return Array.from(new Set(subcats.map((v) => String(v ?? '').trim()).filter(Boolean))).sort();
  }, [selectedCategoryIds, serviceType]);

  useEffect(() => {
    if (serviceType === 'Venues') {
      if (selectedSubcategories.length) setSelectedSubcategories([]);
      return;
    }

    if (availableSubcategories.length === 0) {
      if (selectedSubcategories.length) setSelectedSubcategories([]);
      return;
    }

    setSelectedSubcategories((prev) => prev.filter((s) => availableSubcategories.includes(s)));
  }, [availableSubcategories, selectedSubcategories.length, serviceType]);

  const { data, isLoading, error } = useQuery<VendorListItem[]>({
    queryKey: ['unified-listings'],
    queryFn: async () => {
      // Fetch vendors
      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('id, name, price_range, rating, review_count, image_url, location, description, category_id, service_options, vendor_tags')
        .limit(50);

      if (vendorError) throw vendorError;

      // Fetch venues
      const { data: venues, error: venueError } = await supabase
        .from('venue_listings')
        .select('id, name, rating, review_count, image_url, location, description, venue_type, capacity, amenities, features')
        .limit(50);

      if (venueError) throw venueError;

      const vendorItems: VendorListItem[] = (vendors ?? []).map((v: any) => {
        const parsedLocation = parseLocationParts(v.location);
        return {
          id: v.id,
          name: v.name,
          price_range: v.price_range,
          rating: v.rating,
          review_count: v.review_count,
          image_url: v.image_url,
          description: v.description,
          province: v.province ?? parsedLocation.province,
          city: v.city ?? parsedLocation.city,
          location: v.location,
          category_id: v.category_id,
          service_options: v.service_options ?? null,
          vendor_tags: v.vendor_tags ?? null,
          type: 'vendor',
        };
      });
      
      // Map venues to match VendorListItem structure
      const venueItems: VendorListItem[] = (venues ?? []).map((v: any) => {
        const parsedLocation = parseLocationParts(v.location);
        return {
          id: v.id,
          name: v.name,
          price_range: null, // Venues might not have a simple price range field yet
          rating: v.rating ?? null,
          review_count: 0, // Placeholder
          image_url: v.image_url ?? null,
          description: v.description,
          province: v.province ?? parsedLocation.province,
          city: v.city ?? parsedLocation.city,
          location: v.location,
          category_id: null, // Venues are their own category effectively
          venue_type: v.venue_type ?? null,
          amenities: Array.isArray(v.amenities) ? v.amenities : null,
          capacity: v.capacity ?? null,
          features: v.features ?? null,
          type: 'venue',
        };
      });

      return [...vendorItems, ...venueItems];
    },
  });

  const {
    data: featuredData,
    isLoading: featuredLoading,
    error: featuredError,
  } = useQuery<VendorListItem[]>({
    queryKey: ['featured-listings'],
    queryFn: async () => {
      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('id, name, price_range, rating, review_count, image_url, location, description, category_id, featured_listing')
        .eq('featured_listing', true)
        .limit(20);

      if (vendorError) throw vendorError;

      const { data: venues, error: venueError } = await supabase
        .from('venue_listings')
        .select('id, name, rating, review_count, image_url, location, description, features')
        .limit(20);

      if (venueError) throw venueError;

      const vendorItems: VendorListItem[] = (vendors ?? []).map((v: any) => {
        const parsedLocation = parseLocationParts(v.location);
        return {
          id: v.id,
          name: v.name,
          price_range: v.price_range,
          rating: v.rating,
          review_count: v.review_count,
          image_url: v.image_url,
          description: v.description,
          province: v.province ?? parsedLocation.province,
          city: v.city ?? parsedLocation.city,
          location: v.location,
          category_id: v.category_id,
          type: 'vendor',
        };
      });

      const venueItems: VendorListItem[] = (venues ?? [])
        .filter((v: any) => Boolean(v?.features?.featured))
        .map((v: any) => {
          const parsedLocation = parseLocationParts(v.location);
          return {
            id: v.id,
            name: v.name,
            price_range: null,
            rating: v.rating ?? null,
            review_count: 0,
            image_url: v.image_url ?? null,
            description: v.description,
            province: v.province ?? parsedLocation.province,
            city: v.city ?? parsedLocation.city,
            location: v.location,
            category_id: null,
            capacity: v.capacity ?? null,
            features: v.features ?? null,
            type: 'venue',
          };
        });

      return [...vendorItems, ...venueItems];
    },
  });

  const {
    data: dropdownData,
    isLoading: dropdownLoading,
    error: dropdownError,
  } = useQuery<DropdownOption[]>({
    queryKey: ['dropdown-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dropdown_options')
        .select('id, type, code, label, sort_order')
        .in('type', ['province', 'capacity_band'])
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });

  const provinceOptions = useMemo(
    () => (dropdownData ?? []).filter((option) => option.type === 'province'),
    [dropdownData],
  );

  const capacityOptions = useMemo(
    () => (dropdownData ?? []).filter((option) => option.type === 'capacity_band'),
    [dropdownData],
  );

  // Create a mapping of event types to icons
  const getEventIcon = (eventType: string) => {
    const lowerEvent = eventType.toLowerCase();
    
    // Specific event types with unique icons
    if (lowerEvent.includes('wedding') || lowerEvent.includes('marriage')) return 'favorite';
    if (lowerEvent.includes('engagement')) return 'diamond';
    if (lowerEvent.includes('birthday') || lowerEvent.includes('party')) return 'cake';
    if (lowerEvent.includes('kids') || lowerEvent.includes('children') || lowerEvent.includes('child')) return 'child-care';
    if (lowerEvent.includes('corporate') || lowerEvent.includes('business') || lowerEvent.includes('meeting')) return 'business-center';
    if (lowerEvent.includes('conference') || lowerEvent.includes('seminar') || lowerEvent.includes('workshop')) return 'groups';
    if (lowerEvent.includes('festival') || lowerEvent.includes('concert') || lowerEvent.includes('music')) return 'music-note';
    if (lowerEvent.includes('sports') || lowerEvent.includes('game') || lowerEvent.includes('tournament')) return 'sports-basketball';
    if (lowerEvent.includes('food') || lowerEvent.includes('dining') || lowerEvent.includes('restaurant')) return 'restaurant';
    if (lowerEvent.includes('art') || lowerEvent.includes('exhibition') || lowerEvent.includes('gallery')) return 'palette';
    if (lowerEvent.includes('charity') || lowerEvent.includes('fundraiser') || lowerEvent.includes('donation')) return 'volunteer-activism';
    if (lowerEvent.includes('education') || lowerEvent.includes('training') || lowerEvent.includes('school')) return 'school';
    if (lowerEvent.includes('family') || lowerEvent.includes('reunion')) return 'people';
    if (lowerEvent.includes('outdoor') || lowerEvent.includes('adventure') || lowerEvent.includes('nature')) return 'park';
    if (lowerEvent.includes('beach') || lowerEvent.includes('pool') || lowerEvent.includes('water')) return 'pool';
    if (lowerEvent.includes('holiday') || lowerEvent.includes('christmas') || lowerEvent.includes('xmas')) return 'celebration';
    if (lowerEvent.includes('graduation') || lowerEvent.includes('commencement')) return 'school';
    if (lowerEvent.includes('anniversary')) return 'favorite';
    if (lowerEvent.includes('baby') || lowerEvent.includes('shower')) return 'pregnant-woman';
    if (lowerEvent.includes('retirement')) return 'elderly';
    if (lowerEvent.includes('cultural') || lowerEvent.includes('heritage')) return 'public';
    if (lowerEvent.includes('religious') || lowerEvent.includes('church') || lowerEvent.includes('temple')) return 'church';
    if (lowerEvent.includes('tech') || lowerEvent.includes('technology') || lowerEvent.includes('digital')) return 'devices';
    if (lowerEvent.includes('fashion') || lowerEvent.includes('style') || lowerEvent.includes('clothing')) return 'checkroom';
    if (lowerEvent.includes('health') || lowerEvent.includes('wellness') || lowerEvent.includes('medical')) return 'local-hospital';
    if (lowerEvent.includes('travel') || lowerEvent.includes('vacation') || lowerEvent.includes('trip')) return 'flight';
    if (lowerEvent.includes('movie') || lowerEvent.includes('film') || lowerEvent.includes('cinema')) return 'movie';
    if (lowerEvent.includes('book') || lowerEvent.includes('reading') || lowerEvent.includes('literary')) return 'menu-book';
    if (lowerEvent.includes('gaming') || lowerEvent.includes('video game') || lowerEvent.includes('esports')) return 'sports-esports';
    if (lowerEvent.includes('comedy') || lowerEvent.includes('stand-up') || lowerEvent.includes('laugh')) return 'mood';
    if (lowerEvent.includes('dance') || lowerEvent.includes('ballroom') || lowerEvent.includes('ballet')) return 'nightlife';
    if (lowerEvent.includes('photography') || lowerEvent.includes('photo') || lowerEvent.includes('camera')) return 'photo-camera';
    if (lowerEvent.includes('cooking') || lowerEvent.includes('culinary') || lowerEvent.includes('chef')) return 'restaurant-menu';
    if (lowerEvent.includes('gardening') || lowerEvent.includes('plants') || lowerEvent.includes('garden')) return 'local-florist';
    if (lowerEvent.includes('pet') || lowerEvent.includes('animal') || lowerEvent.includes('dog')) return 'pets';
    if (lowerEvent.includes('science') || lowerEvent.includes('lab') || lowerEvent.includes('research')) return 'science';
    if (lowerEvent.includes('history') || lowerEvent.includes('museum') || lowerEvent.includes('historical')) return 'museum';
    if (lowerEvent.includes('theater') || lowerEvent.includes('drama') || lowerEvent.includes('play')) return 'theater-comedy';
    if (lowerEvent.includes('magic') || lowerEvent.includes('illusion') || lowerEvent.includes('trick')) return 'auto-fix-high';
    
    // Default fallback icons for common patterns
    if (lowerEvent.includes('party')) return 'celebration';
    if (lowerEvent.includes('event')) return 'event';
    if (lowerEvent.includes('gathering')) return 'groups';
    if (lowerEvent.includes('social')) return 'people';
    
    return 'event'; // Ultimate default
  };

  const handleLocationSelected = (location: { latitude: number; longitude: number }, radius: number) => {
    setMapCenter(location);
    setMapRadius(radius);
    // Convert radius to string for display
    setDistanceKm(radius.toString());
  };

  const filteredVendors = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();

    const parseCapacityNumber = (value: string): number | null => {
      const numbers = (value ?? '').match(/\d[\d,]*/g);
      if (!numbers || numbers.length === 0) return null;
      const last = numbers[numbers.length - 1];
      const parsed = parseInt(last.replace(/,/g, ''), 10);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const getSelectedCapacityThreshold = (): number | null => {
      if (!selectedCapacity?.label) return null;
      const parsed = parseCapacityNumber(selectedCapacity.label);
      return parsed;
    };

    const getVenueMaxCapacity = (item: VendorListItem): number | null => {
      const direct = typeof item.capacity === 'number' ? item.capacity : null;
      const fromFeatures = (item.features as any)?.maxHallCapacity;
      if (typeof fromFeatures === 'number' && Number.isFinite(fromFeatures)) return fromFeatures;
      return direct;
    };

    const selectedCapacityThreshold = getSelectedCapacityThreshold();

    const selectedVendorCategorySet = new Set(selectedCategoryIds);
    const selectedVenueTypeSet = new Set(selectedVenueTypes.map((t) => t.toLowerCase()));
    const selectedSubcategorySet = new Set(selectedSubcategories.map((t) => t.toLowerCase()));
    const selectedVenueAmenitySet = new Set(selectedVenueAmenities.map((t) => t.toLowerCase()));

    const matchesAnySelectedSubcategory = (item: VendorListItem): boolean => {
      if (selectedSubcategorySet.size === 0) return true;
      if (item.type !== 'vendor') return true;
      const options = Array.isArray(item.service_options) ? item.service_options : [];
      const tags = Array.isArray(item.vendor_tags) ? item.vendor_tags : [];
      const haystack = [...options, ...tags].map((v) => String(v ?? '').toLowerCase());
      return haystack.some((v) => selectedSubcategorySet.has(v));
    };

    const matchesAnySelectedVenueAmenity = (item: VendorListItem): boolean => {
      if (selectedVenueAmenitySet.size === 0) return true;
      if (item.type !== 'venue') return true;
      const itemAmenities = Array.isArray(item.amenities) ? item.amenities : [];
      const haystack = itemAmenities.map((v) => String(v ?? '').toLowerCase());
      return haystack.some((v) => selectedVenueAmenitySet.has(v));
    };

    return data.filter((item) => {
      const name = (item.name ?? '').toLowerCase();
      const description = (item.description ?? '').toLowerCase();
      const city = (item.city ?? '').toLowerCase();
      const province = (item.province ?? '').toLowerCase();
      const location = (item.location ?? '').toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        description.includes(query) ||
        city.includes(query) ||
        province.includes(query) ||
        location.includes(query);

      let matchesType = true;
      if (serviceType === 'Venues') {
        matchesType = item.type === 'venue';
      } else if (serviceType === 'Vendors' || serviceType === 'Service Providers') {
        matchesType = item.type === 'vendor';
      }

      let matchesCategory = true;
      if (item.type === 'vendor' && selectedVendorCategorySet.size > 0) {
        matchesCategory = typeof item.category_id === 'number' ? selectedVendorCategorySet.has(item.category_id) : false;
      }
      if (item.type === 'venue' && selectedVenueTypeSet.size > 0) {
        const vt = String(item.venue_type ?? '').toLowerCase();
        matchesCategory = vt ? selectedVenueTypeSet.has(vt) : false;
      }

      const itemProvince = (item.province ?? '').toLowerCase();
      const itemCity = (item.city ?? '').toLowerCase();
      
      const matchesProvince = selectedProvinces.length === 0 || 
        selectedProvinces.some(p => itemProvince.includes(p.toLowerCase()));
      
      const matchesCity = selectedCities.length === 0 || 
        selectedCities.some(c => itemCity.includes(c.toLowerCase()));

      let matchesCapacity = true;
      if (selectedCapacityThreshold !== null) {
        if (item.type === 'venue') {
          const cap = getVenueMaxCapacity(item);
          matchesCapacity = cap !== null ? cap >= selectedCapacityThreshold : false;
        }
      }

      const matchesSubcategory = matchesAnySelectedSubcategory(item);
      const matchesAmenity = matchesAnySelectedVenueAmenity(item);

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesSubcategory &&
        matchesAmenity &&
        matchesProvince &&
        matchesCity &&
        matchesCapacity
      );
    });
  }, [
    data,
    search,
    serviceType,
    selectedCategoryIds,
    selectedVenueTypes,
    selectedSubcategories,
    selectedVenueAmenities,
    selectedProvinces,
    selectedCities,
    selectedCapacity,
  ]);

  const orderedVendors = useMemo(() => {
    if (!filteredVendors.length) return [];
    
    let vendors = [...filteredVendors];
    
    // Apply sorting
    vendors.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          const nameA = (a.name ?? '').toLowerCase();
          const nameB = (b.name ?? '').toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
          
        case 'rating':
          const ratingA = a.rating ?? 0;
          const ratingB = b.rating ?? 0;
          comparison = ratingA - ratingB;
          break;
          
        case 'price':
          // Extract numeric values from price range for comparison
          const extractPrice = (priceRange: string | null) => {
            if (!priceRange) return 0;
            const numbers = priceRange.match(/[\d,]+/g);
            if (!numbers || numbers.length === 0) return 0;
            // Use the highest number in the range for comparison
            return parseInt(numbers[numbers.length - 1].replace(/,/g, ''), 10);
          };
          const priceA = extractPrice(a.price_range);
          const priceB = extractPrice(b.price_range);
          comparison = priceA - priceB;
          break;
          
        case 'distance':
          // Priority: same city, then same province, then others
          const cityFilter = (locationCity ?? '').toLowerCase();
          const regionFilter = (locationRegion ?? '').toLowerCase();
          
          const getDistanceScore = (vendor: VendorListItem) => {
            const city = (vendor.city ?? '').toLowerCase();
            const province = (vendor.province ?? '').toLowerCase();
            
            if (cityFilter && city.includes(cityFilter)) return 0;
            if (regionFilter && province.includes(regionFilter)) return 1;
            return 2;
          };
          
          comparison = getDistanceScore(a) - getDistanceScore(b);
          break;
          
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return vendors;
  }, [filteredVendors, sortBy, sortOrder, locationCity, locationRegion]);

  const nearbyVendors = useMemo(() => {
    if (!orderedVendors.length || (!locationCity && !locationRegion)) return [];
    const cityFilter = (locationCity ?? '').toLowerCase();
    const regionFilter = (locationRegion ?? '').toLowerCase();

    return orderedVendors.filter((vendor) => {
      const city = (vendor.city ?? '').toLowerCase();
      const province = (vendor.province ?? '').toLowerCase();
      const matchesCity = cityFilter && city.includes(cityFilter);
      const matchesRegion = regionFilter && province.includes(regionFilter);
      return matchesCity || matchesRegion;
    });
  }, [orderedVendors, locationCity, locationRegion]);

  const featuredListings = orderedVendors.length ? orderedVendors : filteredVendors;
  const initialFeaturedListings = featuredData ?? [];
  const infiniteScrollEnabled = hasSearched && search.trim().length === 0;

  useEffect(() => {
    setVisibleFeaturedCount(6);
  }, [search, serviceType, selectedCategoryIds, selectedVenueTypes, selectedSubcategories, selectedProvinces, selectedCities, selectedCapacity, sortBy, sortOrder]);

  const visibleListings = infiniteScrollEnabled
    ? featuredListings.slice(0, visibleFeaturedCount)
    : featuredListings;

  const displayedListings = hasSearched ? visibleListings : initialFeaturedListings;

  useEffect(() => {
    let isMounted = true;
    if (!user?.id) {
      setFavouriteIds({ vendorIds: [], venueIds: [] });
      return () => {
        isMounted = false;
      };
    }
    getFavourites(user).then((result) => {
      if (isMounted) setFavouriteIds(result);
    });
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleToggleFavourite = async (id: number, type: 'vendor' | 'venue' = 'vendor') => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to save favourites.');
      return;
    }
    const next = await toggleFavourite(user, id, type);
    setFavouriteIds(next); 
  };

  async function handleUseMyLocation() {
    if (!provinceOptions || provinceOptions.length === 0) {
      Alert.alert('Locations not ready', 'Please wait a moment and try again.');
      return;
    }

    try {
      setDetectingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Location permission needed',
          'Enable location access in your settings to find vendors near you.',
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const places = await Location.reverseGeocodeAsync(position.coords);
      const first = places[0];
      const region = (first?.region ?? '').trim();
      const city = (first?.city ?? '').trim();
      const searchText = (region || city).toLowerCase();

      if (!searchText) {
        Alert.alert('Location not found', 'We could not determine your province from your location.');
        return;
      }

      setLocationCity(city || null);
      setLocationRegion(region || null);

      const matchingProvince = provinces.find((p) => {
        const name = p.name.toLowerCase();
        return name.includes(searchText) || searchText.includes(name);
      });

      if (matchingProvince) {
        setSelectedProvinces([matchingProvince.name]);
        setDetectedProvinceLabel(matchingProvince.name);
        if (city) {
          setSelectedCities([city]);
        }
      } else {
        Alert.alert('Province not recognised', 'We could not match your location to a province filter.');
      }
    } catch (err: any) {
      Alert.alert('Location error', err?.message ?? 'Failed to detect your location.');
    } finally {
      setDetectingLocation(false);
    }
  }

  if (isLoading || dropdownLoading || featuredLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  const hasError = error instanceof Error || dropdownError instanceof Error || featuredError instanceof Error;
  const errorMessage =
    (error instanceof Error && error.message) ||
    (dropdownError instanceof Error && dropdownError.message) ||
    (featuredError instanceof Error && featuredError.message) ||
    '';

  if (hasError) {
    return (
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Failed to load vendors.</Text>
        <Text style={{ marginTop: spacing.sm, ...typography.body, color: colors.textMuted }}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
      scrollEventThrottle={16}
      onScroll={(event) => {
        if (!infiniteScrollEnabled) return;
        if (visibleFeaturedCount >= featuredListings.length) return;

        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 240;
        const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
        if (isNearBottom) {
          setVisibleFeaturedCount((prev) => Math.min(featuredListings.length, prev + 6));
        }
      }}
    >
      <View style={{ backgroundColor: colors.primary, paddingBottom: spacing.xl }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
          <Text
            style={{
              ...typography.displayMedium,
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            Connect, Collaborate, Celebrate
          </Text>
          <Text
            style={{
              ...typography.body,
              color: 'rgba(255,255,255,0.9)',
              textAlign: 'center',
              marginTop: spacing.sm,
            }}
          >
            Welcome to Funcxon! Your all in one Event Coordinator. Plan, browse, compare, get quotes, and
            book venues and service professionals in one place.
          </Text>

          <View
            style={{
              marginTop: spacing.lg,
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: '#D1D5DB',
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
              Service type
            </Text>
            <View style={{ flexDirection: 'row', columnGap: spacing.sm }}>
              {(['Venues', 'Vendors', 'All'] as ServiceType[]).map((type) => {
                const selected = serviceType === type;
                const label =
                  type === 'Vendors' ? 'Vendors' : type === 'Venues' ? 'Venue\nPortfolios' : 'All';
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setServiceType(type)}
                    style={{
                      flex: 1,
                      paddingVertical: spacing.sm,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : '#D1D5DB',
                      backgroundColor: selected ? colors.primary : '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        ...typography.caption,
                        fontWeight: '600',
                        textAlign: 'center',
                        color: selected ? '#FFFFFF' : colors.textPrimary,
                      }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                Search by category
              </Text>
              <TouchableOpacity activeOpacity={0.9} onPress={() => setOpenPicker('category')}>
                <View
                  style={{
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: '#FFFFFF',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ ...typography.body, color: colors.textPrimary }}>
                    {(() => {
                      if (serviceType === 'Venues') {
                        return selectedVenueTypes.length ? selectedVenueTypes.join(', ') : 'Search by Category';
                      }
                      if (serviceType === 'Vendors') {
                        const vendorLabels = selectedCategoryIds
                          .map((id) => VENDOR_CATEGORIES.find((c) => c.id === id)?.label)
                          .filter(Boolean)
                          .join(', ');
                        return vendorLabels || 'Search by Category';
                      }
                      const venuePart = selectedVenueTypes.length ? selectedVenueTypes.join(', ') : '';
                      const vendorPart = selectedCategoryIds
                        .map((id) => VENDOR_CATEGORIES.find((c) => c.id === id)?.label)
                        .filter(Boolean)
                        .join(', ');
                      const combined = [venuePart, vendorPart].filter(Boolean).join(' | ');
                      return combined || 'Search by Category';
                    })()}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>▼</Text>
                </View>
              </TouchableOpacity>
            </View>

            {(serviceType === 'Vendors' || serviceType === 'All') && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                  What are you looking for?
                </Text>
                <TouchableOpacity activeOpacity={0.9} onPress={() => setOpenPicker('subcategory')}>
                  <View
                    style={{
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      backgroundColor: '#FFFFFF',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ ...typography.body, color: colors.textPrimary }}>
                      {selectedSubcategories.length ? selectedSubcategories.join(', ') : 'What are you looking for?'}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>▼</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {(serviceType === 'Venues' || serviceType === 'All') && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                  Venue Amenities
                </Text>
                <TouchableOpacity activeOpacity={0.9} onPress={() => setOpenPicker('venue_amenities')}>
                  <View
                    style={{
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      backgroundColor: '#FFFFFF',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ ...typography.body, color: colors.textPrimary }}>
                      {selectedVenueAmenities.length ? selectedVenueAmenities.join(', ') : 'Venue Amenities'}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>▼</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ marginTop: spacing.md }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                Event Capacity
              </Text>
              <TouchableOpacity activeOpacity={0.9} onPress={() => setOpenPicker('capacity_band')}>
                <View
                  style={{
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: '#FFFFFF',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ ...typography.body, color: colors.textPrimary }}>
                    {selectedCapacity?.label || 'Event Capacity'}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>▼</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                Search Area
              </Text>
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => setShowMapRadiusSelector(true)}
                style={{
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: '#FFFFFF',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="map" size={16} color={colors.primary} />
                  <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
                    {mapCenter ? `${mapRadius}km radius` : 'Select search area'}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                Provinces
              </Text>
              <TouchableOpacity activeOpacity={0.9} onPress={() => setOpenPicker('province')}>
                <View
                  style={{
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: '#FFFFFF',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                    {selectedProvinces.length > 0 ? selectedProvinces.join(', ') : 'Select Provinces'}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>▼</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                Cities
              </Text>
              <TouchableOpacity activeOpacity={0.9} onPress={() => setOpenPicker('city')}>
                <View
                  style={{
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: '#FFFFFF',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                    {selectedCities.length > 0 ? selectedCities.join(', ') : 'Select Cities'}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>▼</Text>
                </View>
              </TouchableOpacity>
              {provinceOptions.length > 0 && (
                <View style={{ flexDirection: 'row', marginTop: spacing.xs, gap: spacing.sm }}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleUseMyLocation}
                    style={{
                      alignSelf: 'flex-start',
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: radii.full,
                      backgroundColor: colors.accent,
                    }}
                  >
                    <Text style={{ ...typography.caption, color: colors.textPrimary }}>
                      {detectingLocation
                        ? 'Detecting location...'
                        : detectedProvinceLabel
                        ? `Using ${detectedProvinceLabel}`
                        : 'Use my location'}
                    </Text>
                  </TouchableOpacity>
                  {(selectedProvinces.length > 0 || selectedCities.length > 0) && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => {
                        setSelectedProvinces([]);
                        setSelectedCities([]);
                        setDetectedProvinceLabel(null);
                        setLocationCity(null);
                        setLocationRegion(null);
                      }}
                      style={{
                        alignSelf: 'flex-start',
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                        borderRadius: radii.full,
                        backgroundColor: colors.surfaceMuted,
                        borderWidth: 1,
                        borderColor: colors.borderSubtle,
                      }}
                    >
                      <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                        Remove Location
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', columnGap: spacing.md, justifyContent: 'center' }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton 
                  title="Search" 
                  onPress={() => {
                    if (!user?.id) {
                      navigation.getParent()?.navigate('Auth');
                      return;
                    }
                    setHasSearched(true);
                    // Scroll to featured vendors section
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 800, animated: true });
                    }, 100);
                  }} 
                />
              </View>
              <View style={{ width: 120 }}>
                <OutlineButton
                  title="Clear All"
                  onPress={() => {
                    setSearch('');
                    setServiceType('All');
                    setSelectedCategoryIds([]);
                    setSelectedVenueTypes([]);
                    setSelectedSubcategories([]);
                    setSelectedProvinces([]);
                    setSelectedCities([]);
                    setDistanceKm('');
                    setSelectedCapacity(null);
                    setDetectedProvinceLabel(null);
                    setLocationCity(null);
                    setLocationRegion(null);
                    setSortBy('name');
                    setSortOrder('asc');
                  }}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', columnGap: spacing.sm, marginTop: spacing.md }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: radii.md,
                  paddingVertical: spacing.xs,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
                onPress={() => setShowSortModal(true)}
              >
                <MaterialIcons name="sort" size={16} color={colors.textSecondary} />
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: spacing.xs }}>
                  Sort: {sortBy === 'name' ? 'Name' : sortBy === 'rating' ? 'Rating' : sortBy === 'price' ? 'Price' : 'Distance'} ({sortOrder === 'asc' ? '↑' : '↓'})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {nearbyVendors.length > 0 && (
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <Text
            style={{
              ...typography.displayMedium,
              color: colors.textPrimary,
              marginBottom: spacing.sm,
            }}
          >
            Near you
          </Text>
          {nearbyVendors.map((item) => (
            <TouchableOpacity
              key={`${item.type}-${item.id}`}
              activeOpacity={0.9}
              onPress={() => {
                if (item.type === 'venue') {
                  navigation.navigate('VenueProfile', { venueId: item.id });
                } else {
                  navigation.navigate('VendorProfile', { vendorId: item.id });
                }
              }}
              style={{
                paddingVertical: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSubtle,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: spacing.md }}>
                  <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                    {item.name ?? 'Untitled'}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
                    {[item.city, item.province].filter(Boolean).join(', ') || 'Location not specified'}
                  </Text>
                  {item.type === 'venue' && (
                     <Text style={{ ...typography.caption, color: colors.primaryTeal, marginTop: 4 }}>Venue</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                    handleToggleFavourite(item.id, item.type);
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons
                    name={
                      (item.type === 'vendor' && favouriteIds.vendorIds.includes(item.id)) ||
                      (item.type === 'venue' && favouriteIds.venueIds.includes(item.id))
                        ? 'favorite'
                        : 'favorite-border'
                    }
                    size={18}
                    color={
                      (item.type === 'vendor' && favouriteIds.vendorIds.includes(item.id)) ||
                      (item.type === 'venue' && favouriteIds.venueIds.includes(item.id))
                        ? colors.primaryTeal
                        : colors.textMuted
                    }
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Featured Vendors */}
      <View ref={featuredVendorsRef} style={{ paddingTop: spacing.xl, backgroundColor: colors.surface, marginTop: spacing.xl }}>
        {(selectedCategoryIds.length > 0 || selectedVenueTypes.length > 0 || selectedSubcategories.length > 0) && (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: spacing.sm,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#E0F2F7',
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.full,
                }}
              >
                <MaterialIcons name="filter-list" size={16} color={colors.primary} />
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.primary,
                    marginLeft: spacing.xs,
                    fontWeight: '600',
                  }}
                >
                  Filters applied
                </Text>
              </View>

              {serviceType !== 'Venues' &&
                selectedCategoryIds.map((id) => {
                  const label = VENDOR_CATEGORIES.find((c) => c.id === id)?.label;
                  if (!label) return null;
                  return (
                    <View
                      key={`cat-${id}`}
                      style={{
                        backgroundColor: colors.surfaceMuted,
                        paddingHorizontal: spacing.md,
                        paddingVertical: 6,
                        borderRadius: radii.full,
                      }}
                    >
                      <Text style={{ ...typography.caption, color: colors.textPrimary, fontWeight: '600' }}>{label}</Text>
                    </View>
                  );
                })}

              {serviceType === 'Venues' &&
                selectedVenueTypes.map((vt) => (
                  <View
                    key={`venue-type-${vt}`}
                    style={{
                      backgroundColor: colors.surfaceMuted,
                      paddingHorizontal: spacing.md,
                      paddingVertical: 6,
                      borderRadius: radii.full,
                    }}
                  >
                    <Text style={{ ...typography.caption, color: colors.textPrimary, fontWeight: '600' }}>{vt}</Text>
                  </View>
                ))}

              {selectedSubcategories.map((sub) => (
                <View
                  key={`sub-${sub}`}
                  style={{
                    backgroundColor: colors.surfaceMuted,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 6,
                    borderRadius: radii.full,
                  }}
                >
                  <Text style={{ ...typography.caption, color: colors.textPrimary, fontWeight: '600' }}>{sub}</Text>
                </View>
              ))}

              {selectedVenueAmenities.map((amenity) => (
                <View
                  key={`amenity-${amenity}`}
                  style={{
                    backgroundColor: colors.surfaceMuted,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 6,
                    borderRadius: radii.full,
                  }}
                >
                  <Text style={{ ...typography.caption, color: colors.textPrimary, fontWeight: '600' }}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              ...typography.displayMedium,
              color: colors.textPrimary,
            }}
          >
            Featured
            {'\n'}
            Vendors
          </Text>
        </View>

        {displayedListings.length === 0 ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
            {selectedCategoryIds.length > 0 || selectedVenueTypes.length > 0 || selectedSubcategories.length > 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                <MaterialIcons name="search-off" size={48} color={colors.textMuted} />
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' }}>
                  No listings found for your selected filters
                </Text>
                <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }}>
                  Try selecting a different category or adjust your filters
                </Text>
              </View>
            ) : (
              <Text style={{ ...typography.body, color: colors.textMuted }}>
                No featured services yet. Add vendors or venues in Supabase to see them here.
              </Text>
            )}
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
            {displayedListings.map((item) => (
              <View
                key={`${item.type}-${item.id}`}
                style={{
                  marginBottom: spacing.md,
                }}
              >
                <View
                  style={{
                    borderRadius: radii.xl,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      if (item.type === 'venue') {
                        navigation.navigate('VenueProfile', { venueId: item.id });
                      } else {
                        navigation.navigate('VendorProfile', { vendorId: item.id });
                      }
                    }}
                    style={{ flexDirection: 'row' }}
                  >
                    <View style={{ width: 150, height: 180 }}>
                      {item.image_url ? (
                        <Image
                          source={{ uri: item.image_url }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: colors.surfaceMuted,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ ...typography.caption, color: colors.textMuted }}>No image</Text>
                        </View>
                      )}

                      <View
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          backgroundColor: colors.primaryTeal,
                          paddingHorizontal: spacing.md,
                          paddingVertical: 6,
                          borderRadius: radii.full,
                        }}
                      >
                        <Text style={{ ...typography.caption, color: '#FFFFFF', fontWeight: '700' }}>Featured</Text>
                      </View>
                    </View>

                    <View style={{ flex: 1, padding: spacing.md }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            ...typography.titleMedium,
                            color: colors.textPrimary,
                            flex: 1,
                            paddingRight: spacing.sm,
                          }}
                        >
                          {item.name ?? 'Untitled'}
                        </Text>
                        <TouchableOpacity
                          onPress={(event) => {
                            event.stopPropagation();
                            handleToggleFavourite(item.id, item.type);
                          }}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            borderWidth: 1,
                            borderColor: colors.borderSubtle,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.surface,
                          }}
                        >
                          <MaterialIcons
                            name={
                              (item.type === 'vendor' && favouriteIds.vendorIds.includes(item.id)) ||
                              (item.type === 'venue' && favouriteIds.venueIds.includes(item.id))
                                ? 'favorite'
                                : 'favorite-border'
                            }
                            size={18}
                            color={
                              (item.type === 'vendor' && favouriteIds.vendorIds.includes(item.id)) ||
                              (item.type === 'venue' && favouriteIds.venueIds.includes(item.id))
                                ? colors.primaryTeal
                                : colors.textMuted
                            }
                          />
                        </TouchableOpacity>
                      </View>

                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          alignSelf: 'flex-start',
                          backgroundColor: colors.primaryTeal + '15',
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 6,
                          borderRadius: radii.md,
                          marginTop: spacing.sm,
                        }}
                      >
                        <MaterialIcons name="star-outline" size={16} color={colors.primaryTeal} />
                        <Text style={{ ...typography.caption, color: colors.textPrimary, marginLeft: spacing.xs }}>
                          {typeof item.rating === 'number' ? item.rating.toFixed(1) : '—'}
                          {typeof item.review_count === 'number' && item.review_count > 0 ? ` (${item.review_count})` : ''}
                        </Text>
                      </View>

                      {item.description ? (
                        <Text
                          numberOfLines={3}
                          style={{
                            ...typography.caption,
                            color: colors.textSecondary,
                            marginTop: spacing.sm,
                            lineHeight: 16,
                          }}
                        >
                          {item.description}
                        </Text>
                      ) : null}

                      <View
                        style={{
                          alignSelf: 'flex-start',
                          backgroundColor: colors.surfaceMuted,
                          paddingHorizontal: spacing.md,
                          paddingVertical: 6,
                          borderRadius: radii.full,
                          marginTop: spacing.sm,
                        }}
                      >
                        <Text style={{ ...typography.caption, color: colors.textPrimary, fontWeight: '600' }}>
                          {[item.city, item.province].filter(Boolean).join(', ') || item.location || 'Location not specified'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View style={{ padding: spacing.md, paddingTop: 0 }}>
                    <TouchableOpacity
                      onPress={() => {
                        if (item.type === 'venue') {
                          navigation.navigate('VenueProfile', { venueId: item.id });
                        } else {
                          navigation.navigate('VendorProfile', { vendorId: item.id });
                        }
                      }}
                      style={{
                        width: '100%',
                        height: 44,
                        borderRadius: radii.md,
                        backgroundColor: colors.primaryTeal,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '700' }}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      <Modal
        visible={openPicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setOpenPicker(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.lg,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              maxHeight: '70%',
            }}
          >
            <Text
              style={{
                ...typography.titleMedium,
                color: colors.textPrimary,
                marginBottom: spacing.md,
              }}
            >
              {openPicker === 'category'
                ? 'Search by Category'
                : openPicker === 'subcategory'
                ? 'What are you looking for?'
                : openPicker === 'venue_amenities'
                ? 'Venue Amenities'
                : openPicker === 'province'
                ? 'Select Provinces (Multi-select)'
                : openPicker === 'city'
                ? 'Select Cities (Multi-select)'
                : openPicker === 'capacity_band'
                ? 'Event Capacity'
                : openPicker === 'distance'
                ? 'Select Distance'
                : ''}
            </Text>
            <ScrollView>
              {openPicker === 'category' ? (
                (() => {
                  const renderVenueTypes = () =>
                    VENUE_TYPES.map((venueType) => {
                      const isSelected = selectedVenueTypes.includes(venueType);
                      return (
                        <TouchableOpacity
                          key={`venue-type-${venueType}`}
                          onPress={() => {
                            const next = isSelected
                              ? selectedVenueTypes.filter((v) => v !== venueType)
                              : [...selectedVenueTypes, venueType];
                            setSelectedVenueTypes(next);
                          }}
                          style={{ paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center' }}
                        >
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 4,
                              borderWidth: 2,
                              borderColor: isSelected ? colors.primary : '#D1D5DB',
                              backgroundColor: isSelected ? colors.primary : '#FFFFFF',
                              marginRight: spacing.sm,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isSelected && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                          </View>
                          <Text style={{ ...typography.body, color: colors.textPrimary }}>{venueType}</Text>
                        </TouchableOpacity>
                      );
                    });

                  const renderVendorCategories = () =>
                    VENDOR_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategoryIds.includes(cat.id);
                      return (
                        <TouchableOpacity
                          key={`vendor-cat-${cat.id}`}
                          onPress={() => {
                            const next = isSelected
                              ? selectedCategoryIds.filter((id) => id !== cat.id)
                              : [...selectedCategoryIds, cat.id];
                            setSelectedCategoryIds(next);
                            setSelectedSubcategories([]);
                          }}
                          style={{ paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center' }}
                        >
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 4,
                              borderWidth: 2,
                              borderColor: isSelected ? colors.primary : '#D1D5DB',
                              backgroundColor: isSelected ? colors.primary : '#FFFFFF',
                              marginRight: spacing.sm,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isSelected && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                          </View>
                          <Text style={{ ...typography.body, color: colors.textPrimary }}>{cat.label}</Text>
                        </TouchableOpacity>
                      );
                    });

                  if (serviceType === 'Venues') {
                    return renderVenueTypes();
                  }
                  if (serviceType === 'Vendors' || serviceType === 'Service Providers') {
                    return renderVendorCategories();
                  }

                  return [
                    <Text
                      key="category-header-venues"
                      style={{ ...typography.caption, color: colors.textMuted, fontWeight: '700', marginTop: spacing.xs }}
                    >
                      Venues
                    </Text>,
                    ...renderVenueTypes(),
                    <Text
                      key="category-header-vendors"
                      style={{ ...typography.caption, color: colors.textMuted, fontWeight: '700', marginTop: spacing.md }}
                    >
                      Vendor & Service Professionals
                    </Text>,
                    ...renderVendorCategories(),
                  ];
                })()
              ) : openPicker === 'subcategory' ? (
                (() => {
                  if (serviceType === 'Venues') {
                    return (
                      <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                        <MaterialIcons name="info-outline" size={48} color={colors.textMuted} />
                        <Text
                          style={{
                            ...typography.body,
                            color: colors.textSecondary,
                            marginTop: spacing.md,
                            textAlign: 'center',
                          }}
                        >
                          Sub-options are available for Vendor & Service Professionals.
                        </Text>
                      </View>
                    );
                  }

                  return [
                    <TouchableOpacity
                      key="all-services"
                      onPress={() => {
                        setSelectedSubcategories([]);
                        setOpenPicker(null);
                      }}
                      style={{ paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center' }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: selectedSubcategories.length === 0 ? colors.primary : '#D1D5DB',
                          backgroundColor: selectedSubcategories.length === 0 ? colors.primary : '#FFFFFF',
                          marginRight: spacing.sm,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {selectedSubcategories.length === 0 && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                      </View>
                      <Text style={{ ...typography.body, color: colors.textPrimary }}>All Services</Text>
                    </TouchableOpacity>,
                    ...availableSubcategories.map((sub) => {
                      const isSelected = selectedSubcategories.includes(sub);
                      return (
                        <TouchableOpacity
                          key={sub}
                          onPress={() => {
                            const next = isSelected
                              ? selectedSubcategories.filter((s) => s !== sub)
                              : [...selectedSubcategories, sub];
                            setSelectedSubcategories(next);
                          }}
                          style={{ paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center' }}
                        >
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 4,
                              borderWidth: 2,
                              borderColor: isSelected ? colors.primary : '#D1D5DB',
                              backgroundColor: isSelected ? colors.primary : '#FFFFFF',
                              marginRight: spacing.sm,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isSelected && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                          </View>
                          <Text style={{ ...typography.body, color: colors.textPrimary }}>{sub}</Text>
                        </TouchableOpacity>
                      );
                    }),
                  ];
                })()
              ) : openPicker === 'venue_amenities' ? (
                (() => {
                  const options = Array.from(
                    new Set((amenitiesList ?? []).map((v) => String(v ?? '').trim()).filter(Boolean)),
                  ).sort();

                  return options.map((amenity) => {
                    const isSelected = selectedVenueAmenities.includes(amenity);
                    return (
                      <TouchableOpacity
                        key={amenity}
                        onPress={() => {
                          const next = isSelected
                            ? selectedVenueAmenities.filter((a) => a !== amenity)
                            : [...selectedVenueAmenities, amenity];
                          setSelectedVenueAmenities(next);
                        }}
                        style={{ paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center' }}
                      >
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            borderWidth: 2,
                            borderColor: isSelected ? colors.primary : '#D1D5DB',
                            backgroundColor: isSelected ? colors.primary : '#FFFFFF',
                            marginRight: spacing.sm,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                        </View>
                        <Text style={{ ...typography.body, color: colors.textPrimary }}>{amenity}</Text>
                      </TouchableOpacity>
                    );
                  });
                })()
              ) : openPicker === 'province' ? (
                provinces.map((province) => {
                  const isSelected = selectedProvinces.includes(province.name);
                  return (
                    <TouchableOpacity
                      key={province.name}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedProvinces(selectedProvinces.filter(p => p !== province.name));
                        } else {
                          setSelectedProvinces([...selectedProvinces, province.name]);
                        }
                      }}
                      style={{
                        paddingVertical: spacing.sm,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: isSelected ? colors.primary : '#D1D5DB',
                          backgroundColor: isSelected ? colors.primary : '#FFFFFF',
                          marginRight: spacing.sm,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected && (
                          <MaterialIcons name="check" size={16} color="#FFFFFF" />
                        )}
                      </View>
                      <Text
                        style={{
                          ...typography.body,
                          color: colors.textPrimary,
                        }}
                      >
                        {province.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : openPicker === 'city' ? (
                (() => {
                  const availableCities = selectedProvinces.length > 0
                    ? selectedProvinces.flatMap(p => getCitiesByProvince(p))
                    : [];
                  
                  if (selectedProvinces.length === 0) {
                    return (
                      <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                        <MaterialIcons name="location-city" size={48} color={colors.textMuted} />
                        <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' }}>
                          Please select at least one province first to see available cities.
                        </Text>
                      </View>
                    );
                  }
                  
                  if (availableCities.length === 0) {
                    return (
                      <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                        <MaterialIcons name="error-outline" size={48} color={colors.textMuted} />
                        <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' }}>
                          No cities found for the selected province(s).
                        </Text>
                      </View>
                    );
                  }
                  
                  return availableCities.sort().map((city) => {
                    const isSelected = selectedCities.includes(city);
                    return (
                      <TouchableOpacity
                        key={city}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedCities(selectedCities.filter(c => c !== city));
                          } else {
                            setSelectedCities([...selectedCities, city]);
                          }
                        }}
                        style={{
                          paddingVertical: spacing.sm,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            borderWidth: 2,
                            borderColor: isSelected ? colors.primary : '#D1D5DB',
                            backgroundColor: isSelected ? colors.primary : '#FFFFFF',
                            marginRight: spacing.sm,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && (
                            <MaterialIcons name="check" size={16} color="#FFFFFF" />
                          )}
                        </View>
                        <Text
                          style={{
                            ...typography.body,
                            color: colors.textPrimary,
                          }}
                        >
                          {city}
                        </Text>
                      </TouchableOpacity>
                    );
                  });
                })()
              ) : openPicker === 'capacity_band' ? (
                capacityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => {
                      setSelectedCapacity(option);
                      setOpenPicker(null);
                    }}
                    style={{
                      paddingVertical: spacing.sm,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.body,
                        color: colors.textPrimary,
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : openPicker === 'distance' ? (
                // Distance options
                ['20', '50', '100', '200'].map((distance) => (
                  <TouchableOpacity
                    key={distance}
                    onPress={() => {
                      setDistanceKm(distance);
                      setOpenPicker(null);
                    }}
                    style={{
                      paddingVertical: spacing.sm,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.body,
                        color: colors.textPrimary,
                      }}
                    >
                      {distance} km
                    </Text>
                  </TouchableOpacity>
                ))
              ) : null}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setOpenPicker(null)}
              style={{
                marginTop: spacing.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.lg,
                backgroundColor: colors.primary,
                borderRadius: radii.md,
                alignSelf: 'center',
              }}
            >
              <Text
                style={{
                  ...typography.body,
                  color: '#FFFFFF',
                  fontWeight: '600',
                }}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {activeDatePicker && (
        <DateTimePicker
          value={
            activeDatePicker === 'from'
              ? fromDate ?? new Date()
              : toDate ?? fromDate ?? new Date()
          }
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              if (activeDatePicker === 'from') {
                setFromDate(selectedDate);
                if (singleDayEvent) {
                  setToDate(selectedDate);
                }
              } else {
                setToDate(selectedDate);
              }
            }
            setActiveDatePicker(null);
          }}
        />
      )}
      
      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.lg,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              maxHeight: '70%',
            }}
          >
            <Text
              style={{
                ...typography.titleMedium,
                color: colors.textPrimary,
                marginBottom: spacing.md,
              }}
            >
              Sort Results
            </Text>
            
            <ScrollView>
              {/* Sort By Options */}
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm }}>
                  Sort by
                </Text>
                {[
                  { key: 'name' as const, label: 'Name (A-Z)', icon: 'sort' },
                  { key: 'rating' as const, label: 'Rating', icon: 'star' },
                  { key: 'price' as const, label: 'Price', icon: 'attach-money' },
                  { key: 'distance' as const, label: 'Distance', icon: 'location-on' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => {
                      setSortBy(option.key);
                      setShowSortModal(false);
                    }}
                    style={{
                      paddingVertical: spacing.sm,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: sortBy === option.key ? colors.primary + '20' : 'transparent',
                      borderRadius: radii.md,
                      paddingHorizontal: spacing.sm,
                    }}
                  >
                    <MaterialIcons name={option.icon as any} size={20} color={colors.primary} />
                    <Text
                      style={{
                        ...typography.body,
                        color: colors.textPrimary,
                        marginLeft: spacing.sm,
                        fontWeight: sortBy === option.key ? '600' : 'normal',
                      }}
                    >
                      {option.label}
                    </Text>
                    {sortBy === option.key && (
                      <MaterialIcons name="check" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Sort Order Options */}
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm }}>
                  Order
                </Text>
                {[
                  { key: 'asc' as const, label: 'Ascending (A-Z, 1-10)', icon: 'arrow-upward' },
                  { key: 'desc' as const, label: 'Descending (Z-A, 10-1)', icon: 'arrow-downward' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => {
                      setSortOrder(option.key);
                      setShowSortModal(false);
                    }}
                    style={{
                      paddingVertical: spacing.sm,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: sortOrder === option.key ? colors.primary + '20' : 'transparent',
                      borderRadius: radii.md,
                      paddingHorizontal: spacing.sm,
                    }}
                  >
                    <MaterialIcons name={option.icon as any} size={20} color={colors.primary} />
                    <Text
                      style={{
                        ...typography.body,
                        color: colors.textPrimary,
                        marginLeft: spacing.sm,
                        fontWeight: sortOrder === option.key ? '600' : 'normal',
                      }}
                    >
                      {option.label}
                    </Text>
                    {sortOrder === option.key && (
                      <MaterialIcons name="check" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <TouchableOpacity
              onPress={() => setShowSortModal(false)}
              style={{
                marginTop: spacing.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.lg,
                backgroundColor: colors.primary,
                borderRadius: radii.md,
                alignSelf: 'center',
              }}
            >
              <Text
                style={{
                  ...typography.body,
                  color: '#FFFFFF',
                  fontWeight: '600',
                }}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Map Radius Selector */}
      <MapRadiusSelector
        visible={showMapRadiusSelector}
        onClose={() => setShowMapRadiusSelector(false)}
        onLocationSelected={handleLocationSelected}
        initialRadius={mapRadius}
      />
    </ScrollView>
  );
}
