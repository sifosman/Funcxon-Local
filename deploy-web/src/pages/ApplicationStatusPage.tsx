import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Package, Store, AlertCircle, Loader2 } from 'lucide-react';
import { getLatestUserApplication, cancelApplication, type SubscriberApplication, isEditableApplicationStatus } from '../lib/applicationService';
import { useApplicationForm, type ApplicationFormState } from '../context/ApplicationFormContext';

function formatDate(value?: string | null) {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function statusBadgeClasses(status?: string | null) {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized === 'approved') {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
  if (normalized === 'rejected') {
    return 'bg-red-100 text-red-800 border-red-200';
  }
  return 'bg-amber-100 text-amber-800 border-amber-200';
}

function statusLabel(status?: string | null) {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized === 'under_review') return 'Under Review';
  if (normalized === 'needs_changes') return 'Needs Changes';
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Unknown';
}

function getTradingName(app: SubscriberApplication | null) {
  if (!app) return '';
  const details = app.company_details as { tradingName?: string; registeredBusinessName?: string } | null;
  return details?.tradingName || details?.registeredBusinessName || 'Unnamed Business';
}

function getPortfolioTypeLabel(app: SubscriberApplication | null) {
  if (!app?.portfolio_type) return '';
  return app.portfolio_type === 'venue' ? 'Venue' : 'Vendor / Service';
}

export default function ApplicationStatusPage() {
  const navigate = useNavigate();
  const { hydrateForm } = useApplicationForm();
  const [application, setApplication] = useState<SubscriberApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApplication = async () => {
    setLoading(true);
    const result = await getLatestUserApplication();
    if (result.success) {
      setApplication(result.data ?? null);
    } else {
      setError(result.error || 'Failed to load application status.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadApplication();
  }, []);

  const handleCancel = async () => {
    if (!application?.id) return;
    if (!window.confirm('Are you sure you want to cancel your application?')) return;
    setCancelling(true);
    const result = await cancelApplication(application.id);
    setCancelling(false);
    if (result.success) {
      await loadApplication();
    } else {
      setError(result.error || 'Failed to cancel application.');
    }
  };

  const handleUpdate = () => {
    if (!application) return;
    const nextState = {
      editingApplicationId: application.id,
      portfolioType: (application.portfolio_type === 'venue' ? 'venues' : 'vendors') as ApplicationFormState['portfolioType'],
      step1: (application.company_details ?? {}) as ApplicationFormState['step1'],
      step2: (application.service_categories ?? {}) as ApplicationFormState['step2'],
      step3: {
        images: (application.portfolio_images ?? []).map((uri) => ({ uri, name: 'image', type: 'image/jpeg' })),
        videos: (application.portfolio_videos ?? []).map((uri) => ({ uri, name: 'video', type: 'video/mp4' })),
      },
      step4: {
        subscriptionPlan: application.subscription_tier || '',
        billingPeriod: '' as '' | 'monthly' | 'yearly' | '6_month' | '12_month',
        termsAccepted: application.terms_accepted ?? false,
        privacyAccepted: application.privacy_accepted ?? false,
        marketingConsent: application.marketing_consent ?? false,
      },
    };
    hydrateForm(nextState);
    navigate('/apply/step1');
  };

  const status = application?.status;
  const showCancel = status === 'pending' || status === 'under_review';
  const showUpdate = isEditableApplicationStatus(status);

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/subscriber-profile"
          className="mb-4 inline-flex items-center text-sm font-medium hover:underline"
          style={{ color: '#123f5c' }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Subscriber Profile
        </Link>

        <h1
          className="mb-2 text-3xl font-bold"
          style={{ color: '#123f5c' }}
        >
          Application Status
        </h1>
        <p
          className="mb-8 text-sm"
          style={{ color: '#72787e' }}
        >
          Track your listing application and next steps.
        </p>

        {loading && (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div
            className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {!loading && !application && (
          <div className="rounded-2xl border border-outline-variant bg-white p-8 text-center" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
            <p className="mb-6 text-sm text-on-surface-variant" >
              You have not submitted an application yet.
            </p>
            <Link
              to="/listers-portal"
              className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
              
            >
              Start Application
            </Link>
          </div>
        )}

        {!loading && application && (
          <div className="rounded-2xl border border-outline-variant bg-white p-6" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
            <div className="mb-6 flex items-center justify-between">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClasses(status)}`}
                
              >
                {statusLabel(status)}
              </span>
              <span className="text-xs text-on-surface-variant" >
                Submitted {formatDate(application.created_at)}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant" >
                    Trading Name
                  </p>
                  <p className="font-semibold text-on-surface" >
                    {getTradingName(application)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant" >
                    Portfolio Type
                  </p>
                  <p className="font-semibold text-on-surface" >
                    {getPortfolioTypeLabel(application)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant" >
                    Submission Date
                  </p>
                  <p className="font-semibold text-on-surface" >
                    {formatDate(application.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {showUpdate && (
                <button
                  onClick={handleUpdate}
                  className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-white hover:opacity-90"
                  
                >
                  Update Application
                </button>
              )}
              {showCancel && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 rounded-lg border border-outline-variant bg-white py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-60"
                  
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Application'}
                </button>
              )}
              {!showCancel && !showUpdate && (
                <Link
                  to="/subscriber-profile"
                  className="flex-1 rounded-lg bg-primary py-3 text-center text-sm font-semibold text-white hover:opacity-90"
                  
                >
                  Back to Profile
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
