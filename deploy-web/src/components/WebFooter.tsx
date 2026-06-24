import { Link } from 'react-router-dom';

export default function WebFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-surface-container-lowest" style={{ borderColor: '#f7f5f0' }}>
      <div className="fx-container py-16">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Brand */}
          <div
            className="text-2xl font-bold text-secondary-container"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Funxon
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {[
              { label: 'About Us', href: '/about' },
              { label: 'Venues', href: '/discover?category=venues' },
              { label: 'Vendors', href: '/discover?category=vendors' },
              { label: 'Contact Support', href: '/contact' },
              { label: 'Privacy Policy', href: '/legal/privacy' },
              { label: 'Terms of Service', href: '/terms' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                to={href}
                className="text-xs font-medium text-on-surface-variant transition-colors hover:text-secondary-container focus:text-primary focus:outline-none"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Copyright */}
        <div
          className="mt-8 border-t pt-8 text-center text-xs text-on-surface-variant"
          style={{ borderColor: '#f7f5f0', fontFamily: "'Montserrat', sans-serif" }}
        >
          © {currentYear} Funxon Event Planning. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
