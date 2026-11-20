import { Coordinates, Place } from '../models/location.model';

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two points (haversine formula). */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Closest place from a list. Used to label "My location" without a reverse-geocoding API. */
export function nearestPlace(point: Coordinates, places: Place[]): Place | undefined {
  let best: Place | undefined;
  let bestDistance = Infinity;
  for (const place of places) {
    const d = distanceKm(point, place);
    if (d < bestDistance) {
      best = place;
      bestDistance = d;
    }
  }
  return best;
}

/** "GR" → 🇬🇷 (regional indicator symbols). */
export function countryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '🏳️';
  return String.fromCodePoint(
    ...[...countryCode.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65),
  );
}
