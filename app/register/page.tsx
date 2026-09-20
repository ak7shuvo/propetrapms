'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

const initialForm = { tenantName: '', adminEmail: '', adminPassword: '', firstName: '', lastName: '' };

export default function RegisterPage() {
  const router = useRouter();
  const { registerTenant } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerTenant(form);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-brand"><div className="mark">P</div><div><strong>PETRA</strong><small>PROPERTY MANAGEMENT</small></div></div>
        <div className="auth-copy">
          <span className="auth-kicker">Your property, one workspace</span>
          <h2>Start with clarity.<br />Scale with control.</h2>
          <p>Create an isolated hotel workspace for the people and operations that keep the property moving.</p>
        </div>
        <div className="auth-footer">PETRAPMS · MULTI-TENANT BY DESIGN</div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <h1>Create your workspace</h1>
          <p className="sub">Set up your hotel and administrator account.</p>
          {error && <div className="inline-error" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="tenantName">Hotel name</label>
            <input id="tenantName" value={form.tenantName} onChange={(e) => update('tenantName', e.target.value)} required />

            <div className="form-grid-2">
              <div>
                <label htmlFor="firstName">First name</label>
                <input id="firstName" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
              </div>
              <div>
                <label htmlFor="lastName">Last name</label>
                <input id="lastName" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
              </div>
            </div>

            <label htmlFor="adminEmail">Admin email</label>
            <input id="adminEmail" type="email" autoComplete="username" value={form.adminEmail} onChange={(e) => update('adminEmail', e.target.value)} required />

            <label htmlFor="adminPassword">Password</label>
            <input id="adminPassword" type="password" autoComplete="new-password" value={form.adminPassword} onChange={(e) => update('adminPassword', e.target.value)} required />

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Creating workspace…' : 'Create property workspace'}
            </button>
          </form>
          <p className="foot">Already registered? <Link href="/login" className="link">Sign in →</Link></p>
        </div>
      </section>
    </main>
  );
}
