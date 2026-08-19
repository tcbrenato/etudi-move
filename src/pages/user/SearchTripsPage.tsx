import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { AppLayout } from '@/layouts/AppLayout';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { EmptyState, Spinner, Badge } from '@/components/ui/Feedback';
import { Search, MessageCircle, MessageSquare, Clock, MapPinned, Ruler } from 'lucide-react';
import { searchTrips, whatsAppLink, distanceKm } from '@/lib/trips';
import { directionLabel } from '@/utils/format';
import { useAuth } from '@/auth/AuthContext';
import type { TripWithDriver, TripDirection } from '@/types';

const navItems = [
  { to: '/dashboard', label: 'Accueil' },
  { to: '/trajets', label: 'Trajets' },
  { to: '/messages', label: 'Messages' },
  { to: '/profile', label: 'Profil' },
];

const originIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const COTONOU_CENTER: [number, number] = [6.3703, 2.3912];

type SortMode = 'time' | 'distance';

export function SearchTripsPage() {
  const { profile } = useAuth();
  const [activeChatTrip, setActiveChatTrip] = useState<TripWithDriver | null>(null);
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [direction, setDirection] = useState<TripDirection | 'all'>('all');
  const [date, setDate] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('time');
  const [trips, setTrips] = useState<TripWithDriver[]>([]);
  const [loading, setLoading] = useState(true);

  const [myPosition, setMyPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  async function runSearch() {
    setLoading(true);
    try {
      const data = await searchTrips({ originQuery, destinationQuery, onlyAvailable, direction, date });
      setTrips(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch();
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setMyPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortMode('distance');
        setLocating(false);
      },
      () => {
        setLocationError("Impossible d'accéder à votre position. Vérifiez les autorisations.");
        setLocating(false);
      }
    );
  }

  const sortedTrips = useMemo(() => {
    const list = [...trips];
    if (sortMode === 'distance' && myPosition) {
      list.sort(
        (a, b) =>
          distanceKm(myPosition.lat, myPosition.lng, a.origin_lat, a.origin_lng) -
          distanceKm(myPosition.lat, myPosition.lng, b.origin_lat, b.origin_lng)
      );
    } else {
      list.sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());
    }
    return list;
  }, [trips, sortMode, myPosition]);

  function contactMessage(trip: TripWithDriver): string {
    const when = new Date(trip.departure_time).toLocaleString('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    return `Bonjour ${trip.driver_first_name}, je vous contacte via Étudi'Move pour votre trajet ${trip.origin_address} → ${trip.destination_address} prévu le ${when}. Est-ce toujours disponible ?`;
  }

  return (
    <AppLayout navItems={navItems}>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-neutral-800">Rechercher un trajet</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Trouvez un étudiant en moto qui va dans votre direction.
        </p>

        <form onSubmit={handleSubmit} className="card mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="label">Départ</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: Godomey"
              value={originQuery}
              onChange={e => setOriginQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Destination</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: Campus d'Abomey-Calavi"
              value={destinationQuery}
              onChange={e => setDestinationQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Direction</label>
            <select
              className="input"
              value={direction}
              onChange={e => setDirection(e.target.value as TripDirection | 'all')}
            >
              <option value="all">Toutes les directions</option>
              <option value="to_campus">Vers le campus</option>
              <option value="from_campus">Depuis le campus</option>
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Trier par</label>
            <select
              className="input"
              value={sortMode}
              onChange={e => setSortMode(e.target.value as SortMode)}
            >
              <option value="time">Heure la plus proche</option>
              <option value="distance" disabled={!myPosition}>
                Proximité géographique{myPosition ? '' : ' (activez votre position)'}
              </option>
            </select>
          </div>
          <button type="submit" className="btn-primary">
            <Search className="h-4 w-4" />
            Rechercher
          </button>

          <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={e => setOnlyAvailable(e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              Afficher uniquement les trajets disponibles
            </label>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="btn-secondary !px-3 !py-1.5 text-xs ml-auto"
            >
              {locating ? <Spinner /> : <MapPinned className="h-3.5 w-3.5" />}
              {myPosition ? 'Position activée' : 'Utiliser ma position'}
            </button>
          </div>
          {locationError && (
            <p className="text-xs text-error-600 sm:col-span-3">{locationError}</p>
          )}
        </form>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="text-2xl text-primary-600" />
          </div>
        ) : sortedTrips.length === 0 ? (
          <EmptyState
            title="Aucun trajet trouvé"
            message="Essayez une autre adresse ou revenez plus tard — de nouveaux trajets sont publiés régulièrement."
          />
        ) : (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              {sortedTrips.map(trip => (
                <div key={trip.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-800">
                        {trip.origin_address}
                      </p>
                      <p className="text-xs text-neutral-400 my-0.5">↓</p>
                      <p className="text-sm font-medium text-neutral-800">
                        {trip.destination_address}
                      </p>
                    </div>
                    <Badge
                      className={
                        trip.is_available
                          ? 'bg-success-100 text-success-700 shrink-0'
                          : 'bg-neutral-100 text-neutral-500 shrink-0'
                      }
                    >
                      {trip.is_available ? 'Disponible' : 'Indisponible'}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(trip.departure_time).toLocaleString('fr-FR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <Badge className="bg-neutral-100 text-neutral-600">
                      {directionLabel(trip.direction)}
                    </Badge>
                    {myPosition && (
                      <span className="flex items-center gap-1.5">
                        <Ruler className="h-3.5 w-3.5" />
                        {distanceKm(myPosition.lat, myPosition.lng, trip.origin_lat, trip.origin_lng).toFixed(1)} km
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-neutral-600">
                      {trip.driver_first_name} {trip.driver_last_name}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveChatTrip(trip)}
                        className="btn-secondary !px-3 !py-1.5 text-xs"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Chat
                      </button>
                      <a
                        href={whatsAppLink(trip.driver_phone, contactMessage(trip))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-accent !px-3 !py-1.5 text-xs"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl overflow-hidden border border-neutral-200 h-[400px] lg:h-auto lg:sticky lg:top-20">
              <MapContainer center={COTONOU_CENTER} zoom={12} className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {sortedTrips.map(trip => (
                  <Marker
                    key={trip.id}
                    position={[trip.origin_lat, trip.origin_lng]}
                    icon={originIcon}
                  >
                    <Popup>
                      <p className="font-medium">{trip.origin_address}</p>
                      <p className="text-xs">→ {trip.destination_address}</p>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}
      </div>

      {activeChatTrip && profile && (
        <ChatPanel
          tripId={activeChatTrip.id}
          currentUserId={profile.id}
          peerId={activeChatTrip.driver_id}
          peerName={`${activeChatTrip.driver_first_name} ${activeChatTrip.driver_last_name}`}
          tripLabel={`${activeChatTrip.origin_address} → ${activeChatTrip.destination_address}`}
          onClose={() => setActiveChatTrip(null)}
        />
      )}
    </AppLayout>
  );
}
