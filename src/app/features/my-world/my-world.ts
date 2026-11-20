import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';

import { Place } from '../../core/models/location.model';
import { WeatherSnapshot } from '../../core/models/weather.model';
import { TemperaturePipe } from '../../core/pipes/temperature.pipe';
import { WeatherService } from '../../core/services/weather.service';
import { PlacesStore } from '../../core/state/places.store';
import { coordKey } from '../../core/utils/coords';
import { flagClass } from '../../core/utils/geo';
import { temperatureColor } from '../../core/utils/temperature-color';
import { describeWeather, WeatherCondition } from '../../core/utils/weather-codes';
import { Icon } from '../../shared/icons/icon';
import { IconName } from '../../shared/icons/weather-icons';

type Mode = 'list' | 'compare';

interface Entry {
  place: Place;
  isCurrent: boolean;
  /** flag-icons CSS classes, e.g. "fi fi-gr". */
  flag: string | null;
  snapshot?: WeatherSnapshot;
  condition?: WeatherCondition;
  /** Lowest / highest temperature over the next 24 hours. */
  low?: number;
  high?: number;
  /** SVG polyline points for the 24h temperature sparkline. */
  sparkline?: string;
}

interface Highlight {
  label: string;
  icon: IconName;
  entry: Entry;
  value: string;
}

type LoadState = { status: 'loading' | 'error' | 'done'; snapshots: Map<string, WeatherSnapshot> };

/**
 * "My World": the places the user collected while exploring, side by side.
 * All of them are loaded with ONE batched request (and usually come from the map cache).
 */
@Component({
  selector: 'app-my-world',
  imports: [TemperaturePipe, DecimalPipe, Icon],
  templateUrl: './my-world.html',
  styleUrl: './my-world.scss',
  host: {
    '(keydown.escape)': 'store.myWorldOpen.set(false)',
    '[class.is-wide]': "mode() === 'compare' && entries().length > 1",
  },
})
export class MyWorld {
  private readonly weather = inject(WeatherService);
  protected readonly store = inject(PlacesStore);

  protected readonly mode = signal<Mode>('list');

  private readonly places = computed(() => {
    const current = this.store.currentLocation();
    return current ? [current, ...this.store.saved()] : this.store.saved();
  });

  private readonly load = toSignal(
    toObservable(this.places).pipe(
      switchMap((places): Observable<LoadState> =>
        places.length === 0
          ? of({ status: 'done', snapshots: new Map() })
          : this.weather.getSnapshots(places).pipe(
              map((snapshots): LoadState => ({ status: 'done', snapshots })),
              catchError(() => of<LoadState>({ status: 'error', snapshots: new Map() })),
              startWith<LoadState>({ status: 'loading', snapshots: new Map() }),
            ),
      ),
    ),
    { initialValue: { status: 'loading', snapshots: new Map() } as LoadState },
  );

  protected readonly status = computed(() => this.load().status);

  protected readonly entries = computed<Entry[]>(() => {
    const snapshots = this.load().snapshots;
    return this.places().map((place) => {
      const snapshot = snapshots.get(coordKey(place));
      const entry: Entry = {
        place,
        isCurrent: !!place.isCurrentLocation,
        flag: flagClass(place.countryCode),
      };
      if (!snapshot) return entry;

      const temps = snapshot.hours.map((h) => h.temperature);
      return {
        ...entry,
        snapshot,
        condition: describeWeather(snapshot.weatherCode, snapshot.isDay),
        low: temps.length ? Math.min(...temps) : snapshot.temperature,
        high: temps.length ? Math.max(...temps) : snapshot.temperature,
        sparkline: sparkline(temps),
      };
    });
  });

  /** "TV presenter" comparisons across the user's places. */
  protected readonly highlights = computed<Highlight[]>(() => {
    const withData = this.entries().filter((e) => e.snapshot);
    if (withData.length < 2) return [];

    const by = (fn: (e: Entry) => number) =>
      withData.reduce((best, e) => (fn(e) > fn(best) ? e : best));

    const warmest = by((e) => e.snapshot!.temperature);
    const coldest = by((e) => -e.snapshot!.temperature);
    const windiest = by((e) => e.snapshot!.windSpeed);
    const unit = this.store.unit();
    const temp = (c: number) => new TemperaturePipe().transform(c, unit, true);

    return [
      { label: 'Warmest', icon: 'clear-day', entry: warmest, value: temp(warmest.snapshot!.temperature) },
      { label: 'Coldest', icon: 'snow', entry: coldest, value: temp(coldest.snapshot!.temperature) },
      {
        label: 'Windiest',
        icon: 'wind',
        entry: windiest,
        value: `${Math.round(windiest.snapshot!.windSpeed)} km/h`,
      },
    ];
  });

  protected readonly color = temperatureColor;

  protected explore(place: Place): void {
    this.store.explore(place, 8);
  }

  protected remove(place: Place): void {
    this.store.remove(place);
  }

  protected subtitle(place: Place): string {
    return [place.region, place.country].filter(Boolean).join(', ');
  }
}

/** Temperatures → points for a 100×30 SVG polyline. */
function sparkline(temps: number[]): string | undefined {
  if (temps.length < 2) return undefined;
  const min = Math.min(...temps);
  const span = Math.max(Math.max(...temps) - min, 1);
  return temps
    .map((t, i) => {
      const x = (i / (temps.length - 1)) * 100;
      const y = 28 - ((t - min) / span) * 26;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
