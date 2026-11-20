/**
 * WMO weather interpretation codes used by Open-Meteo (`weather_code`).
 * https://open-meteo.com/en/docs (see "WMO Weather interpretation codes")
 */
export type WeatherCategory = 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

export interface WeatherCondition {
  label: string;
  icon: string;
  category: WeatherCategory;
}

interface CodeInfo {
  label: string;
  dayIcon: string;
  nightIcon?: string;
  category: WeatherCategory;
}

const CODES: Record<number, CodeInfo> = {
  0: { label: 'Clear sky', dayIcon: '☀️', nightIcon: '🌙', category: 'clear' },
  1: { label: 'Mainly clear', dayIcon: '🌤️', nightIcon: '🌙', category: 'clear' },
  2: { label: 'Partly cloudy', dayIcon: '⛅', nightIcon: '☁️', category: 'cloudy' },
  3: { label: 'Overcast', dayIcon: '☁️', category: 'cloudy' },
  45: { label: 'Fog', dayIcon: '🌫️', category: 'fog' },
  48: { label: 'Rime fog', dayIcon: '🌫️', category: 'fog' },
  51: { label: 'Light drizzle', dayIcon: '🌦️', nightIcon: '🌧️', category: 'drizzle' },
  53: { label: 'Drizzle', dayIcon: '🌦️', nightIcon: '🌧️', category: 'drizzle' },
  55: { label: 'Dense drizzle', dayIcon: '🌧️', category: 'drizzle' },
  56: { label: 'Freezing drizzle', dayIcon: '🌧️', category: 'drizzle' },
  57: { label: 'Dense freezing drizzle', dayIcon: '🌧️', category: 'drizzle' },
  61: { label: 'Light rain', dayIcon: '🌦️', nightIcon: '🌧️', category: 'rain' },
  63: { label: 'Rain', dayIcon: '🌧️', category: 'rain' },
  65: { label: 'Heavy rain', dayIcon: '🌧️', category: 'rain' },
  66: { label: 'Freezing rain', dayIcon: '🌧️', category: 'rain' },
  67: { label: 'Heavy freezing rain', dayIcon: '🌧️', category: 'rain' },
  71: { label: 'Light snow', dayIcon: '🌨️', category: 'snow' },
  73: { label: 'Snow', dayIcon: '🌨️', category: 'snow' },
  75: { label: 'Heavy snow', dayIcon: '❄️', category: 'snow' },
  77: { label: 'Snow grains', dayIcon: '🌨️', category: 'snow' },
  80: { label: 'Light showers', dayIcon: '🌦️', nightIcon: '🌧️', category: 'rain' },
  81: { label: 'Showers', dayIcon: '🌧️', category: 'rain' },
  82: { label: 'Violent showers', dayIcon: '⛈️', category: 'rain' },
  85: { label: 'Snow showers', dayIcon: '🌨️', category: 'snow' },
  86: { label: 'Heavy snow showers', dayIcon: '❄️', category: 'snow' },
  95: { label: 'Thunderstorm', dayIcon: '⛈️', category: 'storm' },
  96: { label: 'Thunderstorm with hail', dayIcon: '⛈️', category: 'storm' },
  99: { label: 'Severe thunderstorm with hail', dayIcon: '⛈️', category: 'storm' },
};

const UNKNOWN: CodeInfo = { label: 'Unknown', dayIcon: '❔', category: 'cloudy' };

export function describeWeather(code: number, isDay = true): WeatherCondition {
  const info = CODES[code] ?? UNKNOWN;
  return {
    label: info.label,
    icon: isDay ? info.dayIcon : (info.nightIcon ?? info.dayIcon),
    category: info.category,
  };
}
