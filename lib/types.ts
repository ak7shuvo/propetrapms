// Types mirror PETRAPMS-CONTRACT.md exactly. Do not rename fields here
// without updating the contract file too — the backend session builds
// against those exact names.

export type Role = 'HOTEL_ADMIN' | 'FRONT_DESK' | 'HOUSEKEEPING' | 'BILLING';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface Hotel {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

export interface RoomType {
  id: string;
  name: string;
  baseRate: number;
  maxOccupancy: number;
}

export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export interface Room {
  id: string;
  number: string;
  floor: number | null;
  status: RoomStatus;
  roomType: RoomType;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Reservation {
  id: string;
  guest: Guest;
  room: Room;
  checkInDate: string;
  checkOutDate: string;
  status: ReservationStatus;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}
