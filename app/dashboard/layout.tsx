'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { HotelProvider } from '../../lib/hotel-context';
import { fetchHotel, type Hotel } from '../../lib/api-client';
import { Shell } from '../../components/shell';
import { ErrorState } from '../../components/ui';

/**
 * Single guard for every /dashboard/* route.
 *
 * - status === 'loading'  → render a shell skeleton. Never redirect here —
 *   this is exactly the state that used to get misread as "logged out".
 * - status === 'unauthenticated' → redirect to /login, once.
 * - status === 'authenticated' → fetch the hotel once, then mount the real
 *   Shell + page. Because this is a layout, it stays mounted across
 *   navigation between Overview/Rooms/Guests/etc — no repeated auth checks,
 *   no sidebar remount, no loading flash per click.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, user } = useAuth();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [hotelError, setHotelError] = useState<string | null>(null);

  const loadHotel = useCallback(() => {
    setHotelError(null);
    fetchHotel()
      .then(setHotel)
      .catch((err) => setHotelError(err?.message ?? 'Could not load your hotel.'));
  }, []);

  useEffect(() => {
    if (status === 'authenticated') loadHotel();
  }, [status, loadHotel]);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return <ShellSkeleton />;
  }

  if (hotelError) {
    return (
      <div className="dashboard-boot-error">
        <ErrorState message={hotelError} onRetry={loadHotel} />
      </div>
    );
  }

  if (!hotel || !user) {
    return <ShellSkeleton />;
  }

  return (
    <HotelProvider hotel={hotel}>
      <Shell user={user} hotelName={hotel.name}>{children}</Shell>
    </HotelProvider>
  );
}

function ShellSkeleton() {
  return (
    <div className="app-shell">
      <aside className="sidebar sidebar-skeleton" aria-hidden>
        <div className="brand"><div className="brand-mark">P</div><div><strong>PETRA</strong><span>PMS</span></div></div>
        <div className="skeleton-nav">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-chip skeleton-shimmer" />)}
        </div>
      </aside>
      <div className="app-frame">
        <header className="topbar" />
        <main className="page-main">
          <div className="page-content">
            <div className="skeleton-line skeleton-shimmer" style={{ width: 160, height: 28, marginBottom: 24 }} />
            <div className="stat4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-card skeleton-shimmer" style={{ height: 88 }} />)}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
