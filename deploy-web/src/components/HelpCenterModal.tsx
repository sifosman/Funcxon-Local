// WEB ONLY — deploy-web/src/components/HelpCenterModal.tsx
import { useEffect } from 'react';
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from '../utils/env';

interface HelpCenterModalProps {
  open: boolean;
  onClose: () => void;
}

const HELP_TOPICS = [
  {
    icon: 'help_center',
    title: 'Getting Started',
    body: 'New to Funxon? Explore our listers portal, discover venues, and create your first event plan.',
  },
  {
    icon: 'inventory',
    title: 'Catalogues & Quotes',
    body: 'Manage your catalogue items, track quote requests, and respond to enquiries in real time.',
  },
  {
    icon: 'payments',
    title: 'Subscriptions & Billing',
    body: 'Upgrade your plan, change billing periods, and view payment history from the Account section.',
  },
  {
    icon: 'mail',
    title: 'Contact Support',
    body: `Email us at ${SUPPORT_EMAIL} or WhatsApp ${SUPPORT_WHATSAPP} for account help.`,
  },
];

export function HelpCenterModal({ open, onClose }: HelpCenterModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-on-surface">Help Center</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface" aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid gap-4">
          {HELP_TOPICS.map((topic) => (
            <div
              key={topic.title}
              className="flex items-start gap-3 rounded-xl bg-surface-container-low p-4"
            >
              <span className="material-symbols-outlined text-brand-teal">{topic.icon}</span>
              <div>
                <h3 className="text-sm font-semibold text-on-surface">{topic.title}</h3>
                <p className="mt-1 text-xs text-on-surface-variant">{topic.body}</p>
              </div>
            </div>
          ))}
        </div>

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="fx-btn-primary mt-6 flex h-12 w-full items-center justify-center rounded-lg text-base font-bold"
        >
          Email Support
        </a>
      </div>
    </div>
  );
}
