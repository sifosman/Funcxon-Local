import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { AppAlert } from '../components/AppAlert';
import { ChevronLeft, User } from 'lucide-react';

export default function AccountSettingsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/signin');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    setUsername(user.user_metadata?.username || '');
    setFullName(user.user_metadata?.full_name || user.user_metadata?.display_name || '');
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          username: username.trim(),
          full_name: fullName.trim(),
          display_name: fullName.trim() || username.trim(),
        },
      });
      if (error) throw error;
      setAlert({ title: 'Profile updated', message: 'Your profile details have been saved.', type: 'success' });
    } catch (err: any) {
      setAlert({ title: 'Update failed', message: err?.message || 'Could not update profile.', type: 'error' });
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
              <User className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-on-surface">Account Settings</h1>
              <p className="text-sm text-on-surface-variant">Update your profile information</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-on-surface">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="fx-input w-full rounded-lg border border-border-subtle bg-white px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. jane_doe"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-on-surface">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="fx-input w-full rounded-lg border border-border-subtle bg-white px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Jane Doe"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Changes'}
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
