import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApplicationForm, type ApplicationFormState } from '../context/ApplicationFormContext';
import { validateStep2 } from '../utils/formValidation';
import { ApplicationProgress } from '../components/ApplicationProgress';

const VENUE_TYPES = [
  'Barn', 'Banquet Hall', 'Beach', 'Boat', 'Castle', 'Conference Centre', 'Country House', 'Estate', 'Garden', 'Hotel', 'Restaurant', 'Rooftop', 'Vineyard', 'Warehouse', 'Winery', 'Other',
];

const AMENITIES = [
  'Wheelchair Accessible', 'Parking', 'Catering', 'Bar Service', 'In-house AV', 'Outdoor Space', 'Accommodation', 'Bridal Suite', 'Pet Friendly', 'Swimming Pool', 'Dance Floor', 'Sound System', 'Lighting', 'Wifi', 'Kitchen',
];

const EVENT_TYPES = [
  'Wedding', 'Corporate', 'Birthday', 'Baby Shower', 'Bridal Shower', 'Engagement', 'Conference', 'Workshop', 'Seminar', 'Gala', 'Festival', 'Concert', 'Market', 'Exhibition', 'Other',
];

const VENDOR_SERVICE_CATEGORIES = [
  'Photography', 'Videography', 'Catering', 'Floristry', 'Decor', 'Music', 'DJ', 'Entertainment', 'Lighting', 'Sound', 'Cake', 'Stationery', 'Hair & Makeup', 'Styling', 'Wedding Planning', 'Event Planning', 'Transport', 'Security', 'Other',
];

const PROVINCES = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'];

