export interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Bias results toward Bénin without hard-restricting them.
const COUNTRY_CODES = 'bj';

export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 3) return [];

  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '0',
    limit: '5',
    countrycodes: COUNTRY_CODES,
  });

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) return [];

  const results = (await response.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;

  return results.map(r => ({
    address: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'jsonv2',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  const result = (await response.json()) as { display_name?: string };
  return result.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
