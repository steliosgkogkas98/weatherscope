import { WeatherSnapshot } from '../models/weather.model';
import { coordKey, roundCoord } from './coords';
import { distanceKm, flagClass, nearestPlace } from './geo';
import { weatherAt } from './snapshot';
import { temperatureColor, temperatureTextColor } from './temperature-color';
import { convertTemperature, formatTemperature, windDirectionLabel } from './units';
import { describeWeather } from './weather-codes';

describe('coords', () => {
  it('rounds to 2 decimals so nearby points share a cache key', () => {
    expect(roundCoord(40.6401)).toBe(40.64);
    expect(coordKey({ latitude: 40.6401, longitude: 22.9444 })).toBe('40.64,22.94');
    expect(coordKey({ latitude: 40.6449, longitude: 22.9351 })).toBe('40.64,22.94');
  });
});

describe('weather codes', () => {
  it('maps WMO codes to a label and icon', () => {
    expect(describeWeather(0)).toEqual({ label: 'Clear sky', icon: 'clear-day', category: 'clear' });
    expect(describeWeather(95).category).toBe('storm');
  });

  it('uses night icons when it is dark', () => {
    expect(describeWeather(0, false).icon).toBe('clear-night');
  });

  it('falls back gracefully for unknown codes', () => {
    expect(describeWeather(1234).label).toBe('Unknown');
  });
});

describe('units', () => {
  it('converts Celsius to Fahrenheit', () => {
    expect(convertTemperature(0, 'fahrenheit')).toBe(32);
    expect(convertTemperature(100, 'fahrenheit')).toBe(212);
    expect(convertTemperature(21, 'celsius')).toBe(21);
  });

  it('formats with the unit symbol', () => {
    expect(formatTemperature(21.6, 'celsius')).toBe('22°C');
    expect(formatTemperature(0, 'fahrenheit')).toBe('32°F');
  });

  it('turns wind degrees into compass points', () => {
    expect(windDirectionLabel(0)).toBe('N');
    expect(windDirectionLabel(225)).toBe('SW');
    expect(windDirectionLabel(359)).toBe('N');
    expect(windDirectionLabel(-90)).toBe('W');
  });
});

describe('geo', () => {
  const athens = { latitude: 37.98, longitude: 23.73 };
  const thessaloniki = { latitude: 40.64, longitude: 22.94 };

  it('computes great-circle distances', () => {
    expect(distanceKm(athens, thessaloniki)).toBeGreaterThan(290);
    expect(distanceKm(athens, thessaloniki)).toBeLessThan(310);
  });

  it('finds the nearest place', () => {
    const places = [
      { id: 'ath', name: 'Athens', ...athens },
      { id: 'thes', name: 'Thessaloniki', ...thessaloniki },
    ];
    expect(nearestPlace({ latitude: 40.6, longitude: 22.9 }, places)?.name).toBe('Thessaloniki');
  });

  it('builds flag-icons classes from country codes', () => {
    expect(flagClass('GR')).toBe('fi fi-gr');
    expect(flagClass(undefined)).toBeNull();
  });
});

describe('weatherAt', () => {
  const now = Date.UTC(2026, 10, 20, 12, 0, 0);
  const snapshot: WeatherSnapshot = {
    temperature: 10,
    weatherCode: 0,
    isDay: true,
    windSpeed: 5,
    hours: [0, 1, 2, 3].map((h) => ({
      time: now / 1000 + h * 3600,
      temperature: 10 + h,
      weatherCode: h,
      isDay: h < 3,
    })),
  };

  it('returns the current conditions for offset 0', () => {
    expect(weatherAt(snapshot, 0, now).temperature).toBe(10);
  });

  it('returns the hourly value closest to the requested moment', () => {
    expect(weatherAt(snapshot, 2, now)).toEqual({ temperature: 12, weatherCode: 2, isDay: true });
    expect(weatherAt(snapshot, 3, now).isDay).toBe(false);
  });
});

describe('temperature colours', () => {
  it('uses cold colours for low and warm colours for high temperatures', () => {
    const [, , coldBlue] = temperatureColor(-15).match(/\d+/g)!.map(Number);
    const [hotRed] = temperatureColor(34).match(/\d+/g)!.map(Number);
    expect(coldBlue).toBeGreaterThan(200);
    expect(hotRed).toBeGreaterThan(200);
  });

  it('picks a readable text colour', () => {
    expect(temperatureTextColor(18)).toBe('#0f172a');
    expect(temperatureTextColor(-30)).toBe('#ffffff');
  });
});
