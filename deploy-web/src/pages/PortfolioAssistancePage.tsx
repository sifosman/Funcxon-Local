import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Lightbulb, Camera, FileText, Star } from 'lucide-react';

const tips = [
  {
    icon: Camera,
    title: 'Use high-quality photos',
    description: 'Upload clear, well-lit images that showcase your space or services. Good photos are the first thing potential clients notice.',
  },
  {
    icon: FileText,
    title: 'Keep your description up to date',
    description: 'Your business description should be current, accurate, and at least 50 characters long. Include what makes you unique.',
  },
  {
    icon: Star,
    title: 'Encourage reviews',
    description: 'Positive reviews build trust. Ask happy clients to leave a review on your Funxon profile.',
  },
  {
    icon: Lightbulb,
    title: 'Select the right categories',
    description: 'Choose event types and service categories that match your offering so clients can find you easily.',
  },
];

export default function PortfolioAssistancePage() {
  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/subscriber-suite"
          className="mb-4 inline-flex items-center text-sm font-medium hover:underline"
          style={{ color: '#123f5c' }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Subscriber Suite
        </Link>

        <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>
          Portfolio Assistance
        </h1>
        <p className="mb-8 text-sm" style={{ color: '#72787e' }}>
          Tips and guidance to help your portfolio stand out and attract more bookings.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {tips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <div
                key={index}
                className="rounded-2xl border border-outline-variant bg-white p-6"
                style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: '#f2f7ff' }}>
                  <Icon className="h-6 w-6" style={{ color: '#123f5c' }} />
                </div>
                <h3 className="mb-2 font-bold" style={{ color: '#123f5c' }}>
                  {tip.title}
                </h3>
                <p className="text-sm" style={{ color: '#72787e' }}>
                  {tip.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-outline-variant bg-white p-6" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
          <div className="flex items-start gap-4">
            <HelpCircle className="h-6 w-6 flex-shrink-0" style={{ color: '#123f5c' }} />
            <div>
              <h3 className="mb-1 font-bold" style={{ color: '#123f5c' }}>
                Need more help?
              </h3>
              <p className="text-sm" style={{ color: '#72787e' }}>
                Contact our support team via the help button or email support@funxon.co.za. We are here to help you get the most out of your listing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
