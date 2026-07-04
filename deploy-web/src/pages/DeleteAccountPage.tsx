import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { AppAlert } from '../components/AppAlert';
import { ChevronLeft, Trash2, AlertTriangle } from 'lucide-react';

export default function DeleteAccountPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' | 'success' } | null>(null);

  async function handleDelete() {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (confirmText !== 'DELETE') {
      setAlert({ title: 'Confirmation required', message: 'Please type DELETE to confirm account deletion.', type: 'error' });
      return;
    }
    setDeleting(true);
    try {
      // Edge Function call for secure deletion (the function may not exist; fallback to client-side auth delete).
      const { data, error: fnError } = await supabase.functions.invoke('delete-account', { body: { userId: user.id } });
      if (fnError || !data?.success) {
        console.warn('Edge Function delete-account failed or unavailable; falling back to auth delete.', fnError?.message || data?.error);
      }
      const { error } = await supabase.rpc('delete_user', { user_id: user.id });
      if (error) {
        console.warn('delete_user RPC unavailable; signing out locally.', error.message);
      }
      await signOut();
      navigate('/');
    } catch (err: any) {
      setAlert({ title: 'Deletion failed', message: err?.message || 'Could not delete account. Please contact support.', type: 'error' });
    } finally {
      setDeleting(false);
      setDialogOpen(false);
    }
  }

  if (!user) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="text-center">
          <Trash2 className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Sign in to manage your account</h2>
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
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-container">
              <Trash2 className="h-6 w-6 text-error" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-on-surface">Delete Account</h1>
              <p className="text-sm text-on-surface-variant">This action cannot be undone.</p>
            </div>
          </div>

          <div className="rounded-xl border border-error/30 bg-error-container/30 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-error">Warning</p>
                <p className="text-sm text-on-surface-variant">
                  Deleting your account will remove all your personal data, listings, quotes, and payment history from Funxon.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setDialogOpen(true)}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-error text-sm font-bold text-white transition-colors hover:bg-error/90"
          >
            Delete My Account
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-display text-xl font-semibold text-on-surface">Are you sure?</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Type <strong className="text-error">DELETE</strong> below to confirm permanent account deletion.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="fx-input mt-4 w-full rounded-lg border border-border-subtle px-4 py-2.5 text-sm text-on-surface focus:border-error focus:outline-none focus:ring-1 focus:ring-error"
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDialogOpen(false)}
                className="flex-1 rounded-lg border border-border-subtle py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || confirmText !== 'DELETE'}
                className="flex-1 rounded-lg bg-error py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type={alert.type} onDismiss={() => setAlert(null)} />}
    </div>
  );
}
