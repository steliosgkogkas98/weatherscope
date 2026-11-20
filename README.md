# 🌍 WeatherScope

**Explore the weather anywhere in the world, like a TV weather forecast where you are in control.**

🔗 **Live demo:** https://steliosgkogkas98.github.io/weatherscope/

WeatherScope is a map-first weather explorer built with Angular and the free [Open-Meteo](https://open-meteo.com/) APIs. You pan and zoom around the world and see temperatures and conditions on the map. You can move through the next 24 hours, open any place for a detailed forecast, and collect places into **My World** to compare them side by side.

---

## ✨ Features

| | |
|---|---|
| 🗺️ **World weather map** | Colour-coded temperature markers (blue → red, like a TV forecast). Zoomed out you see the big cities; zoom in and regional cities appear. Markers never overlap. |
| ⏱️ **24h time slider** | Drag, or press ▶, to animate the whole map through the next 24 hours. Day and night icons included. |
| 🔍 **Search** | Find any city or town (Open-Meteo Geocoding) with an accessible autocomplete. The map flies there. |
| 📍 **My location** | Shows the weather where you are, labelled with the nearest city. If permission was granted before, it loads automatically. |
| 📊 **Place details** | Current conditions, feels-like, humidity, wind, sunrise and sunset, next 24 hours, 7-day forecast with temperature range bars. The header colours follow the weather and day/night. |
| ★ **My World** | Save places as you explore (kept in `localStorage`) and build your own picture of the world's weather. |
| ⚖️ **Compare** | Saved places side by side with 24h sparklines, plus highlights: warmest, coldest, windiest. |
| 🌡️ **°C / °F** | Instant switch, with no new requests. |
| 📱 **Responsive** | Side panels on desktop, bottom sheets on mobile. |

---

## 1. Installation and setup

### Prerequisites
- **Node.js 22.22+ or 24.15+** (the Angular 22 CLI requires it). Tested with Node 24.
- **npm 10+**

### Install and run
```bash
git clone https://github.com/steliosgkogkas98/weatherscope.git
cd weatherscope
npm install
npm start          # = ng serve → http://localhost:4200
```

### Other commands
```bash
npm test -- --watch=false   # unit tests (Vitest)
npm run build               # production build → dist/weatherscope/browser
```

### Environment variables
**None.** Open-Meteo and OpenStreetMap tiles need no API key.

### Deployment
Every push to `main` runs the tests and deploys to **GitHub Pages** through GitHub Actions (`.github/workflows/deploy.yml`).

---

## 2. Implementation choices

### Framework and libraries
| Choice | Why |
|---|---|
| **Angular 22** (standalone components, zoneless) | Modern Angular: `signal()`, `computed()`, `input()`, the new control flow (`@if`/`@for`/`@switch`), `afterNextRender`. No NgModules. |
| **Signals for state** (`PlacesStore`) | The app state is small (saved places, selection, unit, time offset). A signal store keeps it simple and reactive. NgRx would be overkill. |
| **RxJS** only where it shines | Debouncing, cancelling stale requests (`switchMap`) and batching HTTP. Bridged to signals with `toSignal` and `toObservable`. |
| **Leaflet** | Lightweight, open-source, no API key. Tiles from **OpenStreetMap**. |
| **No UI library** | Hand-written SCSS with design tokens (CSS custom properties), to keep the bundle small and the design my own. |
| **Vitest** | Angular 22's default test runner. |

**Runtime dependencies:** `@angular/*`, `rxjs`, `leaflet`. That's all.

### Being careful with the API (free-tier limits)
Open-Meteo's free tier allows about 10,000 calls a day, 5,000 an hour and 600 a minute, so request volume was treated as a design constraint:

1. **Batching:** all map markers in the view are fetched in **one request** (Open-Meteo accepts comma-separated coordinates), not one per city.
2. **Debouncing:** the map waits 400 ms after you stop panning; search waits 300 ms after you stop typing.
3. **Cancel stale requests:** `switchMap` drops responses you no longer need.
4. **TTL cache:** in memory and `sessionStorage` (15 min for weather, 24 h for geocoding). Revisiting an area or refreshing the page costs **0 requests**. Only the places **missing** from the cache are fetched.
5. **Rounded coordinates** (~1 km) for better cache hits. Weather models are much coarser anyway.
6. **One fetch, many uses:** the map request includes the next 24 hourly values (`timeformat=unixtime`), so the **time slider** and the **Compare** view need no extra calls.
7. **Client-side unit conversion:** °C/°F switching never hits the API.
8. **Static city list:** the map's cities come from a curated list in the bundle, so there are no geocoding calls just to draw the map.

A few minutes of exploring usually costs only a handful of API calls (check the Network tab and filter `open-meteo`).

### Accessibility
- Search is a **WAI-ARIA 1.2 combobox** (arrow keys, Enter, Escape, `aria-activedescendant`).
- Map markers are keyboard-focusable buttons with descriptive labels (e.g. *"London: 8°C, Overcast"*). The map pans with the arrow keys.
- Focus moves to the details panel when it opens. **Escape** closes panels.
- Live regions announce search results and loading states. The time slider uses `aria-valuetext`.
- Visible focus styles, `prefers-reduced-motion` support, and text colour on markers picked for contrast.

### Project structure
```
src/app/
├── core/
│   ├── data/          world-cities.ts        curated map cities
│   ├── models/        location / weather models
│   ├── pipes/         temperature.pipe.ts
│   ├── services/      weather, geocoding, geolocation, cache (+ API types & mappers)
│   ├── state/         places.store.ts        signal-based app state
│   └── utils/         weather codes, units, colours, geo, coords, snapshot
└── features/
    ├── map/           world-map              Leaflet map + markers + legend
    ├── search/        search-bar             search + "My location"
    ├── place-details/ place-details, hourly-forecast, daily-forecast
    ├── my-world/      my-world               saved places + compare
    └── time-slider/   time-slider
```
API responses are converted into app models by **pure mapper functions**, so components never deal with the raw API shape and the logic is easy to test.

### Tests
Unit tests cover the cache (TTL, persistence), the weather service (**batching, cache hits, fetching only missing points**), the signal store and the utility functions (weather codes, unit conversion, geo, colours, time-slider lookup).

---

## 3. Incomplete requirements

All requirements of the brief are implemented. Known limitations:
- **Reverse geocoding:** Open-Meteo has no reverse geocoding API, so "My location" is labelled with the nearest city from the built-in list ("Near Thessaloniki") rather than an exact address.
- **Sparse areas when zoomed in:** markers come from a curated list of ~300 cities, so remote areas at high zoom can show few markers. You can still search any place.
- **No end-to-end tests:** only unit tests.

---

## 4. Next steps

- **Click anywhere on the map** to get the weather for that exact point (Windy-style).
- **Shareable URLs:** store map position, selected place and time in the query string.
- **Weather layers** (temperature / wind / rain / clouds), like Ventusky: switch what the markers show, or draw a colour overlay.
- **Animated wind or radar** overlay.
- **Dark mode** following `prefers-color-scheme`.
- **PWA / offline support** with a service worker, so the last viewed data is available offline.
- **E2E tests** (Playwright) and an automated accessibility audit (axe) in CI.
- **i18n** (e.g. Greek) using Open-Meteo's `language` parameter for place names.

---

## 5. Additional notes

- **Attribution:** weather data by [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0). Map tiles © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Both are credited on the map.
- **AI tools:** I used Claude as a pair-programming assistant for planning, scaffolding and code review. I reviewed and understand every line, and I'm happy to walk through any part of the code.
- **Inspiration:** TV weather maps, Windy (timeline), Ventusky (colour scales) and Apple Weather (temperature range bars).
