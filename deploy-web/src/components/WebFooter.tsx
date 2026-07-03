import { Link, useLocation } from 'react-router-dom';
import {
  MessageCircle,
  Mail,
  HelpCircle,
  Headset,
  Bug,
  Gavel,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from '../utils/env';
import logoUrl from '../../assets/assets/logo.png';

const APP_LINKS = [
  { label: 'Search', href: '/' },
  { label: 'Favourites', href: '/account/favourites' },
  { label: 'Quotes', href: '/quotes' },
  { label: 'Planner', href: '/planner' },
  { label: 'Account', href: '/account' },
];

const SUPPORT_LINKS = [
  { label: "FAQ's", href: '#', icon: HelpCircle, onClick: () => alert('FAQs page coming soon!') },
  { label: 'Help Desk', href: '#', icon: Headset, onClick: () => handleEmail('Support request') },
  { label: 'Report a Problem', href: '#', icon: Bug, onClick: () => handleEmail('Problem Report - Funxon') },
];

const COMPANY_LINKS = [
  { label: 'About Us', href: '/blog' },
  { label: 'Venues', href: '/discover?category=venues' },
  { label: 'Vendors', href: '/discover?category=vendors' },
  { label: 'Privacy Policy', href: '/legal/privacy' },
  { label: 'Terms & Conditions', href: '/legal/terms' },
];

function handleEmail(subject: string) {
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export default function WebFooter() {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const { session } = useAuth();

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  const whatsappNumber = String(SUPPORT_WHATSAPP).replace(/[^0-9+]/g, '');
  const whatsappMessage = encodeURIComponent('Hi, I need assistance with Funxon.');
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <footer className="w-full border-t border-border-subtle bg-white">
      <div className="fx-container py-14 lg:py-20">
        {/* Top section */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand + contact */}
          <div className="lg:col-span-5">
            <Link to="/" className="inline-block">
              <img
                src={logoUrl}
                alt="Funxon"
                className="h-14 w-auto object-contain md:h-16"
              />
            </Link>
            <p className="mt-3 font-display text-lg italic text-primary">
              Connect Collaborate Celebrate
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-on-surface-variant">
              Your trusted partner in planning unforgettable events. Discover venues, connect
              with vendors, and celebrate every moment.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <MessageCircle size={18} />
                Chat via WhatsApp
                <ArrowUpRight
                  size={14}
                  className="opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
              <button
                onClick={() => handleEmail('Support request')}
                className="group inline-flex items-center justify-center gap-3 rounded-full border border-border-subtle bg-white px-5 py-3 text-sm font-semibold text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <Mail size={18} />
                Email Support
                <ArrowUpRight
                  size={14}
                  className="opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </button>
            </div>
          </div>

          {/* App links */}
          <div className="lg:col-span-2 lg:col-start-7">
            <h4 className="text-xs font-bold uppercase tracking-wider text-outline">App</h4>
            <nav className="mt-5 flex flex-col gap-3">
              {APP_LINKS.map(({ label, href }) => {
                const active = isActive(href);
                const requiresAuth = label !== 'Search';
                const destination = session || !requiresAuth ? href : '/signin';

                return (
                  <Link
                    key={label}
                    to={destination}
                    className={`group inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                      active ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    <ChevronRight
                      size={14}
                      className="text-outline transition-transform group-hover:translate-x-0.5"
                    />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Support links */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-outline">Support</h4>
            <nav className="mt-5 flex flex-col gap-3">
              {SUPPORT_LINKS.map(({ label, href, icon: Icon, onClick }) => (
                <Link
                  key={label}
                  to={href}
                  onClick={(e) => {
                    if (onClick) {
                      e.preventDefault();
                      onClick();
                    }
                  }}
                  className="group inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
                >
                  <Icon size={14} className="text-outline" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Company / Legal */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-outline">Company</h4>
            <nav className="mt-5 flex flex-col gap-3">
              {COMPANY_LINKS.map(({ label, href }) => (
                <Link
                  key={label}
                  to={href}
                  className="group inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
                >
                  <ChevronRight
                    size={14}
                    className="text-outline transition-transform group-hover:translate-x-0.5"
                  />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border-subtle pt-8 lg:mt-16 lg:flex-row">
          <p className="text-xs text-outline">
            © {currentYear} Funxon Event Planning. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              to="/legal/privacy"
              className="text-xs font-medium text-outline transition-colors hover:text-primary"
            >
              Privacy Policy
            </Link>
            <Link
              to="/legal/terms"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-outline transition-colors hover:text-primary"
            >
              <Gavel size={14} />
              Terms & Policies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
