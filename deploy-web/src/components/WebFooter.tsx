import { Link } from 'react-router-dom';

export default function WebFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border-subtle bg-brand-pink">
      <div className="fx-container py-16">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Brand */}
          <div className="font-display text-2xl font-bold text-primary">
            Funxon
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {[
              { label: 'About Us', href: '/blog' },
              { label: 'Venues', href: '/discover?category=venues' },
              { label: 'Vendors', href: '/discover?category=vendors' },
              { label: 'Contact Support', href: 'mailto:support@funxon.co.za' },
              { label: 'Privacy Policy', href: '/legal/privacy' },
              { label: 'Terms of Service', href: '/terms' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                to={href}
                className="text-xs font-medium text-on-surface-variant transition-colors hover:text-primary focus:text-primary focus:outline-none"
                
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Copyright */}
        <div
          className="mt-8 border-t border-border-subtle pt-8 text-center text-xs text-on-surface-variant"
        >
          © {currentYear} Funxon Event Planning. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
