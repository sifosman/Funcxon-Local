import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AddressAutocompleteInput } from '../components/AddressAutocompleteInput';

export default function UpdateVendorPortfolioPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    address_line_1: '',
    address_line_2: '',
    suburb: '',
    city: '',
    province: '',
    postal_code: '',
    email: '',
    whatsapp_number: '',
    website_url: '',
    instagram_url: '',
  });

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      const { data } = await supabase.from('vendors').select('*').eq('user_id', user.id).maybeSingle();
      if (data) {
        setForm({
          name: data.name || '',
          description: data.description || '',
          location: data.location || '',
          address_line_1: data.address_line_1 || '',
          address_line_2: data.address_line_2 || '',
          suburb: data.suburb || '',
          city: data.city || '',
          province: data.province || '',
          postal_code: data.postal_code || '',
          email: data.email || '',
          whatsapp_number: data.whatsapp_number || '',
          website_url: data.website_url || '',
          instagram_url: data.instagram_url || '',
        });
      }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase.from('vendors').upsert({ ...form, user_id: user.id }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      console.error('Vendor portfolio update error:', error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="fx-container py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const fields: { key: keyof typeof form; label: string; type?: string; required?: boolean }[] = [
    { key: 'name', label: 'Business Name', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'whatsapp_number', label: 'WhatsApp Number' },
    { key: 'website_url', label: 'Website URL' },
    { key: 'instagram_url', label: 'Instagram URL' },
  ];

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/portfolio/profile"
          className="mb-4 inline-flex items-center text-sm font-medium hover:underline"
          style={{ fontFamily: "'Montserrat', sans-serif", color: '#123f5c' }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Portfolio Profile
        </Link>

        <h1 className="mb-2 text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#123f5c' }}>
          Update Vendor Portfolio
        </h1>
        <p className="mb-6 text-sm" style={{ fontFamily: "'Montserrat', sans-serif", color: '#72787e' }}>
          Edit your business details and contact information.
        </p>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {field.label}{field.required ? ' *' : ''}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={form[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-outline-variant px-4 py-3 text-sm outline-none focus:border-primary"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={form[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full rounded-lg border border-outline-variant px-4 py-3 text-sm outline-none focus:border-primary"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  />
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>Location</label>
            <AddressAutocompleteInput
              label=""
              placeholder="Search address"
              value={form.location}
              onChangeValue={(value) => handleChange('location', value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(['address_line_1', 'address_line_2', 'suburb', 'city', 'province', 'postal_code'] as const).map((key) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full rounded-lg border border-outline-variant px-4 py-3 text-sm outline-none focus:border-primary"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <Link
            to="/portfolio/profile"
            className="rounded-lg border border-outline-variant px-6 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            style={{ fontFamily: "'Montserrat', sans-serif", background: '#123f5c' }}
          >
            {saving ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span> : saved ? <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Saved</span> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
