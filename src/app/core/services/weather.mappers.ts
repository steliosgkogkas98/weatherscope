import { Place } from '../models/location.model';
import { Forecast, WeatherSnapshot } from '../models/weather.model';
import {
  RawForecastResponse,
  RawGeocodingResult,
  RawSnapshotResponse,
} from './open-meteo.types';

/** Pure functions: API shape → app model. Kept separate so they are easy to unit test. */

export function mapForecast(raw: RawForecastResponse): Forecast {
  const { current, hourly, daily } = raw;
  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    timezone: raw.timezone,
    utcOffsetSeconds: raw.utc_offset_seconds,
    current: {
      time: current.time,
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      weatherCode: current.weather_code,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      isDay: current.is_day === 1,
    },
    hourly: hourly.time.map((time, i) => ({
      time,
      temperature: hourly.temperature_2m[i],
      precipitationProbability: hourly.precipitation_probability[i] ?? 0,
      weatherCode: hourly.weather_code[i],
      isDay: hourly.is_day[i] === 1,
    })),
    daily: daily.time.map((date, i) => ({
      date,
      weatherCode: daily.weather_code[i],
      temperatureMax: daily.temperature_2m_max[i],
      temperatureMin: daily.temperature_2m_min[i],
      precipitationSum: daily.precipitation_sum[i],
      precipitationProbabilityMax: daily.precipitation_probability_max[i] ?? 0,
      sunrise: daily.sunrise[i],
      sunset: daily.sunset[i],
    })),
  };
}

export function mapSnapshot(raw: RawSnapshotResponse): WeatherSnapshot {
  return {
    temperature: raw.current.temperature_2m,
    weatherCode: raw.current.weather_code,
    isDay: raw.current.is_day === 1,
    windSpeed: raw.current.wind_speed_10m,
    hours: raw.hourly.time.map((time, i) => ({
      time,
      temperature: raw.hourly.temperature_2m[i],
      weatherCode: raw.hourly.weather_code[i],
      isDay: raw.hourly.is_day[i] === 1,
    })),
  };
}

export function mapGeocodingResult(raw: RawGeocodingResult): Place {
  return {
    id: String(raw.id),
    name: raw.name,
    latitude: raw.latitude,
    longitude: raw.longitude,
    country: raw.country,
    countryCode: raw.country_code,
    region: raw.admin1,
    timezone: raw.timezone,
    population: raw.population,
  };
}
