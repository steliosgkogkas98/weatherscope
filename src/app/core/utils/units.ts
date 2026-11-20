import { TemperatureUnit } from '../models/weather.model';

/** All data is fetched in °C once; switching units is a pure UI concern (no new requests). */
export function convertTemperature(celsius: number, unit: TemperatureUnit): number {
  return unit === 'fahrenheit' ? celsius * (9 / 5) + 32 : celsius;
}

export function formatTemperature(celsius: number, unit: TemperatureUnit): string {
  return `${Math.round(convertTemperature(celsius, unit))}°${unit === 'fahrenheit' ? 'F' : 'C'}`;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** 0–360° → compass point, e.g. 225 → "SW". */
export function windDirectionLabel(degrees: number): string {
  return COMPASS[Math.round((((degrees % 360) + 360) % 360) / 45) % 8];
}
