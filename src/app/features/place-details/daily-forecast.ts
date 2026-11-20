import { Component, computed, input } from '@angular/core';

import { DailyForecast as DailyPoint, TemperatureUnit } from '../../core/models/weather.model';
import { TemperaturePipe } from '../../core/pipes/temperature.pipe';
import { temperatureColor } from '../../core/utils/temperature-color';
import { describeWeather } from '../../core/utils/weather-codes';

interface DayRow {
  day: DailyPoint;
  name: string;
  icon: string;
  label: string;
  /** Position of the min–max bar inside the week's range (percentages). */
  offset: number;
  width: number;
  gradient: string;
}

@Component({
  selector: 'app-daily-forecast',
  imports: [TemperaturePipe],
  template: `
    <h3 class="title">7-day forecast</h3>
    <ul class="days">
      @for (row of rows(); track row.day.date) {
        <li class="day">
          <span class="day__name">{{ row.name }}</span>
          <span class="day__icon" role="img" [attr.aria-label]="row.label">{{ row.icon }}</span>
          <span class="day__rain">
            @if (row.day.precipitationProbabilityMax >= 20) {
              💧{{ row.day.precipitationProbabilityMax }}%
            }
          </span>
          <span class="day__min">{{ row.day.temperatureMin | temperature: unit() }}</span>
          <span class="day__range" aria-hidden="true">
            <span
              class="day__bar"
              [style.left.%]="row.offset"
              [style.width.%]="row.width"
              [style.background]="row.gradient"
            ></span>
          </span>
          <span class="day__max">{{ row.day.temperatureMax | temperature: unit() }}</span>
        </li>
      }
    </ul>
  `,
  styles: `
    .title { margin: 0 0 8px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
    .days { margin: 0; padding: 0; list-style: none; }
    .day { display: grid; grid-template-columns: 52px 28px 48px 36px 1fr 36px; align-items: center; gap: 6px; padding: 7px 0; border-bottom: 1px solid var(--border); }
    .day:last-child { border-bottom: 0; }
    .day__name { font-weight: 600; }
    .day__icon { font-size: 1.2rem; text-align: center; }
    .day__rain { font-size: 0.75rem; color: var(--accent); }
    .day__min { text-align: right; color: var(--text-muted); }
    .day__max { font-weight: 700; }
    .day__range { position: relative; height: 6px; border-radius: 3px; background: var(--surface-muted); }
    .day__bar { position: absolute; top: 0; bottom: 0; min-width: 6px; border-radius: 3px; }
  `,
})
export class DailyForecast {
  readonly days = input.required<DailyPoint[]>();
  readonly unit = input.required<TemperatureUnit>();

  protected readonly rows = computed<DayRow[]>(() => {
    const days = this.days();
    const weekMin = Math.min(...days.map((d) => d.temperatureMin));
    const weekMax = Math.max(...days.map((d) => d.temperatureMax));
    const span = Math.max(weekMax - weekMin, 1);

    return days.map((day, i) => {
      const condition = describeWeather(day.weatherCode);
      return {
        day,
        name: i === 0 ? 'Today' : weekday(day.date),
        icon: condition.icon,
        label: condition.label,
        offset: ((day.temperatureMin - weekMin) / span) * 100,
        width: ((day.temperatureMax - day.temperatureMin) / span) * 100,
        gradient: `linear-gradient(90deg, ${temperatureColor(day.temperatureMin)}, ${temperatureColor(day.temperatureMax)})`,
      };
    });
  });
}

/** "2026-11-21" → "Sat" (the date is already local to the place, so read it as UTC). */
function weekday(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    timeZone: 'UTC',
  });
}
