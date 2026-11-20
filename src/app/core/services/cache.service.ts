import { Injectable } from '@angular/core';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const STORAGE_PREFIX = 'weatherscope:cache:';

/**
 * Small TTL cache: an in-memory Map, backed by sessionStorage so a page refresh
 * does not trigger the same API calls again. Keeps us well below Open-Meteo's free limits.
 */
@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly memory = new Map<string, CacheEntry<unknown>>();

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

  set<T>(key: string, value: T, ttlMs: number): void {
    const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs };
    this.memory.set(key, entry);
    try {
      sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // Storage full or unavailable (e.g. private mode): the memory cache is enough.
    }
  }

  delete(key: string): void {
    this.memory.delete(key);
    try {
      sessionStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
      // ignore
    }
  }

  private readStorage(key: string): CacheEntry<unknown> | undefined {
    try {
      const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
      return raw ? (JSON.parse(raw) as CacheEntry<unknown>) : undefined;
    } catch {
      return undefined;
    }
  }
}
