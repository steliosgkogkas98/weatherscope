import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { RawSnapshotResponse } from './open-meteo.types';
import { WeatherService } from './weather.service';

const rawSnapshot = (temperature: number): RawSnapshotResponse => ({
  latitude: 0,
  longitude: 0,
  current: { temperature_2m: temperature, weather_code: 1, is_day: 1, wind_speed_10m: 10 },
  hourly: { time: [1, 2], temperature_2m: [temperature, temperature + 1], weather_code: [1, 2], is_day: [1, 0] },
});

describe('WeatherService', () => {
  let service: WeatherService;
  let http: HttpTestingController;

  const athens = { latitude: 37.98, longitude: 23.73 };
  const oslo = { latitude: 59.91, longitude: 10.75 };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WeatherService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches many places in ONE batched request', async () => {
    const result = firstValueFrom(service.getSnapshots([athens, oslo]));

    const req = http.expectOne((r) => r.url.includes('/v1/forecast'));
    expect(req.request.params.get('latitude')).toBe('37.98,59.91');
    expect(req.request.params.get('longitude')).toBe('23.73,10.75');
    req.flush([rawSnapshot(20), rawSnapshot(3)]);

    const snapshots = await result;
    expect(snapshots.get('37.98,23.73')?.temperature).toBe(20);
    expect(snapshots.get('59.91,10.75')?.temperature).toBe(3);
  });

  it('serves cached places without a new request and only fetches the missing ones', async () => {
    const first = firstValueFrom(service.getSnapshots([athens]));
    http.expectOne(() => true).flush(rawSnapshot(20));
    await first;

    const second = firstValueFrom(service.getSnapshots([athens, oslo]));
    const req = http.expectOne(() => true);
    expect(req.request.params.get('latitude')).toBe('59.91');
    // A single location comes back as an object, not an array.
    req.flush(rawSnapshot(3));

    const snapshots = await second;
    expect(snapshots.size).toBe(2);
  });

  it('makes no request at all when everything is cached', async () => {
    const first = firstValueFrom(service.getSnapshots([athens]));
    http.expectOne(() => true).flush(rawSnapshot(20));
    await first;

    const again = await firstValueFrom(service.getSnapshots([athens]));
    http.expectNone(() => true);
    expect(again.get('37.98,23.73')?.temperature).toBe(20);
  });
});
