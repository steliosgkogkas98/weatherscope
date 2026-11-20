import { Injectable } from '@angular/core';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const STORAGE_PREFIX = 'weatherscope:cache:';

/**
 * Small key/value cache where every entry expires after a TTL (time to live).
 *
 * Two layers:
 * 1. an in-memory `Map` (fastest), and
 * 2. `sessionStorage`, so a page refresh does not repeat the same API calls.
 *
 * Used by the weather and geocoding services to stay well below Open-Meteo's free limits.
 *
 * @example
 * cache.set('forecast:40.64,22.94', forecast, 15 * 60 * 1000); // keep for 15 minutes
 * cache.get<Forecast>('forecast:40.64,22.94');                // → forecast, or undefined if expired
 */
@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly memory = new Map<string, CacheEntry<unknown>>();

  /**
   * Reads a value from the cache.
   * @param key Unique cache key, e.g. `"snapshot:40.64,22.94"`.
   * @returns The stored value, or `undefined` when it is missing or expired.
   */
  get<T>(key: string): T | undefined {
    const entry = (this.memory.get(key) ?? this.readStorage(key)) as CacheEntry<T> | undefined;
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      this.delete(key);
      return undefined;
    }
    this.memory.set(key, entry);
    return entry.value;
  }

  /**
   * Stores a value in memory and in `sessionStorage`.
   * @param key Unique cache key.
   * @param value Any JSON-serialisable value.
   * @param ttlMs How long the value stays valid, in milliseconds.
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs };
    this.memory.set(key, entry);
    try {
      sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // Storage full or unavailable (e.g. private mode): the memory cache is enough.
    }
  }

  /**
   * Removes a value from both cache layers.
   * @param key Cache key to remove.
   */
  delete(key: string): void {
    this.memory.delete(key);
    try {
      sessionStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
      // ignore
    }
  }

  /** Reads and parses an entry from `sessionStorage`; returns `undefined` if missing or invalid. */
  private readStorage(key: string): CacheEntry<unknown> | undefined {
    try {
      const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
      return raw ? (JSON.parse(raw) as CacheEntry<unknown>) : undefined;
    } catch {
      return undefined;
    }
  }
}
