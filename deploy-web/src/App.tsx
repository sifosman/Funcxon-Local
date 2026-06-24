import { Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout';
import { GuardedRoute } from './components/GuardedRoute';
import { DataConsentModal } from './components/DataConsentModal';
import { FloatingHelpButton } from './components/FloatingHelpButton';
import { HelpCenterModal } from './components/HelpCenterModal';
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import VenueProfilePage from './pages/VenueProfilePage';
import VendorProfilePage from './pages/VendorProfilePage';
import QuotesPage from './pages/QuotesPage';
import QuoteDetailPage from './pages/QuoteDetailPage';
import PlannerPage from './pages/PlannerPage';
import AccountPage from './pages/AccountPage';
import FavouritesPage from './pages/FavouritesPage';
import BlogListPage from './pages/BlogListPage';
import BlogDetailPage from './pages/BlogDetailPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import EmailConfirmationPage from './pages/EmailConfirmationPage';
import ListersPortalPage from './pages/ListersPortalPage';
import ListerPortfolioPage from './pages/ListerPortfolioPage';
import BookTourPage from './pages/BookTourPage';
import CreateReviewPage from './pages/CreateReviewPage';
import SubscriptionPlansPage from './pages/SubscriptionPlansPage';
import SubscriptionCheckoutPage from './pages/SubscriptionCheckoutPage';
import TermsAndPoliciesPage from './pages/TermsAndPoliciesPage';
import LegalDocumentPage from './pages/LegalDocumentPage';
import NotFoundPage from './pages/NotFoundPage';
import WelcomePage from './pages/WelcomePage';
import ApplyPage from './pages/ApplyPage';
import ApplicationStep1Page from './pages/ApplicationStep1Page';
import ApplicationStep2Page from './pages/ApplicationStep2Page';
import ApplicationStep3Page from './pages/ApplicationStep3Page';
import ApplicationStep4Page from './pages/ApplicationStep4Page';
import ApplicationSubmittedPage from './pages/ApplicationSubmittedPage';
import VendorDashboardPage from './pages/VendorDashboardPage';
import VenueDashboardPage from './pages/VenueDashboardPage';
import VendorAnalyticsPage from './pages/VendorAnalyticsPage';
import VenueAnalyticsPage from './pages/VenueAnalyticsPage';
import ActivityDashboardPage from './pages/ActivityDashboardPage';
import BookingsPage from './pages/BookingsPage';
import BookingDetailPage from './pages/BookingDetailPage';
import TourBookingsPage from './pages/TourBookingsPage';
import CataloguePage from './pages/CataloguePage';
import QuoteRequestsPage from './pages/QuoteRequestsPage';
import EventListPage from './pages/EventListPage';
import PaymentPage from './pages/PaymentPage';
import VendorPortfolioPage from './pages/VendorPortfolioPage';

function App() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <DataConsentModal />
      <FloatingHelpButton onClick={() => setHelpOpen(true)} />
      <HelpCenterModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="welcome" element={<WelcomePage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="venue/:id" element={<VenueProfilePage />} />
          <Route path="vendor/:id" element={<VendorProfilePage />} />
          <Route path="vendor/:id/portfolio" element={<VendorPortfolioPage />} />

          {/* Attendee protected routes */}
          <Route path="quotes" element={<GuardedRoute label="quotes"><QuotesPage /></GuardedRoute>} />
          <Route path="quotes/:id" element={<GuardedRoute label="quote details"><QuoteDetailPage /></GuardedRoute>} />
          <Route path="planner" element={<GuardedRoute label="planner"><PlannerPage /></GuardedRoute>} />
          <Route path="events" element={<GuardedRoute label="events"><EventListPage /></GuardedRoute>} />
          <Route path="bookings" element={<GuardedRoute label="bookings"><BookingsPage /></GuardedRoute>} />
          <Route path="bookings/:id" element={<GuardedRoute label="booking details"><BookingDetailPage /></GuardedRoute>} />
          <Route path="book-tour" element={<GuardedRoute label="book a tour"><BookTourPage /></GuardedRoute>} />
          <Route path="create-review" element={<GuardedRoute label="create review"><CreateReviewPage /></GuardedRoute>} />
          <Route path="account" element={<GuardedRoute label="account"><AccountPage /></GuardedRoute>} />
          <Route path="account/favourites" element={<GuardedRoute label="favourites"><FavouritesPage /></GuardedRoute>} />
          <Route path="activity-dashboard" element={<GuardedRoute label="activity dashboard"><ActivityDashboardPage /></GuardedRoute>} />

          {/* Lister / application routes */}
          <Route path="listers-portal" element={<GuardedRoute label="listers portal"><ListersPortalPage /></GuardedRoute>} />
          <Route path="lister-portfolio" element={<GuardedRoute label="portfolio"><ListerPortfolioPage /></GuardedRoute>} />
          <Route path="apply" element={<GuardedRoute label="application"><ApplyPage /></GuardedRoute>} />
          <Route path="apply/step1" element={<GuardedRoute label="application"><ApplicationStep1Page /></GuardedRoute>} />
          <Route path="apply/step2" element={<GuardedRoute label="application"><ApplicationStep2Page /></GuardedRoute>} />
          <Route path="apply/step3" element={<GuardedRoute label="application"><ApplicationStep3Page /></GuardedRoute>} />
          <Route path="apply/step4" element={<GuardedRoute label="application"><ApplicationStep4Page /></GuardedRoute>} />
          <Route path="apply/submitted" element={<ApplicationSubmittedPage />} />
          <Route path="vendor-dashboard" element={<GuardedRoute label="vendor dashboard"><VendorDashboardPage /></GuardedRoute>} />
          <Route path="venue-dashboard" element={<GuardedRoute label="venue dashboard"><VenueDashboardPage /></GuardedRoute>} />
          <Route path="vendor-analytics" element={<GuardedRoute label="vendor analytics"><VendorAnalyticsPage /></GuardedRoute>} />
          <Route path="venue-analytics" element={<GuardedRoute label="venue analytics"><VenueAnalyticsPage /></GuardedRoute>} />
          <Route path="tour-bookings" element={<GuardedRoute label="tour bookings"><TourBookingsPage /></GuardedRoute>} />
          <Route path="catalogue" element={<GuardedRoute label="catalogue"><CataloguePage /></GuardedRoute>} />
          <Route path="quote-requests" element={<GuardedRoute label="quote requests"><QuoteRequestsPage /></GuardedRoute>} />

          {/* Public content routes */}
          <Route path="blog" element={<BlogListPage />} />
          <Route path="blog/:slug" element={<BlogDetailPage />} />
          <Route path="terms" element={<TermsAndPoliciesPage />} />
          <Route path="legal/:document" element={<LegalDocumentPage />} />

          {/* Auth routes */}
          <Route path="signin" element={<SignInPage />} />
          <Route path="signup" element={<SignUpPage />} />
          <Route path="email-confirmation" element={<EmailConfirmationPage />} />

          {/* Subscription routes */}
          <Route path="subscription-plans" element={<SubscriptionPlansPage />} />
          <Route path="subscription-checkout" element={<GuardedRoute label="checkout"><SubscriptionCheckoutPage /></GuardedRoute>} />
          <Route path="payment" element={<GuardedRoute label="payment"><PaymentPage /></GuardedRoute>} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
