import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { AppAlert } from '../components/AppAlert';
import { ChevronLeft, Lock, Eye, EyeOff } from 'lucide-react';

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' | 'success' } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      navigate('/signin');
      return;
    }
    if (newPassword.length < 6) {
      setAlert({ title: 'Invalid password', message: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAlert({ title: 'Passwords do not match', message: 'Please confirm your new password.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: currentPassword,
      });
      if (verifyError) {
        setAlert({ title: 'Incorrect password', message: 'Your current password is incorrect. Please try again.', type: 'error' });
        setSaving(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setAlert({ title: 'Password changed', message: 'Your password has been updated successfully.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setAlert({ title: 'Change failed', message: err?.message || 'Could not update password.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Sign in to change your password</h2>
          <Link to="/signin" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-md">
        <Link to="/account" className="mb-4 inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Back to Account
        </Link>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-outline-variant">
          <h1 className="font-display text-xl font-bold text-on-surface">Change Password</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Choose a strong, unique password.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="relative">
              <label className="mb-1.5 block text-sm font-medium text-on-surface">Current Password</label>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className="fx-input w-full rounded-lg border border-border-subtle bg-white px-4 py-2.5 pr-10 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-[2.1rem] text-on-surface-variant">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <label className="mb-1.5 block text-sm font-medium text-on-surface">New Password</label>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="fx-input w-full rounded-lg border border-border-subtle bg-white px-4 py-2.5 pr-10 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-[2.1rem] text-on-surface-variant">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <label className="mb-1.5 block text-sm font-medium text-on-surface">Confirm New Password</label>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="fx-input w-full rounded-lg border border-border-subtle bg-white px-4 py-2.5 pr-10 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-[2.1rem] text-on-surface-variant">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="fx-btn-primary w-full disabled:opacity-60"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
      {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type={alert.type} onDismiss={() => setAlert(null)} />}
    </div>
  );
}
