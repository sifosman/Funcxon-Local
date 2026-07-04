import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import logoUrl from '../../assets/assets/logo.png';
import NotificationBell from './NotificationBell';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Venues', href: '/discover?category=venues' },
  { label: 'Vendors', href: '/discover?category=vendors' },
  { label: "Listers Portal", href: '/listers-portal' },
];

const USER_NAV = [
  { label: 'Planner', href: '/planner' },
  { label: 'My Bookings', href: '/my-tours' },
  { label: 'Account', href: '/account' },
];

const VENDOR_NAV = [
  { label: 'Subscriber Suite', href: '/subscriber-suite' },
  { label: 'Vendor Dashboard', href: '/vendor-dashboard' },
];

export default function WebHeader() {
  const { user, session, userRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const username = user?.user_metadata?.display_name
    || user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || null;

  const isLoggedIn = !!session;
  const isVendor = userRole === 'vendor';

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href.split('?')[0]);

  const allNavLinks = [
    ...NAV_LINKS,
    ...(isLoggedIn ? USER_NAV : []),
    ...(isLoggedIn && isVendor ? VENDOR_NAV : []),
  ];

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border-subtle"
      style={{ backgroundColor: '#f7f5f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="fx-container flex h-16 items-center justify-between gap-4">

        {/* Brand — logo only, no redundant text */}
        <Link to="/" className="flex flex-shrink-0 items-center gap-2.5">
          <img
            src={logoUrl}
            alt="Funxon"
            className="h-11 w-auto object-contain"
            style={{ maxHeight: '44px' }}
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              to={href}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                isActive(href)
                  ? 'bg-primary-muted font-semibold text-primary'
                  : 'font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
              }`}
            >
              {label}
            </Link>
          ))}
          {isLoggedIn && USER_NAV.map(({ label, href }) => (
            <Link
              key={label}
              to={href}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                isActive(href)
                  ? 'bg-primary-muted font-semibold text-primary'
                  : 'font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
              }`}
            >
              {label}
            </Link>
          ))}
          {isLoggedIn && isVendor && VENDOR_NAV.map(({ label, href }) => (
            <Link
              key={label}
              to={href}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                isActive(href)
                  ? 'bg-primary-muted font-semibold text-primary'
                  : 'font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex flex-shrink-0 items-center gap-3">
          {/* App icon — replaces SA flag */}
          <img
            src="/adaptive-icon.png"
            alt="Funxon SA"
            className="h-8 w-8 rounded-full object-cover"
            title="South Africa"
          />

          {isLoggedIn && <NotificationBell />}

          {isLoggedIn ? (
            <Link
              to="/account"
              className="hidden items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-on-surface-variant shadow-sm transition-colors hover:text-primary md:flex"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">person</span>
              <span className="max-w-[120px] truncate">Hi, {username}</span>
            </Link>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/signin"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-muted"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-teal"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-primary transition-colors hover:bg-surface-container-high lg:hidden"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-[24px]">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="border-t border-border-subtle px-4 pb-6 pt-2 lg:hidden"
          style={{ backgroundColor: '#f7f5f0' }}
        >
          {/* Mobile brand row with icon */}
          <div className="mb-3 flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/adaptive-icon.png"
                alt="Funxon SA"
                className="h-8 w-8 rounded-full object-cover"
              />
              <img src={logoUrl} alt="Funxon" className="h-9 w-auto object-contain" />
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {allNavLinks.map(({ label, href }) => (
              <Link
                key={label}
                to={href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive(href)
                    ? 'bg-primary-muted text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {!isLoggedIn && (
            <div className="mt-4 flex flex-col gap-2.5 border-t border-border-subtle pt-4">
              <Link
                to="/signin"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg border border-primary px-4 py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-primary-muted"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-teal"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
