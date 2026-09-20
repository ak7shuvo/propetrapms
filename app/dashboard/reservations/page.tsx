'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useHotel } from '../../../lib/hotel-context';
import {
  fetchReservations, fetchGuests, fetchRooms, createReservation, updateReservation,
  type Reservation, type Guest, type Room,
} from '../../../lib/api-client';
import {
  PageHeader, ReservationStatusBadge, TableSkeleton, ErrorState, EmptyState, SearchInput, FilterChips, InlineError,
} from '../../../components/ui';

const STATUS_OPTIONS: { value: Reservation['status'] | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const initialForm = { guestId: '', roomId: '', checkInDate: '', checkOutDate: '' };

export default function ReservationsPage() {
  const { hotel } = useHotel();
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Reservation['status'] | 'ALL'>('ALL');
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoadError(null);
    Promise.all([fetchReservations(hotel.id), fetchGuests(hotel.id), fetchRooms(hotel.id)])
      .then(([res, g, r]) => {
        setReservations(res);
        setGuests(g);
        setRooms(r);
        setForm((f) => ({ ...f, guestId: f.guestId || g[0]?.id || '', roomId: f.roomId || r[0]?.id || '' }));
      })
      .catch((err) => setLoadError(err?.message ?? 'Could not load reservations.'));
  }, [hotel.id]);

  useEffect(load, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await createReservation(hotel.id, form);
      setForm((f) => ({ ...f, checkInDate: '', checkOutDate: '' }));
      load();
    } catch (err: any) {
      setFormError(err?.message ?? 'Could not create reservation.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatus(res: Reservation, status: Reservation['status']) {
    const prev = reservations;
    setReservations((rs) => rs && rs.map((r) => (r.id === res.id ? { ...r, status } : r)));
    try {
      await updateReservation(hotel.id, res.id, { status });
    } catch (err: any) {
      setReservations(prev ?? null);
      setFormError(err?.message ?? 'Could not update reservation status.');
    }
  }

  const filtered = useMemo(() => {
    if (!reservations) return [];
    return reservations.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return `${r.guest.firstName} ${r.guest.lastName}`.toLowerCase().includes(q) || r.room.number.toLowerCase().includes(q);
    });
  }, [reservations, search, statusFilter]);

  return (
    <>
      <PageHeader eyebrow="Property Overview" title="Reservations" />

      <form onSubmit={handleAdd} className="inline-form">
        <select className="control" value={form.guestId} onChange={(e) => setForm({ ...form, guestId: e.target.value })} aria-label="Guest">
          {guests.map((g) => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
        </select>
        <select className="control" value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} aria-label="Room">
          {rooms.map((r) => <option key={r.id} value={r.id}>Room {r.number}</option>)}
        </select>
        <input className="control" type="date" value={form.checkInDate} onChange={(e) => setForm({ ...form, checkInDate: e.target.value })} required aria-label="Check-in date" />
        <input className="control" type="date" value={form.checkOutDate} onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })} required aria-label="Check-out date" />
        <button className="btn btn-primary" type="submit" disabled={submitting || !guests.length || !rooms.length}>
          {submitting ? 'Creating…' : 'Create reservation'}
        </button>
      </form>
      {formError && <InlineError message={formError} />}

      {loadError ? (
        <ErrorState message={loadError} onRetry={load} />
      ) : (
        <>
          <div className="toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by guest or room…" />
            <FilterChips options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
          </div>

          {!reservations ? (
            <TableSkeleton cols={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={reservations.length === 0 ? 'No reservations yet' : 'No reservations match your filters'}
              description={reservations.length === 0 ? 'Create your first reservation above.' : 'Try a different search term or status filter.'}
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Status</th></tr></thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td>{r.guest.firstName} {r.guest.lastName}</td>
                      <td className="td-numeric">{r.room.number}</td>
                      <td className="td-numeric">{r.checkInDate}</td>
                      <td className="td-numeric">{r.checkOutDate}</td>
                      <td>
                        <div className="status-cell">
                          <ReservationStatusBadge status={r.status} />
                          <select
                            className="status-select"
                            value={r.status}
                            onChange={(e) => handleStatus(r, e.target.value as Reservation['status'])}
                            aria-label={`Change status for ${r.guest.firstName} ${r.guest.lastName}'s reservation`}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
