'use client';

import { useEffect } from 'react';

/**
 * Signature detail: a soft light that follows the cursor across any
 * .panel / .stat-card / .action-row / .auth-card it passes over.
 * One delegated listener for the whole app — no page needs to opt in,
 * the CSS (globals.css, "SIGNATURE LAYER") does the rest via --mx/--my.
 */
export function SurfaceSheen() {
  useEffect(() => {
    const selector = '.panel, .stat-card, .action-row, .auth-card, .skeleton-card';

    function handleMove(e: MouseEvent) {
      const el = (e.target as HTMLElement)?.closest?.(selector) as HTMLElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      el.style.setProperty('--my', `${e.clientY - rect.top}px`);
    }

    document.addEventListener('mousemove', handleMove, { passive: true });
    return () => document.removeEventListener('mousemove', handleMove);
  }, []);

  return null;
}
