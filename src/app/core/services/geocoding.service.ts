import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';

import { Place } from '../models/location.model';
import { CacheService } from './cache.service';
import { RawGeocodingResponse } from './open-meteo.types';
import { mapGeocodingResult } from './weather.mappers';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/** Place names don't change, so search results can be cached for a long time. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** The API needs at least 2 characters (3+ enables fuzzy matching). */
export const MIN_QUERY_LENGTH = 2;

/** Finds places by name with the Open-Meteo Geocoding API. Results are cached for 24 hours. */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(CacheService);

  /**
   * Searches cities, towns and villages by name.
   *
   * @param query Text typed by the user. Fewer than {@link MIN_QUERY_LENGTH} characters returns `[]` without a request.
   * @param count Maximum number of results (default 8).
   * @returns Observable of matching places, most relevant first.
   *
   * @example
   * geocoding.search('Bergen').subscribe((places) => places[0].country); // "Norway"
   */
  search(query: string, count = 8): Observable<Place[]> {
    const term = query.trim();
    if (term.length < MIN_QUERY_LENGTH) {
      return of([]);
    }

    const key = `geocode:${term.toLowerCase()}:${count}`;
    const cached = this.cache.get<Place[]>(key);
    if (cached) {
      return of(cached);
    }

    const params = new HttpParams({
      fromObject: { name: term, count, language: 'en', format: 'json' },
    });

    return this.http.get<RawGeocodingResponse>(GEOCODING_URL, { params }).pipe(
      map((response) => (response.results ?? []).map(mapGeocodingResult)),
      tap((places) => this.cache.set(key, places, CACHE_TTL_MS)),
    );
  }
}
