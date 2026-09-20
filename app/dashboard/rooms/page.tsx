'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useHotel } from '../../../lib/hotel-context';
import {
  fetchRooms, fetchRoomTypes, createRoom, updateRoom,
  type Room, type RoomType,
} from '../../../lib/api-client';
import {
  PageHeader, RoomStatusBadge, TableSkeleton, ErrorState, EmptyState, SearchInput, FilterChips, InlineError,
} from '../../../components/ui';

const STATUS_OPTIONS: { value: Room['status'] | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OUT_OF_SERVICE', label: 'Out of service' },
];

export default function RoomsPage() {
  const { hotel } = useHotel();
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [types, setTypes] = useState<RoomType[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Room['status'] | 'ALL'>('ALL');
  const [form, setForm] = useState({ number: '', floor: '', roomTypeId: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoadError(null);
    Promise.all([fetchRooms(hotel.id), fetchRoomTypes(hotel.id)])
      .then(([r, t]) => {
        setRooms(r);
        setTypes(t);
        setForm((f) => (f.roomTypeId ? f : { ...f, roomTypeId: t[0]?.id ?? '' }));
      })
      .catch((err) => setLoadError(err?.message ?? 'Could not load rooms.'));
  }, [hotel.id]);

  useEffect(load, [load]);

  async function handleAddRoom(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await createRoom(hotel.id, {
        number: form.number,
        roomTypeId: form.roomTypeId,
        floor: form.floor ? Number(form.floor) : undefined,
      });
      setForm((f) => ({ ...f, number: '', floor: '' }));
      load();
    } catch (err: any) {
      setFormError(err?.message ?? 'Could not add room.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(room: Room, status: Room['status']) {
    const prev = rooms;
    setRooms((rs) => rs && rs.map((r) => (r.id === room.id ? { ...r, status } : r)));
    try {
      await updateRoom(hotel.id, room.id, { status });
    } catch (err: any) {
      setRooms(prev ?? null);
      setFormError(err?.message ?? 'Could not update room status.');
    }
  }

  const filtered = useMemo(() => {
    if (!rooms) return [];
    return rooms.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return r.number.toLowerCase().includes(q) || r.roomType.name.toLowerCase().includes(q);
    });
  }, [rooms, search, statusFilter]);

  return (
    <>
      <PageHeader eyebrow="Property Overview" title="Rooms" />

      <form onSubmit={handleAddRoom} className="inline-form">
        <input
          className="control"
          placeholder="Room number"
          value={form.number}
          onChange={(e) => setForm({ ...form, number: e.target.value })}
          required
          aria-label="Room number"
        />
        <input
          className="control"
          placeholder="Floor (optional)"
          inputMode="numeric"
          value={form.floor}
          onChange={(e) => setForm({ ...form, floor: e.target.value })}
          aria-label="Floor"
        />
        <select
          className="control"
          value={form.roomTypeId}
          onChange={(e) => setForm({ ...form, roomTypeId: e.target.value })}
          aria-label="Room type"
        >
          {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button className="btn btn-primary" type="submit" disabled={submitting || !types.length}>
          {submitting ? 'Adding…' : 'Add room'}
        </button>
      </form>
      {formError && <InlineError message={formError} />}

      {loadError ? (
        <ErrorState message={loadError} onRetry={load} />
      ) : (
        <>
          <div className="toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by room number or type…" />
            <FilterChips options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
          </div>

          {!rooms ? (
            <TableSkeleton cols={4} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={rooms.length === 0 ? 'No rooms yet' : 'No rooms match your filters'}
              description={rooms.length === 0 ? 'Add your first room above to get started.' : 'Try a different search term or status filter.'}
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Number</th><th>Floor</th><th>Type</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td className="td-numeric">{r.number}</td>
                      <td className="td-numeric">{r.floor ?? '—'}</td>
                      <td>{r.roomType.name}</td>
                      <td>
                        <div className="status-cell">
                          <RoomStatusBadge status={r.status} />
                          <select
                            className="status-select"
                            value={r.status}
                            onChange={(e) => handleStatusChange(r, e.target.value as Room['status'])}
                            aria-label={`Change status for room ${r.number}`}
                          >
                            <option value="AVAILABLE">Available</option>
                            <option value="OCCUPIED">Occupied</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="OUT_OF_SERVICE">Out of service</option>
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
