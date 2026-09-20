'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { Room, Reservation } from '../lib/api-client';

export function PageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, tone = 'dark', hint }: {
  label: string; value: string; tone?: 'dark' | 'light'; hint?: string;
}) {
  return (
    <div className={`stat-card stat-card-${tone}`}>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {hint && <div className="stat-card-hint">{hint}</div>}
    </div>
  );
}

/**
 * Signature occupancy gauge: an animated radial dial rather than a
 * plain number. Draws from 0 on mount to the real value so it always
 * has a moment of motion — the single metric hoteliers check first
 * deserves more than a stat-card number.
 */
export function OccupancyDial({ pct, occupied, total, pending }: {
  pct: number; occupied: number; total: number; pending: number;
}) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(pct));
    return () => cancelAnimationFrame(t);
  }, [pct]);

  const r = 46;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - animated / 100);

  return (
    <div className="stat-card stat-card-dark dial-card">
      <div className="dial-wrap">
        <div className="dial-figure">
          <svg width="108" height="108" viewBox="0 0 108 108">
            <circle className="dial-track" cx="54" cy="54" r={r} strokeWidth="9" fill="none" />
            <circle
              className="dial-value" cx="54" cy="54" r={r} strokeWidth="9" fill="none"
              strokeDasharray={circumference} strokeDashoffset={offset}
            />
          </svg>
          <div className="dial-center">
            <span className="dial-pct">{pct}%</span>
            <span className="dial-tag">Occupied</span>
          </div>
        </div>
        <div className="dial-meta">
          <div className="dial-meta-row"><span className="dial-meta-n">{occupied}</span><span className="dial-meta-l">of {total} rooms</span></div>
          <div className="dial-meta-row"><span className="dial-meta-n">{pending}</span><span className="dial-meta-l">pending reservations</span></div>
        </div>
      </div>
    </div>
  );
}

const ROOM_STATUS_LABEL: Record<Room['status'], string> = {
  AVAILABLE: 'Available', OCCUPIED: 'Occupied', MAINTENANCE: 'Maintenance', OUT_OF_SERVICE: 'Out of service',
};
const ROOM_STATUS_TONE: Record<Room['status'], string> = {
  AVAILABLE: 'success', OCCUPIED: 'neutral', MAINTENANCE: 'warning', OUT_OF_SERVICE: 'danger',
};

export function RoomStatusBadge({ status }: { status: Room['status'] }) {
  return <span className={`badge badge-${ROOM_STATUS_TONE[status]}`}><i />{ROOM_STATUS_LABEL[status]}</span>;
}

const RES_STATUS_LABEL: Record<Reservation['status'], string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};
const RES_STATUS_TONE: Record<Reservation['status'], string> = {
  PENDING: 'warning', CONFIRMED: 'info', COMPLETED: 'neutral', CANCELLED: 'danger',
};

export function ReservationStatusBadge({ status }: { status: Reservation['status'] }) {
  return <span className={`badge badge-${RES_STATUS_TONE[status]}`}><i />{RES_STATUS_LABEL[status]}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-state-glyph">—</div>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state">
      <strong>Something went wrong</strong>
      <p>{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="btn btn-secondary">Try again</button>}
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return <div className="inline-error">{message}</div>;
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="skeleton-table" aria-busy="true" aria-label="Loading data">
      <div className="skeleton-row skeleton-head">
        {Array.from({ length: cols }).map((_, i) => <div key={i} className="skeleton-chip" />)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton-row">
          {Array.from({ length: cols }).map((_, c) => <div key={c} className="skeleton-chip skeleton-shimmer" />)}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-card" aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => <div key={i} className="skeleton-line skeleton-shimmer" />)}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="search-input">
      <span aria-hidden>⌕</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}

export function FilterChips<T extends string>({ options, value, onChange }: {
  options: { value: T | 'ALL'; label: string }[]; value: T | 'ALL'; onChange: (v: T | 'ALL') => void;
}) {
  return (
    <div className="filter-chips" role="group" aria-label="Filter">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`filter-chip ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
