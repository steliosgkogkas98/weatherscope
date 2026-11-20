/** A point on the globe. Everything that can be shown on the map has coordinates. */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** A named place, e.g. a geocoding result, a saved place or the user's location. */
export interface Place extends Coordinates {
  /** Stable id: geocoding id when available, otherwise derived from the coordinates. */
  id: string;
  name: string;
  country?: string;
  countryCode?: string;
  /** First-level region (state / province / periphery). */
  region?: string;
  timezone?: string;
  population?: number;
  /** True for the place created from the browser geolocation. */
  isCurrentLocation?: boolean;
}
