'use client';

import { useEffect, useState, useCallback } from 'react';
import { useHotel } from '../../lib/hotel-context';
import { fetchRooms, fetchReservations, type Room, type Reservation } from '../../lib/api-client';
import { PageHeader, StatCard, OccupancyDial, ErrorState, CardSkeleton } from '../../components/ui';

export default function OverviewPage() {
  const { hotel } = useHotel();
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([fetchRooms(hotel.id), fetchReservations(hotel.id)])
      .then(([r, res]) => { setRooms(r); setReservations(res); })
      .catch((err) => setError(err?.message ?? 'Could not load the overview.'));
  }, [hotel.id]);

  useEffect(load, [load]);

  return (
    <>
      <PageHeader eyebrow="Property Overview" title="Today at a glance" />

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && (!rooms || !reservations) && (
        <>
          <div className="stat4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} lines={2} />)}
          </div>
          <div className="row-grid">
            <CardSkeleton lines={4} />
            <CardSkeleton lines={4} />
          </div>
        </>
      )}

      {!error && rooms && reservations && (
        <OverviewContent rooms={rooms} reservations={reservations} />
      )}
    </>
  );
}

function OverviewContent({ rooms, reservations }: { rooms: Room[]; reservations: Reservation[] }) {
  const occupied = rooms.filter((r) => r.status === 'OCCUPIED').length;
  const available = rooms.filter((r) => r.status === 'AVAILABLE').length;
  const attention = rooms.filter((r) => r.status === 'MAINTENANCE' || r.status === 'OUT_OF_SERVICE').length;
  const occupancyPct = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0;
  const pending = reservations.filter((r) => r.status === 'PENDING').length;
  const upcoming = reservations
    .filter((r) => r.status === 'CONFIRMED' || r.status === 'PENDING')
    .slice(0, 6);

  return (
    <>
      <div className="stat4">
        <OccupancyDial pct={occupancyPct} occupied={occupied} total={rooms.length} pending={pending} />
        <StatCard label="Available Rooms" value={String(available)} />
        <StatCard label="Pending Reservations" value={String(pending)} />
        <StatCard label="Needs Attention" value={String(attention)} hint="Maintenance / out of service" />
      </div>

      <div className="row-grid">
        <div className="panel">
          <h3 className="panel-title">Room status breakdown</h3>
          {rooms.length === 0 ? (
            <p className="muted-note">No rooms yet — add one from the Rooms page.</p>
          ) : (
            <div className="room-stat-grid">
              <RoomStat dot="var(--color-ink)" n={occupied} label="Occupied" />
              <RoomStat dot="var(--color-success)" n={available} label="Available" />
              <RoomStat dot="var(--color-danger)" n={attention} label="Needs attention" />
            </div>
          )}
        </div>
        <div className="panel">
          <h3 className="panel-title">Upcoming reservations</h3>
          {upcoming.length === 0 && <p className="muted-note">No upcoming reservations.</p>}
          {upcoming.map((r) => (
            <div key={r.id} className="mini-row">
              <div className="mini-avatar">{r.guest.firstName[0]}</div>
              <div className="mini-row-body">
                <div className="mini-row-title">{r.guest.firstName} {r.guest.lastName}</div>
                <div className="mini-row-sub">Room {r.room.number} · {r.checkInDate}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function RoomStat({ dot, n, label }: { dot: string; n: number; label: string }) {
  return (
    <div className="room-stat">
      <span className="room-stat-dot" style={{ background: dot }} />
      <span>
        <span className="room-stat-n">{n}</span>
        <span className="room-stat-label">{label}</span>
      </span>
    </div>
  );
}
