'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../lib/auth-context';
import type { User } from '../lib/api-client';

const NAV_OPERATIONS = [
  { label: 'Overview', href: '/dashboard', icon: '⌂' },
  { label: 'Monitoring', href: '/dashboard/monitoring', icon: '◈' },
  { label: 'Front Desk', href: '/dashboard/front-desk', icon: '◉' },
  { label: 'Reservations', href: '/dashboard/reservations', icon: '▣' },
  { label: 'Rooms', href: '/dashboard/rooms', icon: '▤' },
  { label: 'Guests', href: '/dashboard/guests', icon: '♙' },
];

const NAV_MANAGEMENT = [
  { label: 'Hotel Settings', href: '/dashboard/hotel', icon: '⚙' },
];

const ALL_NAV = [...NAV_OPERATIONS, ...NAV_MANAGEMENT];

function initials(user: User) {
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
}

function NavList({ items, pathname, onNavigate }: {
  items: typeof NAV_OPERATIONS; pathname: string; onNavigate: () => void;
}) {
  return (
    <>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={`nav-item ${pathname === item.href ? 'active' : ''}`}
          aria-current={pathname === item.href ? 'page' : undefined}
        >
          <span className="nav-icon" aria-hidden>{item.icon}</span>
          <span>{item.label}</span>
          {pathname === item.href && <span className="active-pip" />}
        </Link>
      ))}
    </>
  );
}

export function Shell({ user, hotelName, children }: { user: User; hotelName?: string; children: ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null);

  const active = ALL_NAV.find((item) => pathname === item.href);
  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    const container = navRef.current;
    if (!container) return;
    const activeEl = container.querySelector('.nav-item.active') as HTMLElement | null;
    if (activeEl) {
      setIndicator({ top: activeEl.offsetTop, height: activeEl.offsetHeight });
    }
  }, [pathname]);

  return (
    <div className="app-shell">
      <button
        type="button"
        className="mobile-nav-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
      >
        <span /><span /><span />
      </button>

      {mobileOpen && <div className="sidebar-scrim" onClick={closeMobile} aria-hidden />}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-mark">P</div>
            <div>
              <strong>PETRA</strong>
              <span>PMS</span>
            </div>
          </div>
          <button type="button" className="mobile-nav-close" onClick={closeMobile} aria-label="Close navigation">×</button>
        </div>

        <div className="workspace">
          <span className="workspace-dot" />
          <div>
            <span className="workspace-label">WORKSPACE</span>
            <span className="workspace-value">{hotelName ?? 'Property operations'}</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary" ref={navRef}>
          {indicator && (
            <div
              className="nav-indicator"
              style={{ transform: `translateY(${indicator.top}px)`, height: indicator.height }}
              aria-hidden
            />
          )}
          <span className="nav-caption">OPERATIONS</span>
          <NavList items={NAV_OPERATIONS} pathname={pathname} onNavigate={closeMobile} />
          <span className="nav-caption nav-caption-spaced">MANAGEMENT</span>
          <NavList items={NAV_MANAGEMENT} pathname={pathname} onNavigate={closeMobile} />
        </nav>

        <div className="sidebar-bottom">
          <div className="user-mini">
            <div className="avatar avatar-dark">{initials(user)}</div>
            <div className="user-mini-copy">
              <strong>{user.firstName} {user.lastName}</strong>
              <span>{user.role.replaceAll('_', ' ')}</span>
            </div>
          </div>
          <button type="button" onClick={logout} className="signout">
            <span aria-hidden>↪</span> Sign out
          </button>
        </div>
      </aside>

      <div className="app-frame">
        <header className="topbar">
          <div className="breadcrumbs">
            <span className="topbar-brand-mobile">PETRAPMS</span>
            <span className="topbar-brand-desktop">PETRAPMS</span>
            <i aria-hidden>/</i>
            <strong>{active?.label ?? 'Operations'}</strong>
          </div>
          <div className="topbar-right">
            <div className="live-pill"><span /> System operational</div>
            <div className="top-avatar" title={`${user.firstName} ${user.lastName}`}>{initials(user)}</div>
          </div>
        </header>
        <main className="page-main">
          <div className="page-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
