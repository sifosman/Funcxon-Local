import { useState } from 'react';
import type { ElementType } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Wrench, AlertCircle } from 'lucide-react';
import { useApplicationForm } from '../context/ApplicationFormContext';
import { getLatestUserApplicationByType, isBlockingApplicationStatus } from '../lib/applicationService';

interface PortfolioCard {
  id: 'venues' | 'vendors';
  title: string;
  description: string;
  icon: ElementType;
}

const PORTFOLIO_TYPES: PortfolioCard[] = [
  {
    id: 'venues',
    title: 'Venue',
    description: 'List your venue, hall, or event space',
    icon: Store,
  },
  {
    id: 'vendors',
    title: 'Vendor / Service',
    description: 'Offer your event services and products',
    icon: Wrench,
  },
];

export default function PortfolioTypePage() {
  const navigate = useNavigate();
  const { setPortfolioType, resetForm } = useApplicationForm();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (type: 'venues' | 'vendors') => {
    setChecking(true);
    setError(null);

    try {
      const result = await getLatestUserApplicationByType(type === 'venues' ? 'venue' : 'vendor');
      const app = result.success ? result.data : null;
      if (app && isBlockingApplicationStatus(app.status)) {
        navigate('/apply/status');
        return;
      }

      resetForm();
      setPortfolioType(type);
      navigate('/apply/step1');
    } catch (err) {
      console.error('Portfolio type selection error:', err);
      setError('Could not verify your applications. Please try again.');
    } finally {
      setChecking(false);
    }
  };

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
          Choose Portfolio Type
        </h1>
        <p
          className="mb-8 text-sm"
          style={{ color: '#72787e' }}
        >
          What kind of business would you like to list on Funxon?
        </p>

        {error && (
          <div
            className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {PORTFOLIO_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => handleSelect(type.id)}
                disabled={checking}
                className="flex flex-col items-center rounded-2xl border border-outline-variant bg-white p-8 text-center transition-all hover:scale-[1.01] hover:border-primary disabled:opacity-60"
                style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
              >
                <div
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#f2f7ff' }}
                >
                  <Icon className="h-8 w-8" style={{ color: '#123f5c' }} />
                </div>
                <h2
                  className="mb-2 text-xl font-bold"
                  style={{ color: '#123f5c' }}
                >
                  {type.title}
                </h2>
                <p
                  className="text-sm"
                  style={{ color: '#72787e' }}
                >
                  {type.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
