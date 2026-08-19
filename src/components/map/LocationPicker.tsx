import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Loader2 } from 'lucide-react';
import { geocodeAddress, reverseGeocode, type GeocodeResult } from '@/lib/geocode';
import type { GeoPoint } from '@/types';

// Fix default marker icons breaking under Vite bundling.
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const COTONOU_CENTER: [number, number] = [6.3703, 2.3912];

interface LocationPickerProps {
  label: string;
  value: GeoPoint | null;
  onChange: (point: GeoPoint) => void;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({ label, value, onChange }: LocationPickerProps) {
  const [query, setQuery] = useState(value?.address ?? '');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query === value?.address) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const results = await geocodeAddress(query);
      setSuggestions(results);
      setSearching(false);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function selectSuggestion(result: GeocodeResult) {
    setQuery(result.address);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange({ lat: result.lat, lng: result.lng, address: result.address });
  }

  async function handleMapPick(lat: number, lng: number) {
    const address = await reverseGeocode(lat, lng);
    setQuery(address);
    setSuggestions([]);
    onChange({ lat, lng, address });
  }

  const center: [number, number] = value ? [value.lat, value.lng] : COTONOU_CENTER;

  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
          <MapPin className="h-4 w-4" />
        </span>
        <input
          type="text"
          className="input pl-10"
          placeholder="Tapez une adresse (ex: Godomey, Carrefour Sainte Rita…)"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-card max-h-56 overflow-auto">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-primary-50"
                  onClick={() => selectSuggestion(s)}
                >
                  {s.address}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-2 rounded-lg overflow-hidden border border-neutral-200 h-56">
        <MapContainer center={center} zoom={value ? 15 : 12} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handleMapPick} />
          {value && <Marker position={[value.lat, value.lng]} icon={markerIcon} />}
        </MapContainer>
      </div>
      <p className="mt-1 text-xs text-neutral-400">
        Cliquez sur la carte pour ajuster précisément le point.
      </p>
    </div>
  );
}
