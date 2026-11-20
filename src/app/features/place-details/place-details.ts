import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';

import { Place } from '../../core/models/location.model';
import { Forecast } from '../../core/models/weather.model';
import { TemperaturePipe } from '../../core/pipes/temperature.pipe';
import { WeatherService } from '../../core/services/weather.service';
import { PlacesStore } from '../../core/state/places.store';
import { countryFlag } from '../../core/utils/geo';
import { windDirectionLabel } from '../../core/utils/units';
import { describeWeather } from '../../core/utils/weather-codes';
import { DailyForecast } from './daily-forecast';
import { HourlyForecast } from './hourly-forecast';

type ForecastState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'done'; forecast: Forecast };

@Component({
  selector: 'app-place-details',
  imports: [TemperaturePipe, HourlyForecast, DailyForecast],
  templateUrl: './place-details.html',
  styleUrl: './place-details.scss',
  host: { '(keydown.escape)': 'close()' },
})
export class PlaceDetails {
  private readonly weather = inject(WeatherService);
  protected readonly store = inject(PlacesStore);

  readonly place = input.required<Place>();

  private readonly title = viewChild<ElementRef<HTMLHeadingElement>>('title');
  /** Bumped by "Try again" to re-run the request for the same place. */
  private readonly attempt = signal(0);

  private readonly state = toSignal(
    toObservable(computed(() => ({ place: this.place(), attempt: this.attempt() }))).pipe(
      switchMap(({ place }): Observable<ForecastState> =>
        this.weather.getForecast(place).pipe(
          map((forecast): ForecastState => ({ status: 'done', forecast })),
          catchError(() => of<ForecastState>({ status: 'error' })),
          startWith<ForecastState>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as ForecastState },
  );

  protected readonly status = computed(() => this.state().status);
  protected readonly forecast = computed(() => {
    const state = this.state();
    return state.status === 'done' ? state.forecast : null;
  });

  protected readonly isSaved = computed(() => this.store.savedIds().has(this.place().id));
  protected readonly flag = computed(() => countryFlag(this.place().countryCode));
  protected readonly subtitle = computed(() => {
    const place = this.place();
    return [place.region, place.country].filter(Boolean).join(', ');
  });

  protected readonly condition = computed(() => {
    const current = this.forecast()?.current;
    return current ? describeWeather(current.weatherCode, current.isDay) : null;
  });

  /** Drives the header colours: e.g. "rain-day", "clear-night". */
  protected readonly theme = computed(() => {
    const current = this.forecast()?.current;
    const category = this.condition()?.category ?? 'cloudy';
    return `${category}-${current?.isDay === false ? 'night' : 'day'}`;
  });

  protected readonly localTime = computed(() => {
    const forecast = this.forecast();
    if (!forecast) return '';
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: forecast.timezone,
    }).format(new Date());
  });

  protected readonly wind = computed(() => {
    const current = this.forecast()?.current;
    return current
      ? `${Math.round(current.windSpeed)} km/h ${windDirectionLabel(current.windDirection)}`
      : '';
  });

  protected readonly today = computed(() => this.forecast()?.daily[0] ?? null);

  constructor() {
    // Move focus to the panel title whenever a new place opens (helps keyboard & screen reader users).
    afterRenderEffect(() => {
      this.place();
      this.title()?.nativeElement.focus({ preventScroll: true });
    });
  }

  protected retry(): void {
    this.attempt.update((n) => n + 1);
  }

  protected toggleSaved(): void {
    this.store.toggleSaved(this.place());
  }

  protected close(): void {
    this.store.select(null);
  }

  protected time(iso: string | undefined): string {
    return iso ? iso.slice(11, 16) : '–';
  }
}
