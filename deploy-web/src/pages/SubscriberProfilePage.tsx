import { Link } from 'react-router-dom';
import type { ElementType } from 'react';
import { ArrowLeft, UserPlus, Edit, CheckSquare, Calendar, ChevronRight } from 'lucide-react';

interface ProfileOption {
  id: string;
  title: string;
  description: string;
  icon: ElementType;
  href?: string;
  onClick?: () => void;
  iconColor: string;
  iconBg: string;
}

const PROFILE_OPTIONS: ProfileOption[] = [
  {
    id: 'create-portfolio',
    title: 'Create Portfolio',
    description: 'Set up a new vendor, service provider, or venue portfolio',
    icon: UserPlus,
    href: '/portfolio-type',
    iconColor: '#10B981',
    iconBg: '#D1FAE5',
  },
  {
    id: 'update-portfolio',
    title: 'Update Portfolio',
    description: 'Update and manage your existing portfolio listings',
    icon: Edit,
    href: '/portfolio/update',
    iconColor: '#3B82F6',
    iconBg: '#DBEAFE',
  },
  {
    id: 'action-items',
    title: 'Action Items',
    description: 'View and manage your pending tasks and to-dos',
    icon: CheckSquare,
    href: '/vendor/action-items',
    iconColor: '#F59E0B',
    iconBg: '#FEF3C7',
  },
  {
    id: 'calendar-updates',
    title: 'Calendar Updates',
    description: 'Check your schedule and upcoming events',
    icon: Calendar,
    href: '/vendor/calendar',
    iconColor: '#8B5CF6',
    iconBg: '#EDE9FE',
  },
];

export default function SubscriberProfilePage() {
  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/account"
          className="mb-4 inline-flex items-center text-sm font-medium hover:underline"
          style={{ color: '#123f5c' }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to My Account
        </Link>

        <div className="mb-8 text-center">
          <h1
            className="mb-2 text-3xl font-bold"
            style={{ color: '#123f5c' }}
          >
            Welcome Back!
          </h1>
          <p
            className="text-sm"
            style={{ color: '#72787e' }}
          >
            What would you like to do today?
          </p>
        </div>

        <div
          className="overflow-hidden rounded-2xl border border-outline-variant bg-white"
          style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
        >
          {PROFILE_OPTIONS.map((option, index) => {
            const Icon = option.icon;
            const content = (
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: option.iconBg }}
                  >
                    <Icon className="h-5 w-5" style={{ color: option.iconColor }} />
                  </div>
                  <div>
                    <p
                      className="font-semibold text-on-surface"
                      
                    >
                      {option.title}
                    </p>
                    <p
                      className="text-xs text-on-surface-variant"
                      
                    >
                      {option.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-on-surface-variant" />
              </div>
            );

            return option.href ? (
              <Link
                key={option.id}
                to={option.href}
                className="block transition-colors hover:bg-surface-container-low"
                style={{
                  borderBottom: index < PROFILE_OPTIONS.length - 1 ? '1px solid #f7f5f0' : 'none',
                }}
              >
                {content}
              </Link>
            ) : (
              <button
                key={option.id}
                onClick={option.onClick}
                className="block w-full text-left transition-colors hover:bg-surface-container-low"
                style={{
                  borderBottom: index < PROFILE_OPTIONS.length - 1 ? '1px solid #f7f5f0' : 'none',
                }}
              >
                {content}
              </button>
            );
          })}
        </div>

        <div
          className="mt-8 rounded-2xl p-6"
          style={{ backgroundColor: '#f2f7ff' }}
        >
          <p className="text-center text-sm text-on-surface-variant">
            Create a new profile to list your services, or edit your existing portfolio to update your information.
          </p>
        </div>
      </div>
    </div>
  );
}
