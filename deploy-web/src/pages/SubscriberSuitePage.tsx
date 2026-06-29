import { Link } from 'react-router-dom';
import type { ElementType } from 'react';
import { ArrowLeft, Briefcase, Headphones, FileText, BarChart3, ChevronRight } from 'lucide-react';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: ElementType;
  href: string;
  iconColor: string;
  iconBg: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'portfolio-profile',
    title: 'Portfolio Profile',
    description: 'Access your subscriber portal and manage your listings',
    icon: Briefcase,
    href: '/portfolio/profile',
    iconColor: '#123f5c',
    iconBg: '#f2f7ff',
  },
  {
    id: 'portfolio-assistance',
    title: 'Portfolio Assistance',
    description: 'Get expert help with your portfolio creation and optimization',
    icon: Headphones,
    href: '/portfolio/assistance',
    iconColor: '#8B5CF6',
    iconBg: '#F3E8FF',
  },
  {
    id: 'subscriber-legal-terms',
    title: 'Subscriber Legal Terms',
    description: 'Review terms, privacy policy, and data processing agreement',
    icon: FileText,
    href: '/terms',
    iconColor: '#6366F1',
    iconBg: '#EEF2FF',
  },
  {
    id: 'activity-dashboard',
    title: 'Activity Dashboard',
    description: 'View your performance metrics and analytics',
    icon: BarChart3,
    href: '/activity-dashboard',
    iconColor: '#8B5CF6',
    iconBg: '#F5F3FF',
  },
];

export default function SubscriberSuitePage() {
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

        <h1
          className="mb-2 text-3xl font-bold"
          style={{ color: '#123f5c' }}
        >
          Subscriber Suite
        </h1>
        <p
          className="mb-8 text-sm"
          style={{ color: '#72787e' }}
        >
          Manage your business listings and subscriber profile
        </p>

        <div
          className="overflow-hidden rounded-2xl border border-outline-variant bg-white"
          style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
        >
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.href}
                className="flex items-center justify-between p-5 transition-colors hover:bg-surface-container-low"
                style={{
                  borderBottom: index < MENU_ITEMS.length - 1 ? '1px solid #f7f5f0' : 'none',
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: item.iconBg }}
                  >
                    <Icon className="h-5 w-5" style={{ color: item.iconColor }} />
                  </div>
                  <div>
                    <p
                      className="font-semibold text-on-surface"
                      
                    >
                      {item.title}
                    </p>
                    <p
                      className="text-xs text-on-surface-variant"
                      
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-on-surface-variant" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