export default function ApplicationStep2Page() {
  const navigate = useNavigate();
  const { state, updateStep2 } = useApplicationForm();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.portfolioType) {
      navigate('/portfolio-type');
      return;
    }
    setLoading(false);
  }, [state.portfolioType, navigate]);

  const toggleChip = (key: keyof ApplicationFormState['step2'], value: string, max?: number) => {
    const current = state.step2[key] as string[];
    const exists = current.includes(value);
    let next: string[];
    if (exists) {
      next = current.filter((v) => v !== value);
    } else if (max && current.length >= max) {
      return;
    } else {
      next = [...current, value];
    }
    updateStep2({ [key]: next });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const updateHall = (index: number, field: 'name' | 'capacity', value: string) => {
    const halls = state.step2.halls.map((h, i) => (i === index ? { ...h, [field]: value } : h));
    updateStep2({ halls });
  };

  const handleNext = () => {
    const result = validateStep2(state.step2, state.portfolioType);
    setErrors(result.errors);
    if (!result.isValid) return;
    navigate('/apply/step3');
  };

  if (loading) {
    return (
      <div className="fx-container py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const ChipGroup = ({ label, values, selected, error, onToggle, max }: {
    label: string;
    values: string[];
    selected: string[];
    error?: string;
    onToggle: (v: string) => void;
    max?: number;
  }) => (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >
        {label} {max ? `(max ${max})` : ''}
      </label>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => {
          const active = selected.includes(v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => onToggle(v)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active ? 'border-primary text-white' : 'border-outline-variant bg-white text-on-surface hover:bg-surface-container-low'
              }`}
              style={active ? { background: '#123f5c' } : { fontFamily: "'Montserrat', sans-serif" }}
            >
              {v}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/apply/step1"
          className="mb-4 inline-flex items-center text-sm font-medium hover:underline"
          style={{ color: '#123f5c' }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: '#123f5c' }}>
            Step 2: {state.portfolioType === 'venues' ? 'Venue Details' : 'Service Details'}
          </h1>
          <ApplicationProgress currentStep={2} />
        </div>

        <div className="space-y-8">
          {state.portfolioType === 'venues' && (
            <>
              <ChipGroup
                label="Venue Type *"
                values={VENUE_TYPES}
                selected={state.step2.venueType}
                error={errors.venueType}
                onToggle={(v) => toggleChip('venueType', v, 3)}
                max={3}
              />
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >Venue Capacity *</label>
                <input
                  type="number"
                  value={state.step2.venueCapacity || ''}
                  onChange={(e) => updateStep2({ venueCapacity: e.target.value })}
                  placeholder="Max guest capacity"
                  className={`w-full rounded-lg border px-4 py-3 text-sm outline-none ${errors.venueCapacity ? 'border-red-500' : 'border-outline-variant focus:border-primary'}`}
                  
                />
                {errors.venueCapacity && <p className="mt-1 text-xs text-red-500">{errors.venueCapacity}</p>}
              </div>
              <ChipGroup
                label="Amenities"
                values={AMENITIES}
                selected={state.step2.amenities}
                onToggle={(v) => toggleChip('amenities', v)}
              />
              <ChipGroup
                label="Event Types *"
                values={EVENT_TYPES}
                selected={state.step2.eventTypes}
                error={errors.eventTypes}
                onToggle={(v) => toggleChip('eventTypes', v)}
              />
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >Awards & Nominations</label>
                <textarea
                  value={state.step2.awardsAndNominations}
                  onChange={(e) => updateStep2({ awardsAndNominations: e.target.value })}
                  placeholder="Any awards or nominations"
                  rows={3}
                  className="w-full rounded-lg border border-outline-variant px-4 py-3 text-sm outline-none focus:border-primary"
                  
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >Halls / Spaces (up to 5)</label>
                <div className="grid gap-3 md:grid-cols-2">
                  {state.step2.halls.map((hall, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={hall.name}
                        onChange={(e) => updateHall(i, 'name', e.target.value)}
                        placeholder={`Hall ${i + 1} name`}
                        className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary"
                        
                      />
                      <input
                        type="number"
                        value={hall.capacity}
                        onChange={(e) => updateHall(i, 'capacity', e.target.value)}
                        placeholder="Capacity"
                        className="w-24 rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary"
                        
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >Payment Terms & Conditions</label>
                <textarea
                  value={state.step2.paymentTermsAndConditions}
                  onChange={(e) => updateStep2({ paymentTermsAndConditions: e.target.value })}
                  placeholder="Describe your payment terms"
                  rows={3}
                  className="w-full rounded-lg border border-outline-variant px-4 py-3 text-sm outline-none focus:border-primary"
                  
                />
              </div>
            </>
          )}

          {state.portfolioType === 'vendors' && (
            <>
              <ChipGroup
                label="Service Categories *"
                values={VENDOR_SERVICE_CATEGORIES}
                selected={state.step2.serviceCategories}
                error={errors.serviceCategories}
                onToggle={(v) => toggleChip('serviceCategories', v, 3)}
                max={3}
              />
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >Service Subcategories</label>
                <input
                  type="text"
                  value={state.step2.serviceSubcategories.join(', ')}
                  onChange={(e) => updateStep2({ serviceSubcategories: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  placeholder="Comma separated subcategories"
                  className="w-full rounded-lg border border-outline-variant px-4 py-3 text-sm outline-none focus:border-primary"
                  
                />
              </div>
              <ChipGroup
                label="Special Features"
                values={['Eco-friendly', 'Pet-friendly', 'Child-friendly', 'LGBTQ+ Friendly', 'Customisable Packages', 'Late-night Service', 'Travel Included']}
                selected={state.step2.specialFeatures}
                onToggle={(v) => toggleChip('specialFeatures', v)}
              />
            </>
          )}

          <ChipGroup
            label="Coverage Provinces *"
            values={PROVINCES}
            selected={state.step2.provinces}
            error={errors.provinces}
            onToggle={(v) => toggleChip('provinces', v)}
          />
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >Coverage Cities</label>
            <input
              type="text"
              value={state.step2.cities.join(', ')}
              onChange={(e) => updateStep2({ cities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              placeholder="Comma separated cities"
              className="w-full rounded-lg border border-outline-variant px-4 py-3 text-sm outline-none focus:border-primary"
              
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >
              {state.portfolioType === 'venues' ? 'Venue Bio *' : 'Business Description *'}
            </label>
            <textarea
              value={state.step2.description}
              onChange={(e) => updateStep2({ description: e.target.value })}
              placeholder="Tell us about your business (min 50 characters)"
              rows={5}
              className={`w-full rounded-lg border px-4 py-3 text-sm outline-none ${errors.description ? 'border-red-500' : 'border-outline-variant focus:border-primary'}`}
              
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <Link
            to="/apply/step1"
            className="rounded-lg border border-outline-variant px-6 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
            
          >
            Previous
          </Link>
          <button
            onClick={handleNext}
            className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-white hover:opacity-90"
            style={{ background: '#123f5c' }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
