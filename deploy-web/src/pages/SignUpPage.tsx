import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

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
    setLoading(true);

    const { error } = await signUp({
      email,
      password,
      data: { display_name: name, full_name: name },
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

            <button type="submit" disabled={loading} className="fx-btn-primary w-full disabled:opacity-50">
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/signin" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
