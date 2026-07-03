// WEB ONLY — deploy-web/src/components/DataConsentModal.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';

const CONSENT_KEY = 'funxon.dataConsent.v1';

interface DataConsentModalProps {
  forceShow?: boolean;
  onClose?: () => void;
}

export function DataConsentModal({ forceShow, onClose }: DataConsentModalProps) {
  const { session } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      return;
    }

    try {
      const accepted = localStorage.getItem(CONSENT_KEY) === 'true';
      setVisible(!accepted);
    } catch {
      setVisible(false);
    }
  }, [forceShow, session]);

  const handleAccept = async () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'true');
    } catch {
      // ignore
    }

    if (session?.user?.id) {
      try {
        await supabase
          .from('users')
          .update({ data_consent_accepted: true, data_consent_accepted_at: new Date().toISOString() })
          .eq('auth_user_id', session.user.id);
      } catch (error) {
        console.error('Failed to record consent in Supabase:', error);
      }
    }

    setVisible(false);
    onClose?.();
  };

  const handleDecline = async () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'declined');
    } catch {
      // ignore
    }

    if (session?.user?.id) {
      try {
        await supabase
          .from('users')
          .update({ data_consent_accepted: false, data_consent_accepted_at: new Date().toISOString() })
          .eq('auth_user_id', session.user.id);
      } catch (error) {
        console.error('Failed to record decline in Supabase:', error);
      }
    }

    setVisible(false);
    onClose?.();
  };

  useEffect(() => {
    if (!visible) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDecline();
      }
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200" onClick={(e) => { if (e.target === e.currentTarget) handleDecline(); }}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="font-display mb-2 text-xl font-semibold text-on-surface">Data & Privacy Consent</h2>
        <p className="mb-4 text-sm leading-relaxed text-on-surface-variant">
          We need your permission to process your personal information to provide event planning, vendor matching, and
          account services. You can manage your preferences at any time in Account settings.
        </p>

        <ul className="mb-6 space-y-2 text-sm text-on-surface">
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-brand-teal">check</span>
            Store your profile and event preferences securely.
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-brand-teal">check</span>
            Match you with venues and vendors based on your needs.
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-brand-teal">check</span>
            Send booking updates and marketing emails you can opt out of.
          </li>
        </ul>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleAccept}
            className="fx-btn-primary h-12 w-full rounded-lg text-base font-bold"
          >
            I Accept
          </button>
          <button
            onClick={handleDecline}
            className="fx-btn-outline h-12 w-full rounded-lg text-base font-bold"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
