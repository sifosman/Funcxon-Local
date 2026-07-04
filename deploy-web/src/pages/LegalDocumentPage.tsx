import { useParams, Link } from 'react-router-dom';

const DOCUMENTS: Record<string, { title: string; content: string }> = {
  privacy: {
    title: 'Privacy Policy',
    content: `Funxon respects your privacy. This policy explains how we collect, use, and protect your personal information.

1. Information We Collect
We collect information you provide directly, such as name, email, and phone number, as well as usage data.

2. How We Use Your Information
We use your information to provide and improve our services, process transactions, and communicate with you.

3. Data Security
We implement appropriate technical and organizational measures to protect your personal data.

4. Third-Party Sharing
We do not sell your personal information. We may share data with service providers who assist in operating our platform.

5. Your Rights
You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.

6. Cookies
We use cookies to enhance your browsing experience and analyze site traffic.`,
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    content: `Funxon respects your privacy. This policy explains how we collect, use, and protect your personal information.

1. Information We Collect
We collect information you provide directly, such as name, email, and phone number, as well as usage data.

2. How We Use Your Information
We use your information to provide and improve our services, process transactions, and communicate with you.

3. Data Security
We implement appropriate technical and organizational measures to protect your personal data.

4. Third-Party Sharing
We do not sell your personal information. We may share data with service providers who assist in operating our platform.

5. Your Rights
You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.

6. Cookies
We use cookies to enhance your browsing experience and analyze site traffic.`,
  },
  terms: {
    title: 'Terms & Conditions',
    content: `Welcome to Funxon. By using our platform, you agree to the following terms and conditions.

1. Acceptance of Terms
By accessing or using Funxon, you agree to be bound by these Terms & Conditions and our Privacy Policy.

2. Use of the Platform
Funxon provides a marketplace connecting event planners with venues and vendors. You agree to use the platform lawfully and not to misuse, disrupt, or attempt to gain unauthorized access to any part of the service.

3. Listings and Content
Listers are responsible for the accuracy of their listings, including pricing, availability, and descriptions. Funxon reserves the right to remove listings that are misleading or violate our policies.

4. Bookings and Payments
Transactions between users and listers are governed by the terms agreed between those parties. Funxon facilitates discovery and connection but is not a party to any booking contract unless explicitly stated.

5. Subscriptions
Paid subscription plans grant listers access to enhanced features. Subscription fees are billed according to the selected plan and billing period. Refunds are handled on a case-by-case basis.

6. Limitation of Liability
Funxon is provided "as is" without warranties of any kind. We are not liable for indirect, incidental, or consequential damages arising from the use of our platform.

7. Termination
We may suspend or terminate accounts that violate these terms. You may delete your account at any time from Account settings.

8. Changes to These Terms
We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms.

9. Contact
For questions about these terms, contact us at support@funxon.co.za.`,
  },
  'terms-and-conditions': {
    title: 'Terms & Conditions',
    content: `Welcome to Funxon. By using our platform, you agree to the following terms and conditions.

1. Acceptance of Terms
By accessing or using Funxon, you agree to be bound by these Terms & Conditions and our Privacy Policy.

2. Use of the Platform
Funxon provides a marketplace connecting event planners with venues and vendors. You agree to use the platform lawfully and not to misuse, disrupt, or attempt to gain unauthorized access to any part of the service.

3. Listings and Content
Listers are responsible for the accuracy of their listings, including pricing, availability, and descriptions. Funxon reserves the right to remove listings that are misleading or violate our policies.

4. Bookings and Payments
Transactions between users and listers are governed by the terms agreed between those parties. Funxon facilitates discovery and connection but is not a party to any booking contract unless explicitly stated.

5. Subscriptions
Paid subscription plans grant listers access to enhanced features. Subscription fees are billed according to the selected plan and billing period. Refunds are handled on a case-by-case basis.

6. Limitation of Liability
Funxon is provided "as is" without warranties of any kind. We are not liable for indirect, incidental, or consequential damages arising from the use of our platform.

7. Termination
We may suspend or terminate accounts that violate these terms. You may delete your account at any time from Account settings.

8. Changes to These Terms
We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms.

9. Contact
For questions about these terms, contact us at support@funxon.co.za.`,
  },
};

export default function LegalDocumentPage() {
  const { document: docParam } = useParams<{ document: string }>();
  const document = DOCUMENTS[docParam || ''];

  if (!document) {
    return (
      <div className="fx-container py-20 text-center">
        <h2 className="font-display text-xl font-bold text-on-surface">Document not found</h2>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <Link to="/terms" className="text-sm text-primary hover:underline">Back to Terms & Policies</Link>
        <h1 className="mt-4 font-display text-3xl font-bold text-on-surface">{document.title}</h1>
        <div className="mt-8 whitespace-pre-line text-on-surface-variant">{document.content}</div>
      </div>
    </div>
  );
}
