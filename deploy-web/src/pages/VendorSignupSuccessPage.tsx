import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Mail, User, Package, Calendar } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useApplicationForm } from '../context/ApplicationFormContext';
import { getLatestUserApplication } from '../lib/applicationService';

export default function VendorSignupSuccessPage() {
  const { user } = useAuth();
  const { state } = useApplicationForm();
  const [tierName, setTierName] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const result = await getLatestUserApplication();
      if (result.success && result.data) {
        setTierName(result.data.subscription_tier || '');
      }
    };
    load();
  }, []);

  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const productType = state.portfolioType === 'venues' ? 'Venue' : state.portfolioType === 'vendors' ? 'Vendor / Service' : '';

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-lg">
        <div
          className="rounded-2xl border border-outline-variant bg-white p-8 text-center"
          style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
        >
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#D1FAE5' }}>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>

          <h1
            className="mb-2 text-2xl font-bold"
            style={{ color: '#123f5c' }}
          >
            Application Submitted
          </h1>
          <p
            className="mb-8 text-sm"
            style={{ color: '#72787e' }}
          >
            Thank you for applying. We will review your submission and be in touch.
          </p>

          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-on-surface-variant" />
              <div>
                <p className="text-xs text-on-surface-variant" >Email</p>
                <p className="text-sm font-semibold" >{user?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-on-surface-variant" />
              <div>
                <p className="text-xs text-on-surface-variant" >Full Name</p>
                <p className="text-sm font-semibold" >{displayName || 'N/A'}</p>
              </div>
            </div>

            {productType && (
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-on-surface-variant" />
                <div>
                  <p className="text-xs text-on-surface-variant" >Product Type</p>
                  <p className="text-sm font-semibold" >{productType}</p>
                </div>
              </div>
            )}

            {tierName && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-on-surface-variant" />
                <div>
                  <p className="text-xs text-on-surface-variant" >Tier</p>
                  <p className="text-sm font-semibold" >{tierName}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/apply/status"
              className="flex-1 rounded-lg bg-primary py-3 text-center text-sm font-semibold text-white hover:opacity-90"
              
            >
              View Application Status
            </Link>
            <Link
              to="/account"
              className="flex-1 rounded-lg border border-outline-variant bg-white py-3 text-center text-sm font-semibold text-on-surface hover:bg-surface-container-low"
              
            >
              Go to Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
