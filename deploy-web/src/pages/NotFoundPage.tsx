import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <div className="text-center">
        <h1 className="font-display text-6xl font-bold text-primary">404</h1>
        <h2 className="mt-4 font-display text-2xl font-bold text-on-surface">Page not found</h2>
        <p className="mt-2 text-on-surface-variant">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={() => window.history.back()} className="fx-btn-ghost border border-outline-variant">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </button>
          <Link to="/" className="fx-btn-primary">
            <Home className="mr-2 h-4 w-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
