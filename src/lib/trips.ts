import { supabase } from '@/lib/supabase';
import type { Trip, TripWithDriver, TripDirection, GeoPoint } from '@/types';

export interface PublishTripInput {
  driver_id: string;
  origin: GeoPoint;
  destination: GeoPoint;
  departure_time: string;
  direction: TripDirection;
}

export async function publishTrip(input: PublishTripInput): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert({
      driver_id: input.driver_id,
      origin_address: input.origin.address,
      origin_lat: input.origin.lat,
      origin_lng: input.origin.lng,
      destination_address: input.destination.address,
      destination_lat: input.destination.lat,
      destination_lng: input.destination.lng,
      departure_time: input.departure_time,
      direction: input.direction,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Trip;
}

export async function fetchMyTrips(driverId: string): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('driver_id', driverId)
    .order('departure_time', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Trip[];
}

export async function setTripAvailability(tripId: string, isAvailable: boolean): Promise<void> {
  const { error } = await supabase
    .from('trips')
    .update({ is_available: isAvailable })
    .eq('id', tripId);

  if (error) throw new Error(error.message);
}

export async function deleteTrip(tripId: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', tripId);
  if (error) throw new Error(error.message);
}

export interface SearchTripsFilters {
  originQuery?: string;
  destinationQuery?: string;
  onlyAvailable?: boolean;
  direction?: TripDirection | 'all';
  date?: string;
}

export async function searchTrips(filters: SearchTripsFilters): Promise<TripWithDriver[]> {
  let query = supabase
    .from('trips_with_driver')
    .select('*')
    .order('departure_time', { ascending: true });

  if (filters.onlyAvailable) {
    query = query.eq('is_available', true);
  }
  if (filters.originQuery) {
    query = query.ilike('origin_address', `%${filters.originQuery}%`);
  }
  if (filters.destinationQuery) {
    query = query.ilike('destination_address', `%${filters.destinationQuery}%`);
  }
  if (filters.direction && filters.direction !== 'all') {
    query = query.eq('direction', filters.direction);
  }
  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00`).toISOString();
    const end = new Date(`${filters.date}T23:59:59.999`).toISOString();
    query = query.gte('departure_time', start).lte('departure_time', end);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as TripWithDriver[];
}

/** Great-circle distance in kilometers between two lat/lng points. */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function whatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  const normalized = digits.startsWith('+') ? digits.slice(1) : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
