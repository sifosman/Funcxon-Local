import { Link } from 'react-router-dom';
import { Calendar, Search, Users, Sparkles, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: Search, title: 'Discover', desc: 'Browse top venues and vendors across South Africa.' },
  { icon: Calendar, title: 'Plan', desc: 'Budget, checklist, and timeline tools for your event.' },
  { icon: Users, title: 'Connect', desc: 'Request quotes and book tours with one click.' },
];

export default function WelcomePage() {
  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
            <Sparkles className="h-8 w-8" />
          </div>
        </div>
        <h1 className="font-display text-4xl font-bold text-on-surface md:text-5xl">Welcome to Funxon</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-on-surface-variant">
          Your all-in-one platform to plan, connect, and celebrate the perfect South African event.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/discover" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white">
            Start Exploring <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/listers-portal" className="inline-flex items-center gap-2 rounded-lg border border-border-subtle px-6 py-3 text-sm font-bold text-on-surface hover:bg-surface-container">
            I'm a Lister
          </Link>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {FEATURES.map(feature => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="rounded-xl bg-white p-6 shadow-sm border border-outline-variant">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-muted mx-auto">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-on-surface">{feature.title}</h3>
                <p className="mt-2 text-sm text-on-surface-variant">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
