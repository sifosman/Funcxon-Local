import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Search, Heart, FileText, CalendarDays, User } from 'lucide-react';

const TABS = [
  { label: 'Search', href: '/', icon: Search },
  { label: 'Favourites', href: '/account/favourites', icon: Heart },
  { label: 'Quotes', href: '/quotes', icon: FileText },
  { label: 'Planner', href: '/planner', icon: CalendarDays },
  { label: 'Account', href: '/account', icon: User },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { session } = useAuth();

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around lg:hidden"
      style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #f7f5f0',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {TABS.map(({ label, href, icon: Icon }) => {
        const active = isActive(href);
        const requiresAuth = label !== 'Search';
        const showTab = session || !requiresAuth;

        if (!showTab) {
          return (
            <Link
              key={label}
              to="/signin"
              className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} className="text-gray-400" />
              <span className="text-[10px] font-medium text-gray-400">{label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={label}
            to={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
          >
            <Icon
              size={20}
              strokeWidth={active ? 2.5 : 1.8}
              className={active ? 'text-primary' : 'text-gray-400'}
            />
            <span
              className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-gray-400'}`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
