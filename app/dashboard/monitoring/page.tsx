'use client';

import { useEffect, useState, useCallback } from 'react';
import { useHotel } from '../../../lib/hotel-context';
import { fetchRooms, fetchReservations, fetchGuests, type Room, type Reservation, type Guest } from '../../../lib/api-client';
import {
  PageHeader, OccupancyDial, StatCard, RoomStatusBadge, ReservationStatusBadge,
  ErrorState, CardSkeleton,
} from '../../../components/ui';

export default function MonitoringPage() {
  const { hotel } = useHotel();
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([fetchRooms(hotel.id), fetchReservations(hotel.id), fetchGuests(hotel.id)])
      .then(([r, res, g]) => { setRooms(r); setReservations(res); setGuests(g); })
      .catch((err) => setError(err?.message ?? 'Could not load monitoring data.'));
  }, [hotel.id]);

  useEffect(load, [load]);

  return (
    <>
      <PageHeader eyebrow="Live Monitoring" title="All operations, one screen" />

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && (!rooms || !reservations || !guests) && (
        <>
          <div className="stat4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} lines={2} />)}</div>
          <div className="row-grid">
            <CardSkeleton lines={5} />
            <CardSkeleton lines={5} />
          </div>
        </>
      )}

      {!error && rooms && reservations && guests && (
        <MonitoringContent rooms={rooms} reservations={reservations} guests={guests} />
      )}
    </>
  );
}

function MonitoringContent({ rooms, reservations, guests }: { rooms: Room[]; reservations: Reservation[]; guests: Guest[] }) {
  const occupied = rooms.filter((r) => r.status === 'OCCUPIED').length;
  const occupancyPct = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0;
  const arrivals = reservations.filter((r) => r.status === 'PENDING');
  const inHouse = reservations.filter((r) => r.status === 'CONFIRMED');
  const attention = rooms.filter((r) => r.status === 'MAINTENANCE' || r.status === 'OUT_OF_SERVICE');

  return (
    <>
      <div className="stat4">
        <OccupancyDial pct={occupancyPct} occupied={occupied} total={rooms.length} pending={arrivals.length} />
        <StatCard label="In-house Now" value={String(inHouse.length)} />
        <StatCard label="Awaiting Check-in" value={String(arrivals.length)} />
        <StatCard label="Guests on File" value={String(guests.length)} />
      </div>

      <div className="row-grid">
        <div className="panel">
          <h3 className="panel-title">Arrivals — awaiting check-in</h3>
          {arrivals.length === 0 && <p className="muted-note">Nothing pending.</p>}
          {arrivals.map((r) => (
            <div key={r.id} className="mini-row">
              <div className="mini-avatar">{r.guest.firstName[0]}</div>
              <div className="mini-row-body">
                <div className="mini-row-title">{r.guest.firstName} {r.guest.lastName}</div>
                <div className="mini-row-sub">Room {r.room.number} · {r.checkInDate}</div>
              </div>
              <ReservationStatusBadge status={r.status} />
            </div>
          ))}
        </div>

        <div className="panel">
          <h3 className="panel-title">In-house guests</h3>
          {inHouse.length === 0 && <p className="muted-note">No one checked in right now.</p>}
          {inHouse.map((r) => (
            <div key={r.id} className="mini-row">
              <div className="mini-avatar">{r.guest.firstName[0]}</div>
              <div className="mini-row-body">
                <div className="mini-row-title">{r.guest.firstName} {r.guest.lastName}</div>
                <div className="mini-row-sub">Room {r.room.number} · until {r.checkOutDate}</div>
              </div>
              <ReservationStatusBadge status={r.status} />
            </div>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <h3 className="panel-title">Rooms needing attention</h3>
        {attention.length === 0 && <p className="muted-note">All rooms are in normal status.</p>}
        {attention.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Number</th><th>Floor</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                {attention.map((r) => (
                  <tr key={r.id}>
                    <td>{r.number}</td>
                    <td>{r.floor ?? '—'}</td>
                    <td>{r.roomType.name}</td>
                    <td><RoomStatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
