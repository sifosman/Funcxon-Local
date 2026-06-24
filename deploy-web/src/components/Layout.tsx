import { Outlet } from 'react-router-dom';
import WebHeader from './WebHeader';
import WebFooter from './WebFooter';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-on-surface">
      <WebHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <WebFooter />
    </div>
  );
}
