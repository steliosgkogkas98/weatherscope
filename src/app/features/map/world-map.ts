import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as L from 'leaflet';
import { catchError, debounceTime, of, Subject, switchMap, tap } from 'rxjs';

import { WORLD_CITIES } from '../../core/data/world-cities';
import { Place } from '../../core/models/location.model';
import { TemperatureUnit, WeatherSnapshot } from '../../core/models/weather.model';
import { WeatherService } from '../../core/services/weather.service';
import { PlacesStore } from '../../core/state/places.store';
import { coordKey } from '../../core/utils/coords';
import { weatherAt } from '../../core/utils/snapshot';
import { temperatureColor, temperatureTextColor } from '../../core/utils/temperature-color';
import { convertTemperature, formatTemperature } from '../../core/utils/units';
import { describeWeather } from '../../core/utils/weather-codes';

type PointKind = 'current' | 'selected' | 'saved' | 'city';

interface MapPoint {
  place: Place;
  /** Position on the map (longitude may be shifted ±360° for wrapped world copies). */
  latLng: L.LatLng;
  kind: PointKind;
}

/** Wait until the user stops panning/zooming before requesting data. */
const DEBOUNCE_MS = 400;
/** Upper bound of markers (= locations per request) for one view. */
const MAX_MARKERS = 60;
/** Minimum pixel distance between marker centres, so labels don't overlap. */
const MIN_DX = 110;
const MIN_DY = 52;

const INITIAL_CENTER: L.LatLngExpression = [35, 15];
const INITIAL_ZOOM = 3;

