import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Spinner, Badge } from '@/components/ui/Feedback';
import { fetchMyBookings, updateBookingStatus } from '@/lib/bookings';
import {
  bookingStatusColor,
  bookingStatusLabel,
  formatFcfa,
  paymentMethodLabel,
  paymentStatusColor,
  paymentStatusLabel,
} from '@/utils/format';
import type { BookingWithDetails } from '@/types';

export function MyBookingsSection({ passengerId }: { passengerId: string }) {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setBookings(await fetchMyBookings(passengerId));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger vos réservations.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passengerId]);

  async function handleCancel(booking: BookingWithDetails) {
    if (!confirm('Annuler cette réservation ? Un paiement Mobile Money sera remboursé.')) return;
    try {
      await updateBookingStatus(booking.id, 'cancelled');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'annuler cette réservation.");
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-neutral-800">Mes réservations</h2>

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner className="text-xl text-primary-600" />
        </div>
      ) : error ? (
        <p className="mt-2 text-sm text-error-600">{error}</p>
      ) : bookings.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">
          Aucune réservation pour le moment.{' '}
          <Link to="/trajets" className="text-primary-600 hover:text-primary-700 font-medium">
            Rechercher un trajet
          </Link>
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-neutral-800">
                    {b.origin_address.split(',')[0]} → {b.destination_address.split(',')[0]}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {new Date(b.departure_time).toLocaleString('fr-FR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}{' '}
                    • Conducteur : {b.driver_first_name} {b.driver_last_name}
                    {b.status === 'accepted' && ` • ${b.driver_phone}`}
                  </p>
                </div>
                <Badge className={`shrink-0 ${bookingStatusColor(b.status)}`}>
                  {bookingStatusLabel(b.status)}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-neutral-800">{formatFcfa(b.fare)}</span>
                <Badge className={paymentStatusColor(b.payment_status)}>
                  {paymentMethodLabel(b.payment_method)} ·{' '}
                  {paymentStatusLabel(b.payment_status, b.payment_method)}
                </Badge>
                {b.payment_reference && (
                  <span className="font-mono text-xs text-neutral-400">{b.payment_reference}</span>
                )}
                {b.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleCancel(b)}
                    className="btn-ghost !px-3 !py-1.5 text-xs text-error-500 ml-auto"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
