import { Component, input } from '@angular/core';

import { HourlyForecast as HourlyPoint, TemperatureUnit } from '../../core/models/weather.model';
import { TemperaturePipe } from '../../core/pipes/temperature.pipe';
import { describeWeather } from '../../core/utils/weather-codes';
import { Icon } from '../../shared/icons/icon';
import { IconName } from '../../shared/icons/weather-icons';

@Component({
  selector: 'app-hourly-forecast',
  imports: [TemperaturePipe, Icon],
  template: `
    <h3 class="title">Next 24 hours</h3>
    <ol class="strip" tabindex="0" aria-label="Hourly forecast, scrollable">
      @for (hour of hours(); track hour.time; let first = $first) {
        <li class="hour" [attr.aria-label]="label(hour, first)">
          <span class="hour__time">{{ first ? 'Now' : hour.time.slice(11, 16) }}</span>
          <app-icon class="hour__icon" [name]="icon(hour)" [size]="32" />
          <span class="hour__temp">{{ hour.temperature | temperature: unit() }}</span>
          <span class="hour__rain" [class.is-hidden]="hour.precipitationProbability < 20">
            <app-icon name="droplet" [size]="11" />{{ hour.precipitationProbability }}%
          </span>
        </li>
      }
    </ol>
  `,
  styles: `
    .title { margin: 0 0 8px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
    .strip { display: flex; gap: 4px; margin: 0; padding: 0 0 8px; overflow-x: auto; list-style: none; scroll-snap-type: x mandatory; }
    .hour { flex: 0 0 56px; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 0; border-radius: 12px; background: var(--surface-muted); scroll-snap-align: start; }
    .hour__time { font-size: 0.75rem; color: var(--text-muted); }
    
    .hour__temp { font-weight: 700; }
    .hour__rain { display: flex; align-items: center; gap: 1px; font-size: 0.7rem; color: var(--accent); }
    .is-hidden { visibility: hidden; }
  `,
})
export class HourlyForecast {
  readonly hours = input.required<HourlyPoint[]>();
  readonly unit = input.required<TemperatureUnit>();

  protected icon(hour: HourlyPoint): IconName {
    return describeWeather(hour.weatherCode, hour.isDay).icon;
  }

  protected label(hour: HourlyPoint, first: boolean): string {
    const time = first ? 'Now' : hour.time.slice(11, 16);
    const temp = new TemperaturePipe().transform(hour.temperature, this.unit(), true);
    return `${time}: ${temp}, ${describeWeather(hour.weatherCode, hour.isDay).label}, ${hour.precipitationProbability}% chance of rain`;
  }
}
