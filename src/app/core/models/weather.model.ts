/** Current conditions for one place. Temperatures are always stored in °C, wind in km/h. */
export interface CurrentConditions {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  isDay: boolean;
}

export interface HourlyForecast {
  /** Local time of the place, ISO format without offset (e.g. 2026-11-20T14:00). */
  time: string;
  temperature: number;
  precipitationProbability: number;
  weatherCode: number;
  isDay: boolean;
}

export interface DailyForecast {
  /** Local date of the place (YYYY-MM-DD). */
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  sunrise: string;
  sunset: string;
}

/** Full forecast used by the place details panel. */
export interface Forecast {
  latitude: number;
  longitude: number;
  timezone: string;
  utcOffsetSeconds: number;
  current: CurrentConditions;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

/** One hour of the lightweight map forecast. `time` is a unix timestamp (seconds, UTC). */
export interface SnapshotHour {
  time: number;
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}

/**
 * Lightweight weather for map markers: current conditions plus the next 24 hours,
 * so the time slider can move through the day without any extra requests.
 */
export interface WeatherSnapshot {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  windSpeed: number;
  hours: SnapshotHour[];
}

export type TemperatureUnit = 'celsius' | 'fahrenheit';
