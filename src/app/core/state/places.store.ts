import { computed, effect, Injectable, signal } from '@angular/core';

import { Place } from '../models/location.model';
import { TemperatureUnit } from '../models/weather.model';

const SAVED_KEY = 'weatherscope:saved-places';
const UNIT_KEY = 'weatherscope:unit';

/** A request for the map to move. `seq` makes repeated requests for the same place re-trigger. */
export interface FocusRequest {
  place: Place;
  zoom: number;
  seq: number;
}

/**
 * Global application state, built with Angular signals.
 *
 * Any component can `inject(PlacesStore)`, read a signal (e.g. `store.unit()`)
 * and the template updates automatically when it changes.
 * The state is small, so a full state library (NgRx etc.) would be overkill.
 *
 * Persisted in `localStorage`: saved places and the temperature unit.
 */
@Injectable({ providedIn: 'root' })
export class PlacesStore {
  /** Places the user collected: "my picture of the world's weather". Persisted in localStorage. */
  readonly saved = signal<Place[]>(readJson<Place[]>(SAVED_KEY) ?? []);
  /** Place currently open in the details panel. */
  readonly selected = signal<Place | null>(null);
  /** Place created from the browser geolocation. */
  readonly currentLocation = signal<Place | null>(null);
  readonly unit = signal<TemperatureUnit>(readJson<TemperatureUnit>(UNIT_KEY) ?? 'celsius');
  /** Whether the "My World" drawer is open. */
  readonly myWorldOpen = signal(false);
  /** Hours from now shown on the map (0 = now). Driven by the time slider. */
  readonly hourOffset = signal(0);

  private readonly focusState = signal<FocusRequest | null>(null);
  readonly focusRequest = this.focusState.asReadonly();

  readonly savedIds = computed(() => new Set(this.saved().map((p) => p.id)));

  constructor() {
    effect(() => writeJson(SAVED_KEY, this.saved()));
    effect(() => writeJson(UNIT_KEY, this.unit()));
  }

  /** @returns `true` if the place is in My World. */
  isSaved(place: Place): boolean {
    return this.savedIds().has(place.id);
  }

  /** Adds the place to My World, or removes it if it is already there. */
  toggleSaved(place: Place): void {
    this.saved.update((list) =>
      list.some((p) => p.id === place.id) ? list.filter((p) => p.id !== place.id) : [...list, place],
    );
  }

  /** Removes a place from My World. */
  remove(place: Place): void {
    this.saved.update((list) => list.filter((p) => p.id !== place.id));
  }

  /**
   * Opens a place in the details panel (without moving the map).
   * @param place The place to show, or `null` to close the panel.
   */
  select(place: Place | null): void {
    this.selected.set(place);
  }

  /**
   * Opens a place in the details panel AND flies the map to it.
   * @param place Place to explore.
   * @param zoom Minimum zoom level to fly to (default 8, roughly a region).
   */
  explore(place: Place, zoom = 8): void {
    this.select(place);
    this.focusState.update((prev) => ({ place, zoom, seq: (prev?.seq ?? 0) + 1 }));
  }

  /** Switches between °C and °F. Only the display changes; no new API calls. */
  toggleUnit(): void {
    this.unit.update((u) => (u === 'celsius' ? 'fahrenheit' : 'celsius'));
  }
}

/** Reads and parses a JSON value from `localStorage` (returns `undefined` if missing or invalid). */
function readJson<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

/** Writes a value to `localStorage` as JSON (ignored if storage is unavailable). */
function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: state still works for this session.
  }
}
