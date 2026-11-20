import { Coordinates } from '../models/location.model';

/**
 * Rounds a coordinate to 2 decimals (~1 km).
 * Weather models have a much coarser grid, so two points this close get the same forecast.
 * Rounding gives us more cache hits.
 *
 * @example roundCoord(40.64012) // → 40.64
 */
export function roundCoord(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Builds the key used for caching and for the snapshot `Map`.
 * @example coordKey({ latitude: 40.6401, longitude: 22.9444 }) // → "40.64,22.94"
 */
export function coordKey({ latitude, longitude }: Coordinates): string {
  return `${roundCoord(latitude)},${roundCoord(longitude)}`;
}
