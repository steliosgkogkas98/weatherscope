/**
 * Hand-made SVG icon set (no emojis, no icon font, no extra dependency).
 * Each icon is a 64×64 drawing. They are plain strings so they can be used both
 * in Angular templates (<app-icon>) and inside the Leaflet marker HTML.
 */
export type IconName =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy-day'
  | 'partly-cloudy-night'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'droplet'
  | 'wind'
  | 'pin'
  | 'search'
  | 'globe';

const CLOUD = 'M46 46H20a10 10 0 0 1-1-19.95A14 14 0 0 1 46 24a11 11 0 0 1 0 22z';
const cloud = (dy = 0, fill = '#f8fafc', stroke = '#64748b') =>
  `<path d="${CLOUD}" transform="translate(0 ${dy})" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>`;

const sun = (cx: number, cy: number, r: number) => {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const p = (d: number) => `${(cx + Math.cos(a) * d).toFixed(1)} ${(cy + Math.sin(a) * d).toFixed(1)}`;
    return `M${p(r + 5)}L${p(r + 10)}`;
  }).join('');
  return `<path d="${rays}" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>`;
};

const moon = (scale = 1, dx = 0, dy = 0) =>
  `<path transform="translate(${dx} ${dy}) scale(${scale})" d="M38 10a22 22 0 1 0 16 34A18 18 0 0 1 38 10z" fill="#fde68a" stroke="#d97706" stroke-width="2" stroke-linejoin="round"/>`;

const rainLines = (color: string) =>
  ['24', '33', '42']
    .map((x) => `<path d="M${x} 44l-3 10" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>`)
    .join('');

const ICONS: Record<IconName, string> = {
  'clear-day': sun(32, 32, 12),
  'clear-night': moon(),
  'partly-cloudy-day': sun(24, 24, 9) + cloud(6),
  'partly-cloudy-night': moon(0.6, 4, 4) + cloud(6),
  cloudy: `<path d="${CLOUD}" transform="translate(-8 -8) scale(0.9)" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2.5"/>` + cloud(4),
  fog:
    cloud(-10) +
    ['42', '49', '56']
      .map((y, i) => `<path d="M${14 + i * 4} ${y}h${36 - i * 4}" stroke="#94a3b8" stroke-width="3.5" stroke-linecap="round"/>`)
      .join(''),
  drizzle:
    cloud(-8) +
    [[24, 46], [34, 50], [42, 45], [28, 56], [38, 58]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#60a5fa"/>`)
      .join(''),
  rain: cloud(-8) + rainLines('#3b82f6'),
  snow:
    cloud(-8) +
    [[22, 47], [32, 51], [42, 47], [27, 57], [37, 58]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff" stroke="#60a5fa" stroke-width="1.8"/>`)
      .join(''),
  thunderstorm:
    cloud(-8, '#cbd5e1', '#475569') +
    '<path d="M35 38l-9 13h7l-4 11 12-15h-7l4-9z" fill="#facc15" stroke="#ca8a04" stroke-width="1.5" stroke-linejoin="round"/>',
  droplet:
    '<path d="M32 8S16 28 16 39a16 16 0 0 0 32 0C48 28 32 8 32 8z" fill="#3b82f6"/><path d="M25 40a7 7 0 0 0 6 7" stroke="#bfdbfe" stroke-width="3" stroke-linecap="round" fill="none"/>',
  wind:
    '<g fill="none" stroke="#64748b" stroke-width="4" stroke-linecap="round"><path d="M8 26h30a7 7 0 1 0-7-7"/><path d="M8 38h40a7 7 0 1 1-7 7"/><path d="M8 50h20"/></g>',
  pin: '<path d="M32 4a18 18 0 0 0-18 18c0 14 18 36 18 36s18-22 18-36A18 18 0 0 0 32 4z" fill="#ef4444"/><circle cx="32" cy="22" r="7" fill="#fff"/>',
  search:
    '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><circle cx="27" cy="27" r="15"/><path d="M38 38l14 14"/></g>',
  globe:
    '<circle cx="32" cy="32" r="26" fill="#2563eb"/><g fill="none" stroke="#fff" stroke-width="2.5"><ellipse cx="32" cy="32" rx="11" ry="26"/><path d="M6 32h52M10 19h44M10 45h44"/></g>',
};

/** Full `<svg>` markup for an icon. Decorative by default (aria-hidden). */
export function iconSvg(name: IconName, size = 24): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}
