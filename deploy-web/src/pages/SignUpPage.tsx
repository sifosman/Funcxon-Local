import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import logoUrl from '../../assets/assets/logo.png';

const ROLES = [
  { value: 'attendee', label: 'Attendee', desc: 'Browse and book venues & vendors' },
  { value: 'vendor', label: 'Vendor & Service Provider', desc: 'List your services and get clients' },
  { value: 'venue', label: 'Venue', desc: 'List your venue for event planners' },
] as const;

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<string>('attendee');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const { signUp, signInWithProvider } = useAuth();

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setOauthLoading(provider);
    setError('');
    const { error: oauthError } = await signInWithProvider(provider);
    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(null);
    }
  };

  const getPasswordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (pwd.length === 0) return { label: '', color: 'transparent', width: '0%' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: 'Weak', color: '#de3831', width: '25%' };
    if (score <= 2) return { label: 'Fair', color: '#e8a838', width: '50%' };
    if (score <= 3) return { label: 'Good', color: '#007a4d', width: '75%' };
    return { label: 'Strong', color: '#007a4d', width: '100%' };
  };

  const pwdStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptTerms) {
      setError('Please accept the Terms & Conditions to continue.');
      return;
    }
    if (!acceptPrivacy) {
      setError('Please accept the Privacy Policy (POPIA) to continue.');
      return;
    }
    setLoading(true);

    const { error } = await signUp({
      email,
      password,
      data: { name, role },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm border border-outline-variant text-center">
          <h2 className="font-display text-2xl font-bold text-on-surface">Check your email</h2>
          <p className="mt-4 text-on-surface-variant">
            We've sent a confirmation link to <strong>{email}</strong>. Please click it to verify your account.
          </p>
          <Link to="/signin" className="mt-6 inline-block text-primary hover:underline">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white p-8 shadow-sm border border-outline-variant">
          <div className="text-center">
            <img src={logoUrl} alt="Funxon" className="mx-auto mb-4 h-16 w-16 object-contain" />
            <h1 className="font-display text-2xl font-bold text-on-surface">Create account</h1>
            <p className="mt-2 text-sm text-on-surface-variant">Join Funxon and start planning</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-error">{error}</div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="fx-input pl-10" placeholder="Your name" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="fx-input pl-10" placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="fx-input pl-10 pr-10" placeholder="Min 6 characters" minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: pwdStrength.width, background: pwdStrength.color }} />
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant">Password strength: <span className="font-semibold" style={{ color: pwdStrength.color }}>{pwdStrength.label}</span></p>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="fx-input pl-10 pr-10" placeholder="Re-enter password" minLength={6} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="mt-1 text-xs text-error">Passwords do not match</p>
              )}
            </div>

            {/* Role selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-on-surface">I am a...</label>
              <div className="space-y-2">
                {ROLES.map(r => (
                  <label
                    key={r.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${role === r.value ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/50'}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={role === r.value}
                      onChange={e => setRole(e.target.value)}
                      className="h-4 w-4 accent-primary"
                    />
                    <div>
                      <span className="block text-sm font-semibold text-on-surface">{r.label}</span>
                      <span className="block text-xs text-on-surface-variant">{r.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={e => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span className="text-xs text-on-surface-variant">
                  I agree to the{' '}
                  <Link to="/legal/terms" className="font-medium text-primary hover:underline">Terms &amp; Conditions</Link>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={e => setAcceptPrivacy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span className="text-xs text-on-surface-variant">
                  I agree to the{' '}
                  <Link to="/legal/privacy" className="font-medium text-primary hover:underline">Privacy Policy (POPIA)</Link>
                </span>
              </label>
            </div>

            <button type="submit" disabled={loading} className="fx-btn-primary w-full disabled:opacity-50">
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium text-on-surface-variant">OR</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={oauthLoading !== null}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
            >
              {oauthLoading === 'google' ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Sign up with Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('facebook')}
              disabled={oauthLoading !== null}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#1877F2] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#166FE5] disabled:opacity-50"
            >
              {oauthLoading === 'facebook' ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              Sign up with Facebook
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/signin" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
