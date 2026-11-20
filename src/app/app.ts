import { Component, inject } from '@angular/core';

import { PlacesStore } from './core/state/places.store';
import { WorldMap } from './features/map/world-map';

@Component({
  selector: 'app-root',
  imports: [WorldMap],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly store = inject(PlacesStore);
}
