import { IconName } from '../../shared/icons/weather-icons';

/**
 * WMO weather interpretation codes used by Open-Meteo (`weather_code`).
 * https://open-meteo.com/en/docs (see "WMO Weather interpretation codes")
 */
export type WeatherCategory = 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

export interface WeatherCondition {
  label: string;
  icon: IconName;
  category: WeatherCategory;
}

interface CodeInfo {
  label: string;
  day: IconName;
  night?: IconName;
  category: WeatherCategory;
}

const CODES: Record<number, CodeInfo> = {
  0: { label: 'Clear sky', day: 'clear-day', night: 'clear-night', category: 'clear' },
  1: { label: 'Mainly clear', day: 'clear-day', night: 'clear-night', category: 'clear' },
  2: { label: 'Partly cloudy', day: 'partly-cloudy-day', night: 'partly-cloudy-night', category: 'cloudy' },
  3: { label: 'Overcast', day: 'cloudy', category: 'cloudy' },
  45: { label: 'Fog', day: 'fog', category: 'fog' },
  48: { label: 'Rime fog', day: 'fog', category: 'fog' },
  51: { label: 'Light drizzle', day: 'drizzle', category: 'drizzle' },
  53: { label: 'Drizzle', day: 'drizzle', category: 'drizzle' },
  55: { label: 'Dense drizzle', day: 'drizzle', category: 'drizzle' },
  56: { label: 'Freezing drizzle', day: 'drizzle', category: 'drizzle' },
  57: { label: 'Dense freezing drizzle', day: 'drizzle', category: 'drizzle' },
  61: { label: 'Light rain', day: 'rain', category: 'rain' },
  63: { label: 'Rain', day: 'rain', category: 'rain' },
  65: { label: 'Heavy rain', day: 'rain', category: 'rain' },
  66: { label: 'Freezing rain', day: 'rain', category: 'rain' },
  67: { label: 'Heavy freezing rain', day: 'rain', category: 'rain' },
  71: { label: 'Light snow', day: 'snow', category: 'snow' },
  73: { label: 'Snow', day: 'snow', category: 'snow' },
  75: { label: 'Heavy snow', day: 'snow', category: 'snow' },
  77: { label: 'Snow grains', day: 'snow', category: 'snow' },
  80: { label: 'Light showers', day: 'rain', category: 'rain' },
  81: { label: 'Showers', day: 'rain', category: 'rain' },
  82: { label: 'Violent showers', day: 'thunderstorm', category: 'rain' },
  85: { label: 'Snow showers', day: 'snow', category: 'snow' },
  86: { label: 'Heavy snow showers', day: 'snow', category: 'snow' },
  95: { label: 'Thunderstorm', day: 'thunderstorm', category: 'storm' },
  96: { label: 'Thunderstorm with hail', day: 'thunderstorm', category: 'storm' },
  99: { label: 'Severe thunderstorm with hail', day: 'thunderstorm', category: 'storm' },
};

const UNKNOWN: CodeInfo = { label: 'Unknown', day: 'cloudy', category: 'cloudy' };

/**
 * Turns an Open-Meteo `weather_code` into a readable label, an icon name and a category.
 *
 * @param code WMO weather code (0–99).
 * @param isDay `false` to get night icons (moon instead of sun).
 * @example describeWeather(0, false) // → { label: 'Clear sky', icon: 'clear-night', category: 'clear' }
 */
export function describeWeather(code: number, isDay = true): WeatherCondition {
  const info = CODES[code] ?? UNKNOWN;
  return {
    label: info.label,
    icon: isDay ? info.day : (info.night ?? info.day),
    category: info.category,
  };
}
