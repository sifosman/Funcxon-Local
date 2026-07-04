import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import logoUrl from '../../assets/assets/logo.png';

export default function SubscriberLoginPage() {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/subscriber-profile');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const { error: signInError } = await signIn({ email, password });
    setLoading(false);

    if (signInError) {
      setError(signInError.message || 'Failed to sign in. Please check your credentials.');
      return;
    }

    navigate('/subscriber-profile');
  };

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-md">
        <Link
          to="/"
          className="mb-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Home
        </Link>

        <div className="rounded-2xl border border-outline-variant bg-white p-8 shadow-sm">
          <div className="mb-4 flex justify-center">
            <img src={logoUrl} alt="Funxon" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="mb-2 text-center text-2xl font-bold text-primary">
            Subscriber Portal
          </h1>
          <p className="mb-6 text-sm text-on-surface-variant">
            Access your business profile and manage your listings
          </p>

          {error && (
            <div
              className="mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error-container/30 p-3 text-sm text-error"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Email
              </label>
              <div className="flex items-center rounded-lg border border-outline-variant px-3">
                <Mail className="h-4 w-4 text-on-surface-variant" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border-none bg-transparent px-3 py-3 text-sm text-on-surface focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Password
              </label>
              <div className="flex items-center rounded-lg border border-outline-variant px-3">
                <Lock className="h-4 w-4 text-on-surface-variant" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-none bg-transparent px-3 py-3 text-sm text-on-surface focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="text-on-surface-variant"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link
                to="/signin"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="fx-btn-primary w-full disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <Link
              to="/portfolio-type"
              className="block w-full rounded-lg border border-outline-variant bg-white py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-surface-container-low"
            >
              Register your venue
            </Link>
            <Link
              to="/portfolio-type"
              className="block w-full rounded-lg border border-outline-variant bg-white py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-surface-container-low"
            >
              Register your vendor/service business
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-on-surface-variant">
            Login to access your subscriber profile, create portfolios, and manage your business listings.
          </p>
        </div>
      </div>
    </div>
  );
}
