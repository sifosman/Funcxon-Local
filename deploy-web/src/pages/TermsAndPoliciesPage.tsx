import { Link } from 'react-router-dom';

export default function TermsAndPoliciesPage() {
  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-on-surface">Terms & Policies</h1>
        <p className="mt-4 text-on-surface-variant">Last updated: 1 July 2026</p>

        <div className="mt-8 space-y-8">
          <section>
            <h2 className="font-display text-xl font-semibold text-on-surface">1. Acceptance of Terms</h2>
            <p className="mt-2 text-on-surface-variant">By accessing or using Funxon, you agree to be bound by these Terms. If you do not agree, please do not use the platform.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-on-surface">2. User Accounts</h2>
            <p className="mt-2 text-on-surface-variant">You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-on-surface">3. Listings and Content</h2>
            <p className="mt-2 text-on-surface-variant">Users who post listings are responsible for the accuracy of their content. Funxon reserves the right to remove content that violates our policies.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-on-surface">4. Payments</h2>
            <p className="mt-2 text-on-surface-variant">Subscription fees are billed in advance. Cancellations take effect at the end of the current billing period.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-on-surface">5. Limitation of Liability</h2>
            <p className="mt-2 text-on-surface-variant">Funxon is a marketplace connecting users with venues and vendors. We are not responsible for the quality of services provided by third parties.</p>
          </section>
        </div>

        <div className="mt-8">
          <Link to="/legal/privacy" className="text-primary hover:underline">View Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
