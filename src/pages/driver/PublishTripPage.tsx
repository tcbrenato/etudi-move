import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { AppLayout } from '@/layouts/AppLayout';
import { LocationPicker } from '@/components/map/LocationPicker';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Feedback';
import { Route, Trash2, Send, ArrowUpRight, ArrowDownLeft, Check, X, User } from 'lucide-react';
import {
  publishTrip,
  fetchMyTrips,
  setTripAvailability,
  deleteTrip,
} from '@/lib/trips';
import { fetchBookingsForDriver, updateBookingStatus } from '@/lib/bookings';
import {
  directionLabel,
  formatFcfa,
  paymentMethodLabel,
  paymentStatusColor,
  paymentStatusLabel,
} from '@/utils/format';
import type { GeoPoint, Trip, TripDirection, BookingWithDetails } from '@/types';

const navItems = [
  { to: '/driver', label: 'Dashboard' },
  { to: '/driver/trips', label: 'Mes trajets' },
  { to: '/messages', label: 'Messages' },
  { to: '/driver/profile', label: 'Profil' },
];

export function PublishTripPage() {
  const { profile } = useAuth();
  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [direction, setDirection] = useState<TripDirection>('to_campus');
  const [departureDate, setDepartureDate] = useState('');
  const [departureHour, setDepartureHour] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  async function loadTrips() {
    if (!profile) return;
    setLoadingTrips(true);
    try {
      const data = await fetchMyTrips(profile.id);
      setTrips(data);
    } finally {
      setLoadingTrips(false);
    }
  }

  async function loadBookings() {
    if (!profile) return;
    setLoadingBookings(true);
    try {
      const data = await fetchBookingsForDriver(profile.id);
      setBookings(data);
    } finally {
      setLoadingBookings(false);
    }
  }

  useEffect(() => {
    loadTrips();
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  async function respondToBooking(bookingId: string, status: 'accepted' | 'declined') {
    await updateBookingStatus(bookingId, status);
    await Promise.all([loadBookings(), loadTrips()]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    setSuccess(false);

    if (!origin || !destination) {
      setError('Choisissez un point de départ et une destination.');
      return;
    }
    if (!departureDate || !departureHour) {
      setError("Indiquez la date et l'heure de départ.");
      return;
    }

    const departure_time = new Date(`${departureDate}T${departureHour}:00`).toISOString();

    setSubmitting(true);
    try {
      await publishTrip({ driver_id: profile.id, origin, destination, departure_time, direction });
      setSuccess(true);
      setOrigin(null);
      setDestination(null);
      setDirection('to_campus');
      setDepartureDate('');
      setDepartureHour('');
      await loadTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de publier ce trajet.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleAvailability(trip: Trip) {
    await setTripAvailability(trip.id, !trip.is_available);
    await loadTrips();
  }

  async function handleDelete(trip: Trip) {
    if (!confirm('Supprimer ce trajet ?')) return;
    await deleteTrip(trip.id);
    await loadTrips();
  }

  if (!profile) return null;

  return (
    <AppLayout navItems={navItems}>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-neutral-800">Publier un trajet</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Indiquez votre point de départ, votre destination et l'heure exacte — les
          étudiants pourront vous trouver et vous contacter.
        </p>

        <form onSubmit={handleSubmit} className="card mt-6 space-y-5">
          <LocationPicker label="Point de départ" value={origin} onChange={setOrigin} />
          <LocationPicker label="Destination" value={destination} onChange={setDestination} />

          <div>
            <label className="label">Direction du trajet</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDirection('to_campus')}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  direction === 'to_campus'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                Vers le campus
              </button>
              <button
                type="button"
                onClick={() => setDirection('from_campus')}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  direction === 'from_campus'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                }`}
              >
                <ArrowDownLeft className="h-4 w-4" />
                Depuis le campus
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date de départ</label>
              <input
                type="date"
                className="input"
                value={departureDate}
                onChange={e => setDepartureDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div>
              <label className="label">Heure de départ</label>
              <input
                type="time"
                className="input"
                value={departureHour}
                onChange={e => setDepartureHour(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-error-600">{error}</p>}
          {success && <p className="text-sm text-success-600">Trajet publié avec succès !</p>}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? <Spinner /> : <Send className="h-4 w-4" />}
            Publier le trajet
          </button>
        </form>

        <h2 className="mt-10 text-lg font-semibold text-neutral-800">Demandes de réservation</h2>

        {loadingBookings ? (
          <div className="flex justify-center py-6">
            <Spinner className="text-xl text-primary-600" />
          </div>
        ) : bookings.filter(b => b.status === 'pending').length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">Aucune demande en attente pour le moment.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {bookings
              .filter(b => b.status === 'pending')
              .map(booking => (
                <div key={booking.id} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-800">
                        {booking.passenger_first_name} {booking.passenger_last_name} — {booking.passenger_phone}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {booking.origin_address} → {booking.destination_address} •{' '}
                        {new Date(booking.departure_time).toLocaleString('fr-FR', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-800">
                          {formatFcfa(booking.fare)}
                        </span>
                        <Badge className={paymentStatusColor(booking.payment_status)}>
                          {paymentMethodLabel(booking.payment_method)} ·{' '}
                          {paymentStatusLabel(booking.payment_status, booking.payment_method)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => respondToBooking(booking.id, 'accepted')}
                      className="btn-primary !px-3 !py-1.5 text-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Accepter
                    </button>
                    <button
                      type="button"
                      onClick={() => respondToBooking(booking.id, 'declined')}
                      className="btn-ghost !px-3 !py-1.5 text-xs text-error-500"
                    >
                      <X className="h-3.5 w-3.5" />
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        <h2 className="mt-10 text-lg font-semibold text-neutral-800">Mes trajets publiés</h2>

        {loadingTrips ? (
          <div className="flex justify-center py-10">
            <Spinner className="text-2xl text-primary-600" />
          </div>
        ) : trips.length === 0 ? (
          <EmptyState
            title="Aucun trajet publié"
            message="Publiez votre premier trajet ci-dessus pour être visible des étudiants."
          />
        ) : (
          <div className="mt-4 space-y-3">
            {trips.map(trip => (
              <div key={trip.id} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent-50 flex items-center justify-center shrink-0">
                    <Route className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-800">
                      {trip.origin_address} → {trip.destination_address}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {new Date(trip.departure_time).toLocaleString('fr-FR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-neutral-100 text-neutral-600">
                    {directionLabel(trip.direction)}
                  </Badge>
                  <Badge
                    className={
                      trip.is_available
                        ? 'bg-success-100 text-success-700'
                        : 'bg-neutral-100 text-neutral-500'
                    }
                  >
                    {trip.is_available ? 'Disponible' : 'Indisponible'}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => toggleAvailability(trip)}
                    className="btn-secondary !px-3 !py-1.5 text-xs"
                  >
                    {trip.is_available ? 'Signaler indisponible' : 'Signaler disponible'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(trip)}
                    className="btn-ghost !px-2.5 !py-1.5 text-error-500"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
