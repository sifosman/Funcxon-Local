import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { AppAlert } from '../components/AppAlert';
import { ChevronLeft, Megaphone } from 'lucide-react';

export default function MarketingPermissionsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [marketingOptWhatsapp, setMarketingOptWhatsapp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/signin');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    async function loadPreference() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('marketing_opt_in, marketing_opt_whatsapp')
          .eq('auth_user_id', userId)
          .maybeSingle();
        if (!error && data) {
          setMarketingOptIn(!!data.marketing_opt_in);
          setMarketingOptWhatsapp(!!data.marketing_opt_whatsapp);
        }
      } catch (err) {
        console.error('Error loading marketing preference:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPreference();
  }, [user?.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const userId = user?.id;
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ marketing_opt_in: marketingOptIn, marketing_opt_whatsapp: marketingOptWhatsapp })
        .eq('auth_user_id', userId);
      if (error) throw error;
      setAlert({ title: 'Preferences updated', message: 'Your marketing permissions have been saved.', type: 'success' });
    } catch (err: any) {
      setAlert({ title: 'Update failed', message: err?.message || 'Could not save your preferences.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-2xl">
        <Link to="/account" className="mb-4 inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Back to Account
        </Link>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-outline-variant">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
              <Megaphone className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-on-surface">Marketing Permissions</h1>
              <p className="text-sm text-on-surface-variant">Choose whether you want to receive marketing communications.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-white p-4">
              <div className="pr-4">
                <p className="font-medium text-on-surface">Email marketing</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Receive occasional news, feature updates, offers, and relevant product communications.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={e => setMarketingOptIn(e.target.checked)}
                  disabled={loading || saving}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
              </label>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-white p-4">
              <div className="pr-4">
                <p className="font-medium text-on-surface">WhatsApp marketing</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Receive updates and offers via WhatsApp.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={marketingOptWhatsapp}
                  onChange={e => setMarketingOptWhatsapp(e.target.checked)}
                  disabled={loading || saving}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || saving}
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white transition-colors disabled:opacity-60"
              >
                {loading ? 'Loading...' : saving ? 'Saving...' : 'Save Preferences'}
              </button>
              <Link
                to="/account"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-border-subtle px-6 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>

      {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type={alert.type} onDismiss={() => setAlert(null)} />}
    </div>
  );
}
