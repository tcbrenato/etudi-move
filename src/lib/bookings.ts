import { supabase } from '@/lib/supabase';
import type { BookingStatus, BookingWithDetails, PaymentMethod, PaymentStatus } from '@/types';

export interface BookingReceipt {
  fare: number;
  payment_status: PaymentStatus;
  payment_reference: string | null;
}

export async function createBooking(
  tripId: string,
  passengerId: string,
  paymentMethod: PaymentMethod,
  paymentPhone: string | null
): Promise<BookingReceipt> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      trip_id: tripId,
      passenger_id: passengerId,
      payment_method: paymentMethod,
      payment_phone: paymentPhone,
    })
    .select('fare, payment_status, payment_reference')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Vous avez déjà une réservation en cours pour ce trajet.');
    }
    throw new Error(error.message);
  }
  return data as BookingReceipt;
}

export async function fetchMyBookings(passengerId: string): Promise<BookingWithDetails[]> {
  const { data, error } = await supabase
    .from('bookings_with_details')
    .select('*')
    .eq('passenger_id', passengerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as BookingWithDetails[];
}

export async function fetchBookingsForDriver(driverId: string): Promise<BookingWithDetails[]> {
  const { data, error } = await supabase
    .from('bookings_with_details')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as BookingWithDetails[];
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
  const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId);
  if (error) throw new Error(error.message);
}
