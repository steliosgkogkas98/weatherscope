import { Coordinates } from '../models/location.model';

/**
 * Rounds coordinates to 2 decimals (~1 km). Weather models have a much coarser grid,
 * so two points this close get the same forecast. Rounding gives us better cache hits.
 */
export function roundCoord(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Cache / map key for a coordinate pair, e.g. "40.64,22.94". */
export function coordKey({ latitude, longitude }: Coordinates): string {
  return `${roundCoord(latitude)},${roundCoord(longitude)}`;
}
