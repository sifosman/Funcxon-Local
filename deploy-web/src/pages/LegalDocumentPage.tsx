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
};

export default function LegalDocumentPage() {
  const { doc } = useParams<{ doc: string }>();
  const document = DOCUMENTS[doc || ''];

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
