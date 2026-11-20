import { Pipe, PipeTransform } from '@angular/core';

import { TemperatureUnit } from '../models/weather.model';
import { convertTemperature } from '../utils/units';

/**
 * `{{ 21.4 | temperature: unit }}` → "21°" (or "71°" in Fahrenheit).
 * Pure pipe: recalculates only when the value or the unit changes.
 */
@Pipe({ name: 'temperature' })
export class TemperaturePipe implements PipeTransform {
  transform(celsius: number | null | undefined, unit: TemperatureUnit, withUnit = false): string {
    if (celsius == null || Number.isNaN(celsius)) return '–';
    const value = Math.round(convertTemperature(celsius, unit));
    return withUnit ? `${value}°${unit === 'fahrenheit' ? 'F' : 'C'}` : `${value}°`;
  }
}
