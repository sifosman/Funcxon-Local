import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import logoUrl from '../../assets/assets/logo.png';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Venues', href: '/discover?category=venues' },
  { label: 'Vendors', href: '/discover?category=vendors' },
  { label: 'Listers Portal', href: '/listers-portal' },
];

const USER_NAV = [
  { label: 'Quotes', href: '/quotes' },
  { label: 'Planner', href: '/planner' },
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-brand-pink">
      <div className="fx-container flex h-16 items-center justify-between">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logoUrl} alt="Funxon" className="h-10 w-10 object-contain" />
          <span className="font-display text-2xl font-bold text-primary">Funxon</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              to={href}
              className={`text-sm transition-colors ${
                isActive(href)
                  ? 'border-b-2 border-secondary pb-0.5 text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
              
            >
              {label}
            </Link>
          ))}
          {isLoggedIn && USER_NAV.map(({ label, href }) => (
            <Link
              key={label}
              to={href}
              className={`text-sm transition-colors ${
                isActive(href)
                  ? 'border-b-2 border-secondary pb-0.5 text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
              
            >
              {label}
            </Link>
          ))}
          {isLoggedIn && isVendor && VENDOR_NAV.map(({ label, href }) => (
            <Link
              key={label}
              to={href}
              className={`text-sm transition-colors ${
                isActive(href)
                  ? 'border-b-2 border-secondary pb-0.5 text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
              
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* SA Flag icon */}
          <span className="hidden md:flex" title="South Africa">
            <svg width="28" height="20" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg" className="rounded-sm overflow-hidden">
              <rect width="28" height="20" fill="#fff"/>
              <polygon points="0,0 28,0 0,20" fill="#007a4d"/>
              <polygon points="28,20 28,0 0,20" fill="#de3831"/>
              <polygon points="14,10 28,0 28,3 17,10 28,17 28,20" fill="#002395"/>
              <polygon points="14,10 0,0 0,3 11,10 0,17 0,20" fill="#000"/>
              <polygon points="14,10 28,3 28,0 17,10 28,20 28,17" fill="#fff" stroke="#000" strokeWidth="0.5"/>
            </svg>
          </span>

          {isLoggedIn ? (
            <Link
              to="/account"
              className="hidden text-sm font-medium text-on-surface-variant hover:text-primary transition-colors md:block"
            >
              Hi, {username}
            </Link>
          ) : (
            <>
              <Link
                to="/signin"
                className="hidden text-sm font-bold text-primary hover:text-primary-teal transition-colors md:block"
                
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="hidden h-12 items-center justify-center rounded-lg px-6 bg-primary text-white text-sm font-bold hover:bg-primary-teal transition-colors md:flex"
                
              >
                Sign Up
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-on-surface-variant hover:text-primary transition-colors md:hidden"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-border-subtle bg-brand-pink px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {[...NAV_LINKS, ...(isLoggedIn ? USER_NAV : []), ...(isLoggedIn && isVendor ? VENDOR_NAV : [])].map(({ label, href }) => (
              <Link
                key={label}
                to={href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                  isActive(href)
                    ? 'bg-primary-muted text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                {label}
              </Link>
            ))}
            {!isLoggedIn && (
              <div className="mt-3 flex flex-col gap-2 border-t border-outline-variant pt-3">
                <Link to="/signin" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-center text-sm font-bold text-primary">
                  Login
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-bold text-white">
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
