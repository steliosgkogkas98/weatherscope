import { TemperatureUnit } from '../models/weather.model';

/**
 * Converts a temperature from °C (how all data is fetched) to the chosen unit.
 * @example convertTemperature(20, 'fahrenheit') // → 68
 */
export function convertTemperature(celsius: number, unit: TemperatureUnit): number {
  return unit === 'fahrenheit' ? celsius * (9 / 5) + 32 : celsius;
}

/**
 * Rounds and formats a temperature with its unit symbol.
 * @example formatTemperature(21.6, 'celsius') // → "22°C"
 */
export function formatTemperature(celsius: number, unit: TemperatureUnit): string {
  return `${Math.round(convertTemperature(celsius, unit))}°${unit === 'fahrenheit' ? 'F' : 'C'}`;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/**
 * Converts a wind direction in degrees to a compass point.
 * @example windDirectionLabel(225) // → "SW"
 */
export function windDirectionLabel(degrees: number): string {
  return COMPASS[Math.round((((degrees % 360) + 360) % 360) / 45) % 8];
}
