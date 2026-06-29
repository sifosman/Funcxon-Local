import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApplicationForm, type ApplicationFormState } from '../context/ApplicationFormContext';
import { validateStep1 } from '../utils/formValidation';
import { getLatestUserApplicationByType, isBlockingApplicationStatus } from '../lib/applicationService';
import { AddressAutocompleteInput } from '../components/AddressAutocompleteInput';
import { ApplicationProgress } from '../components/ApplicationProgress';

interface Field {
  key: keyof ApplicationFormState['step1'];
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}

const TEXT_FIELDS: Field[] = [
  { key: 'registeredBusinessName', label: 'Registered Business Name', placeholder: 'Registered business name', required: true },
  { key: 'tradingName', label: 'Trading Name', placeholder: 'Trading name (if different)' },
  { key: 'funcxonUserName', label: 'Funxon Username', placeholder: 'Your Funxon username' },
  { key: 'userWhatsapp', label: 'WhatsApp Number', placeholder: 'WhatsApp number' },
  { key: 'userEmail', label: 'User Email', placeholder: 'user@email.com', type: 'email' },
  { key: 'ownersName', label: "Owner's Name", placeholder: "Owner's full name", required: true },
  { key: 'companyRegNumber', label: 'Company Registration Number', placeholder: 'Company registration number' },
  { key: 'vatNumber', label: 'VAT Number', placeholder: 'VAT number (if applicable)' },
];

const CONTACT_FIELDS: Field[] = [
  { key: 'contactPhoneNumber', label: 'Contact Phone Number', placeholder: 'Contact phone number', required: true },
  { key: 'alternatePhone1', label: 'Alternate Phone 1', placeholder: 'Alternate phone number' },
  { key: 'alternatePhone2', label: 'Alternate Phone 2', placeholder: 'Alternate phone number' },
  { key: 'email', label: 'Business Email', placeholder: 'business@email.com', type: 'email', required: true },
  { key: 'alternateEmail', label: 'Alternate Email', placeholder: 'Alternate email address', type: 'email' },
];

const SOCIAL_FIELDS: Field[] = [
  { key: 'instagram', label: 'Instagram', placeholder: 'Instagram profile URL' },
  { key: 'facebook', label: 'Facebook', placeholder: 'Facebook profile URL' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'TikTok profile URL' },
];

export default function ApplicationStep1Page() {
  const navigate = useNavigate();
  const { state, updateStep1 } = useApplicationForm();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const portfolioType = state.portfolioType === 'venues' ? 'venue' : state.portfolioType === 'vendors' ? 'vendor' : null;
      if (!portfolioType) {
        navigate('/portfolio-type');
        return;
      }

      const result = await getLatestUserApplicationByType(portfolioType);
      if (result.success && result.data && isBlockingApplicationStatus(result.data.status)) {
        navigate('/apply/status');
        return;
      }
      setLoading(false);
    };

    checkStatus();
  }, [state.portfolioType, navigate]);

  const handleChange = (key: keyof ApplicationFormState['step1'], value: string) => {
    updateStep1({ [key]: value });
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const handleNext = () => {
    const result = validateStep1(state.step1);
    setErrors(result.errors);
    if (!result.isValid) {
      return;
    }
    navigate('/apply/step2');
  };

  if (loading) {
    return (
      <div className="fx-container py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/portfolio-type"
          className="mb-4 inline-flex items-center text-sm font-medium hover:underline"
          style={{ color: '#123f5c' }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <h1
            className="text-2xl font-bold"
            style={{ color: '#123f5c' }}
          >
            Step 1: Company Details
          </h1>
          <ApplicationProgress currentStep={1} />
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {TEXT_FIELDS.map((field) => (
              <div key={field.key}>
                <label
                  className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                  
                >
                  {field.label}
                  {field.required ? ' *' : ''}
                </label>
                <input
                  type={field.type || 'text'}
                  value={state.step1[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors ${
                    errors[field.key] ? 'border-red-500' : 'border-outline-variant focus:border-primary'
                  }`}
                  
                />
                {errors[field.key] && <p className="mt-1 text-xs text-red-500">{errors[field.key]}</p>}
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AddressAutocompleteInput
              label="Business Physical Address"
              placeholder="Search business address"
              value={state.step1.businessPhysicalAddress}
              onChangeValue={(value) => handleChange('businessPhysicalAddress', value)}
              error={errors.businessPhysicalAddress}
            />
            <AddressAutocompleteInput
              label="Billing Address"
              placeholder="Search billing address"
              value={state.step1.billingAddress}
              onChangeValue={(value) => handleChange('billingAddress', value)}
              error={errors.billingAddress}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {CONTACT_FIELDS.map((field) => (
              <div key={field.key}>
                <label
                  className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                  
                >
                  {field.label}
                  {field.required ? ' *' : ''}
                </label>
                <input
                  type={field.type || 'text'}
                  value={state.step1[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors ${
                    errors[field.key] ? 'border-red-500' : 'border-outline-variant focus:border-primary'
                  }`}
                  
                />
                {errors[field.key] && <p className="mt-1 text-xs text-red-500">{errors[field.key]}</p>}
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {SOCIAL_FIELDS.map((field) => (
              <div key={field.key}>
                <label
                  className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                  
                >
                  {field.label}
                </label>
                <input
                  type="text"
                  value={state.step1[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors ${
                    errors[field.key] ? 'border-red-500' : 'border-outline-variant focus:border-primary'
                  }`}
                  
                />
                {errors[field.key] && <p className="mt-1 text-xs text-red-500">{errors[field.key]}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <Link
            to="/portfolio-type"
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
