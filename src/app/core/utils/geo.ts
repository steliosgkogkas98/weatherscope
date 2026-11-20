import { Coordinates, Place } from '../models/location.model';

const EARTH_RADIUS_KM = 6371;

/**
 * Distance between two points on Earth in km (haversine formula).
 * @example distanceKm(athens, thessaloniki) // → ~300
 */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Finds the closest place from a list.
 * Used to label "My location" as "Near Thessaloniki", because Open-Meteo has no reverse geocoding.
 */
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

/**
 * CSS classes of the `flag-icons` package for a country (renders a real SVG flag).
 * @example flagClass('GR') // → "fi fi-gr"   (use: <span class="fi fi-gr"></span>)
 * @returns `null` when the country code is missing or invalid.
 */
export function flagClass(countryCode?: string): string | null {
  return countryCode && /^[a-z]{2}$/i.test(countryCode) ? `fi fi-${countryCode.toLowerCase()}` : null;
}
