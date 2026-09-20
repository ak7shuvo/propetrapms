import './globals.css';
import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/auth-context';
import { SurfaceSheen } from '../components/surface-sheen';

export const metadata = {
  title: 'PETRAPMS',
  description: 'PETRAPMS — cloud-based, multi-tenant Property Management System.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="grain-overlay" aria-hidden />
        <SurfaceSheen />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
