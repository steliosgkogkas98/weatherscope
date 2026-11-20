import { Component, inject } from '@angular/core';

import { PlacesStore } from './core/state/places.store';
import { Icon } from './shared/icons/icon';
import { WorldMap } from './features/map/world-map';
import { MyWorld } from './features/my-world/my-world';
import { PlaceDetails } from './features/place-details/place-details';
import { SearchBar } from './features/search/search-bar';
import { TimeSlider } from './features/time-slider/time-slider';

@Component({
  selector: 'app-root',
  imports: [WorldMap, SearchBar, PlaceDetails, MyWorld, TimeSlider, Icon],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly store = inject(PlacesStore);
}
