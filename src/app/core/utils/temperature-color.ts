/**
 * TV-forecast style colour scale: cold = blue/purple, mild = green/yellow, hot = orange/red.
 * Colours are interpolated between fixed stops (temperature in °C).
 */
const STOPS: [number, [number, number, number]][] = [
  [-30, [94, 60, 153]],
  [-15, [59, 91, 219]],
  [0, [96, 165, 250]],
  [10, [52, 211, 153]],
  [18, [250, 204, 21]],
  [26, [249, 115, 22]],
  [34, [220, 38, 38]],
  [45, [127, 29, 29]],
];

/**
 * Background colour for a temperature.
 * @example temperatureColor(30) // → "rgb(239, 89, 22)" (orange-red)
 */
export function temperatureColor(celsius: number): string {
  const [r, g, b] = interpolate(celsius);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Dark text on light backgrounds, white text on dark ones (WCAG-friendly contrast). */
export function temperatureTextColor(celsius: number): string {
  const [r, g, b] = interpolate(celsius);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0f172a' : '#ffffff';
}

/** Linear interpolation between the two colour stops around the temperature. */
function interpolate(celsius: number): [number, number, number] {
  if (celsius <= STOPS[0][0]) return STOPS[0][1];
  const last = STOPS[STOPS.length - 1];
  if (celsius >= last[0]) return last[1];

  for (let i = 0; i < STOPS.length - 1; i++) {
    const [t0, c0] = STOPS[i];
    const [t1, c1] = STOPS[i + 1];
    if (celsius >= t0 && celsius <= t1) {
      const f = (celsius - t0) / (t1 - t0);
      return [0, 1, 2].map((k) => Math.round(c0[k] + (c1[k] - c0[k]) * f)) as [
        number,
        number,
        number,
      ];
    }
  }
  return last[1];
}
