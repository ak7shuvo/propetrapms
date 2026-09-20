'use client';

import { useState } from 'react';
import { useHotel } from '../../../lib/hotel-context';
import { saveHotel } from '../../../lib/api-client';
import { PageHeader, InlineError } from '../../../components/ui';

export default function HotelSettingsPage() {
  const { hotel, setHotel } = useHotel();
  const [form, setForm] = useState({ name: hotel.name, address: hotel.address ?? '', phone: hotel.phone ?? '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const h = await saveHotel({ name: form.name, address: form.address || null, phone: form.phone || null });
      setHotel(h);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err?.message ?? 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Property Overview" title="Hotel Settings" />

      <div className="panel panel-narrow">
        <h3 className="panel-title">Property details</h3>
        <p className="panel-desc">Shown to guests and staff across PETRAPMS.</p>
        {error && <InlineError message={error} />}
        <form onSubmit={handleSave} className="stacked-form">
          <label htmlFor="hotelName">Hotel name</label>
          <input id="hotelName" className="control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

          <label htmlFor="hotelAddress">Address</label>
          <input id="hotelAddress" className="control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Not set" />

          <label htmlFor="hotelPhone">Phone</label>
          <input id="hotelPhone" className="control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Not set" />

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            {saved && <span className="save-confirm">Saved.</span>}
          </div>
        </form>
      </div>
    </>
  );
}
