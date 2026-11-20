import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, tap } from 'rxjs';

import { Coordinates } from '../models/location.model';
import { Forecast, WeatherSnapshot } from '../models/weather.model';
import { coordKey, roundCoord } from '../utils/coords';
import { CacheService } from './cache.service';
import { RawForecastResponse, RawSnapshotResponse } from './open-meteo.types';
import { mapForecast, mapSnapshot } from './weather.mappers';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

/** Open-Meteo models update hourly at most, so 15 minutes is a safe cache window. */
const CACHE_TTL_MS = 15 * 60 * 1000;

/** Max locations per batched request, keeps the URL a reasonable length. */
const BATCH_SIZE = 50;

/**
 * Loads weather data from the Open-Meteo Forecast API.
 *
 * - {@link WeatherService.getForecast} → full forecast for ONE place (details panel).
 * - {@link WeatherService.getSnapshots} → light data for MANY places in one request (map markers, My World).
 *
 * Every response is cached for 15 minutes (see {@link CacheService}).
 */
@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(CacheService);

  /**
   * Full forecast for one place: current conditions, the next 24 hours and 7 days.
   * Returns the cached forecast immediately when available (no request).
   *
   * @param point Coordinates of the place.
   * @returns Observable that emits the {@link Forecast} once.
   *
   * @example
   * weather.getForecast({ latitude: 40.64, longitude: 22.94 })
   *   .subscribe((f) => console.log(f.current.temperature)); // 14.2
   */
  getForecast(point: Coordinates): Observable<Forecast> {
    const key = `forecast:${coordKey(point)}`;
    const cached = this.cache.get<Forecast>(key);
    if (cached) {
      return of(cached);
    }

    const params = new HttpParams({
      fromObject: {
        latitude: roundCoord(point.latitude),
        longitude: roundCoord(point.longitude),
        current:
          'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day',
        hourly: 'temperature_2m,precipitation_probability,weather_code,is_day',
        daily:
          'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset',
        forecast_hours: 24,
        forecast_days: 7,
        timezone: 'auto',
      },
    });

    return this.http.get<RawForecastResponse>(FORECAST_URL, { params }).pipe(
      map(mapForecast),
      tap((forecast) => this.cache.set(key, forecast, CACHE_TTL_MS)),
    );
  }

  /**
   * Lightweight weather (current + next 24 hours) for many points at once.
   *
   * 1. Points already in the cache are returned from it.
   * 2. Only the missing points are requested, all in ONE batched call
   *    (Open-Meteo accepts comma-separated coordinate lists), split into chunks of 50.
   *
   * @param points Places to load, in any order. Duplicates are fine.
   * @returns Observable of a `Map` keyed by {@link coordKey}, e.g. `"40.64,22.94"`.
   *
   * @example
   * weather.getSnapshots([athens, oslo]).subscribe((map) => map.get('59.91,10.75')?.temperature);
   */
  getSnapshots(points: Coordinates[]): Observable<Map<string, WeatherSnapshot>> {
    const result = new Map<string, WeatherSnapshot>();
    const missing = new Map<string, Coordinates>();

    for (const point of points) {
      const key = coordKey(point);
      const cached = this.cache.get<WeatherSnapshot>(`snapshot:${key}`);
      if (cached) {
        result.set(key, cached);
      } else {
        missing.set(key, point);
      }
    }

    if (missing.size === 0) {
      return of(result);
    }

    const batches = chunk([...missing.entries()], BATCH_SIZE).map((batch) =>
      this.fetchSnapshotBatch(batch),
    );

    return forkJoin(batches).pipe(
      map((fetched) => {
        for (const [key, snapshot] of fetched.flat()) {
          result.set(key, snapshot);
        }
        return result;
      }),
    );
  }

  /**
   * Requests one batch of points and caches each result.
   * @param batch Pairs of `[cacheKey, coordinates]`.
   * @returns The `[cacheKey, snapshot]` pairs in the same order as requested.
   */
  private fetchSnapshotBatch(
    batch: [string, Coordinates][],
  ): Observable<[string, WeatherSnapshot][]> {
    const params = new HttpParams({
      fromObject: {
        latitude: batch.map(([, p]) => roundCoord(p.latitude)).join(','),
        longitude: batch.map(([, p]) => roundCoord(p.longitude)).join(','),
        current: 'temperature_2m,weather_code,is_day,wind_speed_10m',
        hourly: 'temperature_2m,weather_code,is_day',
        forecast_hours: 24,
        // Unix timestamps line up the hours of every place, so the map time slider
        // can show "the same moment" all over the world.
        timeformat: 'unixtime',
      },
    });

    return this.http.get<RawSnapshotResponse | RawSnapshotResponse[]>(FORECAST_URL, { params }).pipe(
      // One location → object, several → array (same order as requested).
      map((raw) => (Array.isArray(raw) ? raw : [raw])),
      map((rawList) =>
        rawList.map((raw, i): [string, WeatherSnapshot] => {
          const key = batch[i][0];
          const snapshot = mapSnapshot(raw);
          this.cache.set(`snapshot:${key}`, snapshot, CACHE_TTL_MS);
          return [key, snapshot];
        }),
      ),
    );
  }
}

/**
 * Splits an array into smaller arrays.
 * @example chunk([1, 2, 3, 4, 5], 2) // → [[1, 2], [3, 4], [5]]
 */
function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
