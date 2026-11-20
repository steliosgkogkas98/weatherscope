import { Component, computed, DestroyRef, inject, signal } from '@angular/core';

import { PlacesStore } from '../../core/state/places.store';

const MAX_HOURS = 23;
const PLAY_INTERVAL_MS = 700;

/**
 * Moves the whole map through the next 24 hours, like a TV forecast animation.
 * Uses the hourly data already loaded with the map markers: no extra requests.
 */
@Component({
  selector: 'app-time-slider',
  template: `
    <button
      type="button"
      class="play"
      [attr.aria-label]="playing() ? 'Pause forecast animation' : 'Play the next 24 hours'"
      (click)="toggle()"
    >
      {{ playing() ? '⏸' : '▶' }}
    </button>

    <label class="slider">
      <span class="slider__label">
        <span class="slider__caption">Map time</span>
        <strong>{{ label() }}</strong>
      </span>
      <input
        type="range"
        min="0"
        [max]="max"
        step="1"
        [value]="store.hourOffset()"
        [attr.aria-valuetext]="label()"
        (input)="onInput($event)"
      />
    </label>

    @if (store.hourOffset() > 0) {
      <button type="button" class="now" (click)="reset()">Now</button>
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border-radius: 999px;
      background: var(--surface-glass);
      backdrop-filter: blur(12px);
      box-shadow: var(--shadow);
    }
    button {
      border: 0;
      cursor: pointer;
      font-weight: 700;
    }
    .play {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--accent);
      color: #fff;
    }
    .now {
      padding: 6px 12px;
      border-radius: 999px;
      background: var(--surface-muted);
    }
    .slider {
      display: flex;
      flex-direction: column;
      min-width: min(320px, 50vw);
      &__label { display: flex; justify-content: space-between; gap: 8px; font-size: 0.8rem; }
      &__caption { color: var(--text-muted); }
      input { width: 100%; accent-color: var(--accent); }
    }
  `,
})
export class TimeSlider {
  protected readonly store = inject(PlacesStore);
  protected readonly max = MAX_HOURS;
  protected readonly playing = signal(false);
  private timer?: ReturnType<typeof setInterval>;

  protected readonly label = computed(() => {
    const offset = this.store.hourOffset();
    if (offset === 0) return 'Now';
    const date = new Date(Date.now() + offset * 3_600_000);
    date.setMinutes(0);
    const time = date.toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    return `+${offset}h · ${time}`;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  protected onInput(event: Event): void {
    this.stop();
    this.store.hourOffset.set(Number((event.target as HTMLInputElement).value));
  }

  protected toggle(): void {
    if (this.playing()) {
      this.stop();
      return;
    }
    this.playing.set(true);
    this.timer = setInterval(() => {
      this.store.hourOffset.update((h) => (h >= MAX_HOURS ? 0 : h + 1));
    }, PLAY_INTERVAL_MS);
  }

  protected reset(): void {
    this.stop();
    this.store.hourOffset.set(0);
  }

  private stop(): void {
    clearInterval(this.timer);
    this.playing.set(false);
  }
}