@Component({
  selector: 'app-world-map',
  templateUrl: './world-map.html',
  styleUrl: './world-map.scss',
})
export class WorldMap {
  private readonly weather = inject(WeatherService);
  private readonly store = inject(PlacesStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mapElement = viewChild.required<ElementRef<HTMLDivElement>>('map');

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly legend = computed(() => {
    const unit = this.store.unit();
    return [-20, -10, 0, 10, 20, 30, 40].map((c) => ({
      label: Math.round(convertTemperature(c, unit)),
      color: temperatureColor(c),
    }));
  });

  private map?: L.Map;
  private readonly markerLayer = L.layerGroup();
  private readonly markers = new Map<string, { marker: L.Marker; html: string }>();
  private readonly viewChanged = new Subject<void>();
  private readonly snapshots = signal(new Map<string, WeatherSnapshot>());
  private visiblePoints: MapPoint[] = [];

  constructor() {
    afterNextRender(() => this.initMap());
    this.destroyRef.onDestroy(() => this.map?.remove());

    // Map moved → (debounced) work out what is visible → ONE batched request for missing points.
    this.viewChanged
      .pipe(
        debounceTime(DEBOUNCE_MS),
        switchMap(() => {
          this.visiblePoints = this.computeVisiblePoints();
          this.loading.set(true);
          return this.weather.getSnapshots(this.visiblePoints.map((p) => p.place)).pipe(
            tap(() => this.error.set(null)),
            catchError(() => {
              this.error.set('Could not load the weather for this area. Move the map to retry.');
              return of(new Map<string, WeatherSnapshot>());
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((snapshots) => {
        this.loading.set(false);
        this.snapshots.set(snapshots);
      });

    // Data or display settings changed → redraw markers (no new requests).
    effect(() => {
      const snapshots = this.snapshots();
      const unit = this.store.unit();
      const hourOffset = this.store.hourOffset();
      const selectedId = this.store.selected()?.id ?? null;
      untracked(() => this.renderMarkers(snapshots, unit, hourOffset, selectedId));
    });

    // Saved / selected / current places are always shown, so recompute when they change.
    effect(() => {
      this.store.saved();
      this.store.selected();
      this.store.currentLocation();
      untracked(() => this.viewChanged.next());
    });

    // Someone asked the map to move (search result, "my location", saved place…).
    effect(() => {
      const request = this.store.focusRequest();
      if (!request) return;
      untracked(() => {
        const zoom = Math.max(request.zoom, this.map?.getZoom() ?? 0);
        this.map?.flyTo([request.place.latitude, request.place.longitude], zoom, { duration: 1.2 });
      });
    });
  }

  private initMap(): void {
    this.map = L.map(this.mapElement().nativeElement, {
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 2,
      maxZoom: 11,
      worldCopyJump: true,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    // OpenStreetMap standard tiles: free, no API key (attribution required).
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Weather data by <a href="https://open-meteo.com/">Open-Meteo.com</a>',
    }).addTo(this.map);

    this.markerLayer.addTo(this.map);
    this.map.on('moveend', () => this.viewChanged.next());
    this.viewChanged.next();
  }

  /**
   * Decides which places get a marker: user places first, then cities by importance,
   * skipping any that would overlap an already placed marker. Zooming in frees space,
   * so smaller cities appear (like a TV weather map).
   */
  private computeVisiblePoints(): MapPoint[] {
    const map = this.map;
    if (!map) return [];

    const bounds = map.getBounds().pad(0.05);
    const current = this.store.currentLocation();
    const selected = this.store.selected();
    const candidates: [Place, PointKind][] = [
      ...(current ? [[current, 'current'] as [Place, PointKind]] : []),
      ...(selected ? [[selected, 'selected'] as [Place, PointKind]] : []),
      ...this.store.saved().map((p): [Place, PointKind] => [p, 'saved']),
      ...WORLD_CITIES.map((p): [Place, PointKind] => [p, 'city']),
    ];

    const points: MapPoint[] = [];
    const placed: L.Point[] = [];
    const seen = new Set<string>();

    for (const [place, kind] of candidates) {
      if (points.length >= MAX_MARKERS) break;

      const key = coordKey(place);
      if (seen.has(key)) continue;

      const latLng = visibleLatLng(place, bounds);
      if (!latLng) continue;

      const pixel = map.latLngToContainerPoint(latLng);
      const overlaps = placed.some(
        (p) => Math.abs(p.x - pixel.x) < MIN_DX && Math.abs(p.y - pixel.y) < MIN_DY,
      );
      // User places are always shown; cities only where there is room.
      if (overlaps && kind === 'city') continue;

      seen.add(key);
      placed.push(pixel);
      points.push({ place, latLng, kind });
    }
    return points;
  }

  private renderMarkers(
    snapshots: Map<string, WeatherSnapshot>,
    unit: TemperatureUnit,
    hourOffset: number,
    selectedId: string | null,
  ): void {
    const keep = new Set<string>();

    for (const point of this.visiblePoints) {
      const snapshot = snapshots.get(coordKey(point.place));
      if (!snapshot) continue;

      const id = `${point.place.id}@${point.latLng.lng}`;
      const weather = weatherAt(snapshot, hourOffset);
      const condition = describeWeather(weather.weatherCode, weather.isDay);
      const isSelected = point.place.id === selectedId;
      const html = markerHtml(point, weather.temperature, condition.icon, unit, isSelected);
      const label = `${point.place.name}: ${formatTemperature(weather.temperature, unit)}, ${condition.label}`;

      keep.add(id);
      const existing = this.markers.get(id);

      if (existing) {
        if (existing.html !== html) {
          existing.marker.setIcon(markerIcon(html));
          existing.html = html;
        }
        existing.marker.getElement()?.setAttribute('aria-label', label);
        continue;
      }

      const marker = L.marker(point.latLng, {
        icon: markerIcon(html),
        keyboard: true,
        riseOnHover: true,
        zIndexOffset: point.kind === 'city' ? 0 : 1000,
      });
      marker.on('click', () => this.store.select(point.place));
      marker.addTo(this.markerLayer);
      marker.getElement()?.setAttribute('aria-label', label);
      this.markers.set(id, { marker, html });
    }

    for (const [id, { marker }] of this.markers) {
      if (!keep.has(id)) {
        marker.remove();
        this.markers.delete(id);
      }
    }
  }
}

/** Returns the position of the place inside the view, trying the wrapped world copies too. */
function visibleLatLng(place: Place, bounds: L.LatLngBounds): L.LatLng | null {
  for (const shift of [0, -360, 360]) {
    const latLng = L.latLng(place.latitude, place.longitude + shift);
    if (bounds.contains(latLng)) return latLng;
  }
  return null;
}

function markerIcon(html: string): L.DivIcon {
  return L.divIcon({ html, className: 'wx-marker-host', iconSize: [0, 0] });
}

function markerHtml(
  point: MapPoint,
  celsius: number,
  icon: string,
  unit: TemperatureUnit,
  selected: boolean,
): string {
  const temp = Math.round(convertTemperature(celsius, unit));
  const classes = ['wx-marker', `wx-marker--${point.kind}`, selected ? 'is-selected' : '']
    .filter(Boolean)
    .join(' ');
  const badge = point.kind === 'current' ? '📍 ' : point.kind === 'saved' ? '★ ' : '';
  return `
    <div class="${classes}" style="--wx-bg:${temperatureColor(celsius)};--wx-fg:${temperatureTextColor(celsius)}">
      <span class="wx-marker__chip" aria-hidden="true">
        <span class="wx-marker__icon">${icon}</span>
        <span class="wx-marker__temp">${temp}°</span>
      </span>
      <span class="wx-marker__name" aria-hidden="true">${badge}${escapeHtml(point.place.name)}</span>
    </div>`;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch,
  );
}
