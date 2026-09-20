'use client';

import { useEffect, useState, useCallback } from 'react';
import { useHotel } from '../../../lib/hotel-context';
import { fetchReservations, updateReservation, type Reservation } from '../../../lib/api-client';
import { PageHeader, ErrorState, EmptyState, CardSkeleton, InlineError } from '../../../components/ui';

export default function FrontDeskPage() {
  const { hotel } = useHotel();
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadError(null);
    fetchReservations(hotel.id).then(setReservations).catch((err) => setLoadError(err?.message ?? 'Could not load front desk data.'));
  }, [hotel.id]);

  useEffect(load, [load]);

  async function transition(r: Reservation, status: Reservation['status']) {
    setActionError(null);
    setPendingId(r.id);
    try {
      await updateReservation(hotel.id, r.id, { status });
      load();
    } catch (err: any) {
      setActionError(err?.message ?? 'Could not update the reservation.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Property Overview" title="Front Desk" />
      {actionError && <InlineError message={actionError} />}

      {loadError ? (
        <ErrorState message={loadError} onRetry={load} />
      ) : !reservations ? (
        <div className="row-grid">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
        </div>
      ) : (
        <FrontDeskBoard reservations={reservations} pendingId={pendingId} onCheckIn={(r) => transition(r, 'CONFIRMED')} onCheckOut={(r) => transition(r, 'COMPLETED')} />
      )}
    </>
  );
}

function FrontDeskBoard({ reservations, pendingId, onCheckIn, onCheckOut }: {
  reservations: Reservation[];
  pendingId: string | null;
  onCheckIn: (r: Reservation) => void;
  onCheckOut: (r: Reservation) => void;
}) {
  const arrivals = reservations.filter((r) => r.status === 'PENDING');
  const inHouse = reservations.filter((r) => r.status === 'CONFIRMED');

  return (
    <div className="cols-2">
      <div className="panel">
        <h3 className="panel-title">Arrivals</h3>
        {arrivals.length === 0 ? (
          <EmptyState title="No pending arrivals" description="New reservations will show up here." />
        ) : (
          arrivals.map((r) => (
            <div key={r.id} className="action-row">
              <div>
                <strong>{r.guest.firstName} {r.guest.lastName}</strong>
                <div className="action-row-sub">Room {r.room.number} · {r.checkInDate}</div>
              </div>
              <button type="button" className="btn btn-success-outline" onClick={() => onCheckIn(r)} disabled={pendingId === r.id}>
                {pendingId === r.id ? 'Checking in…' : 'Check in'}
              </button>
            </div>
          ))
        )}
      </div>
      <div className="panel">
        <h3 className="panel-title">Current in-house</h3>
        {inHouse.length === 0 ? (
          <EmptyState title="No guests checked in" description="Checked-in guests will appear here." />
        ) : (
          inHouse.map((r) => (
            <div key={r.id} className="action-row">
              <div>
                <strong>{r.guest.firstName} {r.guest.lastName}</strong>
                <div className="action-row-sub">Room {r.room.number} · until {r.checkOutDate}</div>
              </div>
              <button type="button" className="btn btn-danger-outline" onClick={() => onCheckOut(r)} disabled={pendingId === r.id}>
                {pendingId === r.id ? 'Checking out…' : 'Check out'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
