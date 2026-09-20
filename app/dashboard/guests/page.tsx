'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useHotel } from '../../../lib/hotel-context';
import { fetchGuests, createGuest, type Guest } from '../../../lib/api-client';
import {
  PageHeader, TableSkeleton, ErrorState, EmptyState, SearchInput, InlineError,
} from '../../../components/ui';

const initialForm = { firstName: '', lastName: '', email: '', phone: '' };

export default function GuestsPage() {
  const { hotel } = useHotel();
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoadError(null);
    fetchGuests(hotel.id).then(setGuests).catch((err) => setLoadError(err?.message ?? 'Could not load guests.'));
  }, [hotel.id]);

  useEffect(load, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await createGuest(hotel.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
      });
      setForm(initialForm);
      load();
    } catch (err: any) {
      setFormError(err?.message ?? 'Could not add guest.');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    if (!guests) return [];
    if (!search.trim()) return guests;
    const q = search.trim().toLowerCase();
    return guests.filter((g) =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(q)
      || g.email?.toLowerCase().includes(q)
      || g.phone?.toLowerCase().includes(q));
  }, [guests, search]);

  return (
    <>
      <PageHeader eyebrow="Property Overview" title="Guests" />

      <form onSubmit={handleAdd} className="inline-form">
        <input className="control" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required aria-label="First name" />
        <input className="control" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required aria-label="Last name" />
        <input className="control" placeholder="Email (optional)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="Email" />
        <input className="control" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="Phone" />
        <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Adding…' : 'Add guest'}</button>
      </form>
      {formError && <InlineError message={formError} />}

      {loadError ? (
        <ErrorState message={loadError} onRetry={load} />
      ) : (
        <>
          <div className="toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder="Search guests by name, email or phone…" />
          </div>

          {!guests ? (
            <TableSkeleton cols={3} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={guests.length === 0 ? 'No guests yet' : 'No guests match your search'}
              description={guests.length === 0 ? 'Add your first guest above.' : 'Try a different search term.'}
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th></tr></thead>
                <tbody>
                  {filtered.map((g) => (
                    <tr key={g.id}>
                      <td>{g.firstName} {g.lastName}</td>
                      <td>{g.email ?? '—'}</td>
                      <td className="td-numeric">{g.phone ?? '—'}</td>
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
