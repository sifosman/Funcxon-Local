import { Outlet } from 'react-router-dom';
import WebHeader from './WebHeader';
import WebFooter from './WebFooter';
import AppFooter from './AppFooter';
import MobileBottomNav from './MobileBottomNav';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-on-surface">
      <WebHeader />
      <main className="flex-1 pb-[60px] lg:pb-0">
        <Outlet />
      </main>
      <div className="hidden lg:block">
        <WebFooter />
      </div>
      <div className="lg:hidden">
        <AppFooter />
      </div>
      <MobileBottomNav />
    </div>
  );
}
