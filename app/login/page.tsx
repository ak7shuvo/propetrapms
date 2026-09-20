'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { status, login } = useAuth();
  const [email, setEmail] = useState('admin@sunrisebay.example');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Already signed in (e.g. opened /login in a tab with a live session) —
  // leave immediately rather than showing a form that would just re-login.
  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard');
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-brand"><div className="mark">P</div><div><strong>PETRA</strong><small>PROPERTY MANAGEMENT</small></div></div>
        <div className="auth-copy">
          <span className="auth-kicker">Operations, simplified</span>
          <h2>Run the property.<br />Own the details.</h2>
          <p>A focused workspace for reservations, rooms, guests and front-desk operations — built around one clean operational view.</p>
        </div>
        <div className="auth-footer">PETRAPMS · TEAM PETRA</div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="sub">Sign in to your property workspace.</p>
          {error && <div className="inline-error" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />

            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Any value works in mock mode"
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in to PETRAPMS'}
            </button>
          </form>
          <p className="foot">New hotel? <Link href="/register" className="link">Create a property workspace →</Link></p>
        </div>
      </section>
    </main>
  );
}
