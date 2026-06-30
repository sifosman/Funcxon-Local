import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';

export default function EmailConfirmationPage() {
  return (
    <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm border border-border-subtle">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-muted">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-on-surface">Check your email</h1>
        <p className="mt-3 text-on-surface-variant">
          We've sent you a confirmation link. Please click it to verify your email address and complete your registration.
        </p>
        <Link to="/signin" className="mt-6 inline-flex items-center gap-1 text-primary hover:underline">
          Go to sign in <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
