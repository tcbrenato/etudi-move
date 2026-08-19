export type UserRole = 'user' | 'driver' | 'admin';

export type AccountStatus = 'active' | 'suspended' | 'pending';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  profile_photo: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  total_users: number;
  total_drivers: number;
  total_admins: number;
}

export type TripDirection = 'to_campus' | 'from_campus';

export interface Trip {
  id: string;
  driver_id: string;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  departure_time: string;
  direction: TripDirection;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface TripWithDriver extends Trip {
  driver_first_name: string;
  driver_last_name: string;
  driver_phone: string;
  driver_photo: string | null;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  address: string;
}

export interface Message {
  id: string;
  trip_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface ConversationSummary {
  trip_id: string;
  peer_id: string;
  origin_address: string;
  destination_address: string;
  departure_time: string;
  driver_id: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  peer_first_name: string;
  peer_last_name: string;
  peer_phone: string;
  peer_photo: string | null;
}
