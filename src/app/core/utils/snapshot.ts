import { WeatherSnapshot } from '../models/weather.model';

export interface PointInTime {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}

/**
 * Weather of a snapshot `hourOffset` hours from now.
 * 0 → current conditions; otherwise the hourly entry closest to that moment.
 * Uses absolute timestamps, so snapshots cached at different times still line up.
 */
export function weatherAt(snapshot: WeatherSnapshot, hourOffset: number, now = Date.now()): PointInTime {
  if (hourOffset === 0 || snapshot.hours.length === 0) {
    return {
      temperature: snapshot.temperature,
      weatherCode: snapshot.weatherCode,
      isDay: snapshot.isDay,
    };
  }

  const target = now / 1000 + hourOffset * 3600;
  let best = snapshot.hours[0];
  for (const hour of snapshot.hours) {
    if (Math.abs(hour.time - target) < Math.abs(best.time - target)) {
      best = hour;
    }
  }
  return { temperature: best.temperature, weatherCode: best.weatherCode, isDay: best.isDay };
}
