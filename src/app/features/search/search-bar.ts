import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  of,
  startWith,
  switchMap,
} from 'rxjs';

import { WORLD_CITIES } from '../../core/data/world-cities';
import { Place } from '../../core/models/location.model';
import { GeocodingService, MIN_QUERY_LENGTH } from '../../core/services/geocoding.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { PlacesStore } from '../../core/state/places.store';
import { distanceKm, flagClass, nearestPlace } from '../../core/utils/geo';
import { Icon } from '../../shared/icons/icon';

type SearchStatus = 'idle' | 'loading' | 'done' | 'error';

interface SearchState {
  status: SearchStatus;
  results: Place[];
}

const IDLE: SearchState = { status: 'idle', results: [] };

/**
 * Place search (Open-Meteo Geocoding API) as an accessible combobox
 * (WAI-ARIA 1.2 pattern: arrow keys, Enter, Escape), plus the "My location" button.
 */
@Component({
  selector: 'app-search-bar',
  imports: [Icon],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
})
export class SearchBar {
  private readonly geocoding = inject(GeocodingService);
  private readonly geolocation = inject(GeolocationService);
  private readonly store = inject(PlacesStore);

  protected readonly query = signal('');
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly locating = signal(false);
  protected readonly locationError = signal<string | null>(null);
  protected readonly announcement = signal('');

  /** Typing → wait 300 ms → search. switchMap cancels the previous request if the user keeps typing. */
  protected readonly state = toSignal(
    toObservable(this.query).pipe(
      map((q) => q.trim()),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((q): Observable<SearchState> =>
        q.length < MIN_QUERY_LENGTH
          ? of(IDLE)
          : this.geocoding.search(q).pipe(
              map((results): SearchState => ({ status: 'done', results })),
              catchError(() => of<SearchState>({ status: 'error', results: [] })),
              startWith<SearchState>({ status: 'loading', results: [] }),
            ),
      ),
    ),
    { initialValue: IDLE },
  );

  protected readonly results = computed(() => this.state().results);
  protected readonly showList = computed(
    () => this.open() && this.query().trim().length >= MIN_QUERY_LENGTH,
  );
  protected readonly flag = flagClass;

  constructor() {
    this.autoLocateIfAllowed();
  }

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(-1);
    this.open.set(true);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.results().length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.open.set(true);
        if (count) this.activeIndex.update((i) => (i + 1) % count);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (count) this.activeIndex.update((i) => (i <= 0 ? count - 1 : i - 1));
        break;
      case 'Enter': {
        const place = this.results()[Math.max(this.activeIndex(), 0)];
        if (place && this.showList()) {
          event.preventDefault();
          this.choose(place);
        }
        break;
      }
      case 'Escape':
        if (this.open()) {
          this.open.set(false);
        } else {
          this.query.set('');
        }
        this.activeIndex.set(-1);
        break;
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement;
    if (!host.contains(event.relatedTarget as Node | null)) {
      this.open.set(false);
    }
  }

  protected choose(place: Place): void {
    this.store.explore(place, 8);
    this.query.set('');
    this.open.set(false);
    this.activeIndex.set(-1);
    this.announcement.set(`Showing the weather in ${place.name}.`);
  }

  protected describe(place: Place): string {
    return [place.region, place.country].filter(Boolean).join(', ');
  }

  protected async locate(): Promise<void> {
    this.locating.set(true);
    this.locationError.set(null);

    try {
      const coords = await this.geolocation.getCurrentPosition();
      const nearest = nearestPlace(coords, WORLD_CITIES);
      const nearby = nearest && distanceKm(coords, nearest) < 50 ? nearest : undefined;

      const place: Place = {
        id: 'current-location',
        name: 'My location',
        region: nearby ? `Near ${nearby.name}` : undefined,
        countryCode: nearby?.countryCode,
        latitude: coords.latitude,
        longitude: coords.longitude,
        isCurrentLocation: true,
      };

      this.store.currentLocation.set(place);
      this.store.explore(place, 9);
      this.announcement.set('Showing the weather at your location.');
    } catch (error) {
      this.locationError.set(error instanceof Error ? error.message : 'Could not get your location.');
    } finally {
      this.locating.set(false);
    }
  }

  /** If the user already allowed location access before, show it right away (no prompt). */
  private async autoLocateIfAllowed(): Promise<void> {
    try {
      const status = await navigator.permissions?.query({ name: 'geolocation' });
      if (status?.state === 'granted') {
        await this.locate();
      }
    } catch {
      // Permissions API not supported: the user can still press the button.
    }
  }
}
