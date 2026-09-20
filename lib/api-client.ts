'use client';

import type {
  User, Hotel, RoomType, Room, Guest, Reservation, ApiError,
} from './types';
import { mockApi } from './mock-data';

/**
 * Single API surface for the whole app, matching PETRAPMS-CONTRACT.md
 * route-for-route. USE_MOCK=true (Phase 1 default) routes every call to
 * lib/mock-data.ts. Flip NEXT_PUBLIC_USE_MOCK=false and set
 * NEXT_PUBLIC_API_URL once the Phase 2 backend exists — no other file
 * in the app needs to change.
 */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('petrapms_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseError(res: Response): Promise<never> {
  let body: ApiError;
  try {
    body = await res.json();
  } catch {
    body = { statusCode: res.status, message: res.statusText, error: 'Error' };
  }
  throw body;
}

async function realFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) } });
  if (!res.ok) return parseError(res);
  return res.json();
}

function saveSession(accessToken: string, user: User) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('petrapms_token', accessToken);
  localStorage.setItem('petrapms_user', JSON.stringify(user));
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('petrapms_token');
  const raw = localStorage.getItem('petrapms_user');
  if (!token || !raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('petrapms_token');
  localStorage.removeItem('petrapms_user');
}

/** Full sign-out: clears the persisted session AND the mock backend's
 * in-memory "session" so a client-side nav back into a protected route
 * can't silently reuse stale state. In real mode this is just clearSession()
 * — the JWT is gone and the real backend has no session to reset. */
export function logout() {
  clearSession();
  if (USE_MOCK) mockApi.logout();
}

/** True when an error thrown by this module represents "not authenticated"
 * (as opposed to a network hiccup or a validation error further down a
 * request chain). Callers should only treat this as a reason to sign the
 * user out — anything else should surface as a normal, retryable error. */
export function isAuthError(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as ApiError).statusCode === 401;
}

// ── Auth ──────────────────────────────────────────────────────────────────

export async function registerTenant(input: {
  tenantName: string; adminEmail: string; adminPassword: string; firstName: string; lastName: string;
}) {
  const result = USE_MOCK
    ? await mockApi.registerTenant(input)
    : await realFetch<{ accessToken: string; user: User }>('/v1/auth/register-tenant', {
        method: 'POST', body: JSON.stringify(input),
      });
  saveSession(result.accessToken, result.user);
  return result.user;
}

export async function login(email: string, password: string) {
  const result = USE_MOCK
    ? await mockApi.login(email, password)
    : await realFetch<{ accessToken: string; user: User }>('/v1/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
      });
  saveSession(result.accessToken, result.user);
  return result.user;
}

export async function fetchCurrentUser(): Promise<User> {
  // Mock mode is a local session, so restore it from the same persisted
  // credentials that the real JWT flow would use. This makes every route
  // behave identically after client-side navigation and hard refreshes.
  if (USE_MOCK) {
    const user = getStoredUser();
    if (!user) throw { statusCode: 401, message: 'Not authenticated', error: 'Unauthorized' };
    return mockApi.me();
  }
  return realFetch<User>('/v1/auth/me');
}

// ── Hotel ─────────────────────────────────────────────────────────────────

export async function fetchHotel(): Promise<Hotel> {
  return USE_MOCK ? mockApi.getHotel() : realFetch<Hotel>('/v1/hotels/me');
}

export async function saveHotel(patch: Partial<Hotel>): Promise<Hotel> {
  return USE_MOCK ? mockApi.updateHotel(patch) : realFetch<Hotel>('/v1/hotels', { method: 'PUT', body: JSON.stringify(patch) });
}

// ── Room types & Rooms ───────────────────────────────────────────────────

export async function fetchRoomTypes(hotelId: string): Promise<RoomType[]> {
  return USE_MOCK ? mockApi.listRoomTypes() : realFetch<RoomType[]>(`/v1/hotels/${hotelId}/room-types`);
}

export async function fetchRooms(hotelId: string): Promise<Room[]> {
  return USE_MOCK ? mockApi.listRooms() : realFetch<Room[]>(`/v1/hotels/${hotelId}/rooms`);
}

export async function createRoom(hotelId: string, input: { roomTypeId: string; number: string; floor?: number }): Promise<Room> {
  return USE_MOCK ? mockApi.createRoom(input) : realFetch<Room>(`/v1/hotels/${hotelId}/rooms`, { method: 'POST', body: JSON.stringify(input) });
}

export async function updateRoom(hotelId: string, roomId: string, patch: { status?: Room['status'] }): Promise<Room> {
  return USE_MOCK
    ? mockApi.updateRoom(roomId, patch)
    : realFetch<Room>(`/v1/hotels/${hotelId}/rooms/${roomId}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

// ── Guests ────────────────────────────────────────────────────────────────

export async function fetchGuests(hotelId: string): Promise<Guest[]> {
  return USE_MOCK ? mockApi.listGuests() : realFetch<Guest[]>(`/v1/hotels/${hotelId}/guests`);
}

export async function createGuest(
  hotelId: string,
  input: { firstName: string; lastName: string; email?: string; phone?: string },
): Promise<Guest> {
  return USE_MOCK ? mockApi.createGuest(input) : realFetch<Guest>(`/v1/hotels/${hotelId}/guests`, { method: 'POST', body: JSON.stringify(input) });
}

// ── Reservations ─────────────────────────────────────────────────────────

export async function fetchReservations(hotelId: string): Promise<Reservation[]> {
  return USE_MOCK ? mockApi.listReservations() : realFetch<Reservation[]>(`/v1/hotels/${hotelId}/reservations`);
}

export async function createReservation(
  hotelId: string,
  input: { guestId: string; roomId: string; checkInDate: string; checkOutDate: string },
): Promise<Reservation> {
  return USE_MOCK
    ? mockApi.createReservation(input)
    : realFetch<Reservation>(`/v1/hotels/${hotelId}/reservations`, { method: 'POST', body: JSON.stringify(input) });
}

export async function updateReservation(
  hotelId: string,
  id: string,
  patch: { status?: Reservation['status'] },
): Promise<Reservation> {
  return USE_MOCK
    ? mockApi.updateReservation(id, patch)
    : realFetch<Reservation>(`/v1/hotels/${hotelId}/reservations/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export type { User, Hotel, RoomType, Room, Guest, Reservation };
