import { Component, inject } from '@angular/core';

import { PlacesStore } from './core/state/places.store';
import { WorldMap } from './features/map/world-map';
import { SearchBar } from './features/search/search-bar';

@Component({
  selector: 'app-root',
  imports: [WorldMap, SearchBar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly store = inject(PlacesStore);
}
