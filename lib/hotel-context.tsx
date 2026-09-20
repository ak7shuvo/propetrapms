'use client';

/**
 * The active hotel, fetched once when the dashboard shell mounts and shared
 * by every dashboard page via context. Individual pages still fetch their
 * own resource lists (rooms, guests, reservations) — only the hotel record
 * itself, which every page needs just to know which hotel it's scoped to,
 * is centralized here.
 */

import {
  createContext, useContext, useState, useCallback, type ReactNode,
} from 'react';
import type { Hotel } from './api-client';

interface HotelContextValue {
  hotel: Hotel;
  setHotel: (h: Hotel) => void;
}

const HotelContext = createContext<HotelContextValue | null>(null);

export function HotelProvider({ hotel, children }: { hotel: Hotel; children: ReactNode }) {
  const [current, setCurrent] = useState(hotel);
  const setHotel = useCallback((h: Hotel) => setCurrent(h), []);
  return <HotelContext.Provider value={{ hotel: current, setHotel }}>{children}</HotelContext.Provider>;
}

export function useHotel(): HotelContextValue {
  const ctx = useContext(HotelContext);
  if (!ctx) throw new Error('useHotel must be used within <HotelProvider>');
  return ctx;
}
