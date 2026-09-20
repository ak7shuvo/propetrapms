import type {
  User, Hotel, RoomType, Room, Guest, Reservation, Role,
} from './types';

/**
 * Mock backend for Phase 1 (Frontend). Simulates the exact endpoints in
 * PETRAPMS-CONTRACT.md with in-memory data and a small artificial delay,
 * so every screen works end-to-end without the Phase 2 backend existing
 * yet. Swap to the real API by setting NEXT_PUBLIC_USE_MOCK=false and
 * NEXT_PUBLIC_API_URL — see api-client.ts.
 */

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10);

let currentUser: User | null = null;

const hotel: Hotel = {
  id: 'hotel-1',
  name: 'Sunrise Bay Resort',
  address: 'Cox\'s Bazar, Bangladesh',
  phone: '+880 1XXXXXXXXX',
};

const roomTypes: RoomType[] = [
  { id: 'rt-1', name: 'Standard Twin', baseRate: 3500, maxOccupancy: 2 },
  { id: 'rt-2', name: 'Deluxe', baseRate: 5500, maxOccupancy: 3 },
  { id: 'rt-3', name: 'Suite', baseRate: 9000, maxOccupancy: 4 },
];

let rooms: Room[] = [
  { id: 'r-101', number: '101', floor: 1, status: 'AVAILABLE', roomType: roomTypes[0] },
  { id: 'r-102', number: '102', floor: 1, status: 'OCCUPIED', roomType: roomTypes[0] },
  { id: 'r-204', number: '204', floor: 2, status: 'OCCUPIED', roomType: roomTypes[1] },
  { id: 'r-216', number: '216', floor: 2, status: 'MAINTENANCE', roomType: roomTypes[1] },
  { id: 'r-301', number: '301', floor: 3, status: 'AVAILABLE', roomType: roomTypes[2] },
];

let guests: Guest[] = [
  { id: 'g-1', firstName: 'Rahman', lastName: 'Khan', email: 'rahman@example.com', phone: '017XXXXXXXX' },
  { id: 'g-2', firstName: 'Farhana', lastName: 'Chowdhury', email: 'farhana@example.com', phone: '018XXXXXXXX' },
  { id: 'g-3', firstName: 'Karim', lastName: 'Ahmed', email: null, phone: '019XXXXXXXX' },
];

let reservations: Reservation[] = [
  { id: 'res-1', guest: guests[0], room: rooms[2], checkInDate: '2026-09-20', checkOutDate: '2026-09-23', status: 'CONFIRMED' },
  { id: 'res-2', guest: guests[1], room: rooms[4], checkInDate: '2026-09-20', checkOutDate: '2026-09-22', status: 'PENDING' },
  { id: 'res-3', guest: guests[2], room: rooms[1], checkInDate: '2026-09-17', checkOutDate: '2026-09-20', status: 'CONFIRMED' },
];

function fakeToken(user: User) {
  return `mock.${btoa(JSON.stringify({ sub: user.id, role: user.role }))}.token`;
}

export const mockApi = {
  // Mirrors what the real backend does when a JWT is revoked/discarded:
  // the "session" (in this mock, the in-memory user) must actually end.
  // Without this, a client-side nav back into a protected route after
  // logout would silently re-authenticate off stale module state even
  // though the browser has no token anymore.
  logout() {
    currentUser = null;
  },

  async registerTenant(input: { tenantName: string; adminEmail: string; adminPassword: string; firstName: string; lastName: string }) {
    await delay();
    hotel.name = input.tenantName;
    currentUser = { id: uid(), email: input.adminEmail, firstName: input.firstName, lastName: input.lastName, role: 'HOTEL_ADMIN' };
    return { accessToken: fakeToken(currentUser), user: currentUser };
  },

  async login(email: string, _password: string) {
    await delay();
    currentUser = currentUser ?? { id: uid(), email, firstName: 'Demo', lastName: 'User', role: 'HOTEL_ADMIN' };
    currentUser = { ...currentUser, email };
    return { accessToken: fakeToken(currentUser), user: currentUser };
  },

  async me() {
    await delay(100);

    // Mock mode must behave like the real JWT-backed /v1/auth/me endpoint.
    // The API client persists the session in localStorage, so restore the
    // user after a full page reload instead of relying on this module's
    // in-memory state.
    if (!currentUser && typeof window !== 'undefined') {
      const token = window.localStorage.getItem('petrapms_token');
      const raw = window.localStorage.getItem('petrapms_user');
      if (token && raw) {
        try {
          currentUser = JSON.parse(raw) as User;
        } catch {
          window.localStorage.removeItem('petrapms_user');
          window.localStorage.removeItem('petrapms_token');
        }
      }
    }

    if (!currentUser) throw { statusCode: 401, message: 'Not authenticated', error: 'Unauthorized' };
    return currentUser;
  },

  async getHotel() {
    await delay();
    return hotel;
  },

  async updateHotel(patch: Partial<Hotel>) {
    await delay();
    Object.assign(hotel, patch);
    return hotel;
  },

  async listRoomTypes() {
    await delay();
    return roomTypes;
  },

  async listRooms() {
    await delay();
    return rooms;
  },

  async createRoom(input: { roomTypeId: string; number: string; floor?: number }) {
    await delay();
    const rt = roomTypes.find((t) => t.id === input.roomTypeId) ?? roomTypes[0];
    const room: Room = { id: uid(), number: input.number, floor: input.floor ?? null, status: 'AVAILABLE', roomType: rt };
    rooms = [...rooms, room];
    return room;
  },

  async updateRoom(roomId: string, patch: { status?: Room['status'] }) {
    await delay();
    rooms = rooms.map((r) => (r.id === roomId ? { ...r, ...patch } : r));
    return rooms.find((r) => r.id === roomId)!;
  },

  async listGuests() {
    await delay();
    return guests;
  },

  async createGuest(input: { firstName: string; lastName: string; email?: string; phone?: string }) {
    await delay();
    const guest: Guest = { id: uid(), firstName: input.firstName, lastName: input.lastName, email: input.email ?? null, phone: input.phone ?? null };
    guests = [...guests, guest];
    return guest;
  },

  async listReservations() {
    await delay();
    return reservations;
  },

  async createReservation(input: { guestId: string; roomId: string; checkInDate: string; checkOutDate: string }) {
    await delay();
    const guest = guests.find((g) => g.id === input.guestId)!;
    const room = rooms.find((r) => r.id === input.roomId)!;
    const reservation: Reservation = {
      id: uid(), guest, room, checkInDate: input.checkInDate, checkOutDate: input.checkOutDate, status: 'PENDING',
    };
    reservations = [...reservations, reservation];
    return reservation;
  },

  async updateReservation(id: string, patch: { status?: Reservation['status'] }) {
    await delay();
    reservations = reservations.map((r) => (r.id === id ? { ...r, ...patch } : r));
    return reservations.find((r) => r.id === id)!;
  },
};
