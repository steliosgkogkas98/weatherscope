import { TestBed } from '@angular/core/testing';

import { Place } from '../models/location.model';
import { PlacesStore } from './places.store';

describe('PlacesStore', () => {
  const oslo: Place = { id: 'oslo', name: 'Oslo', latitude: 59.91, longitude: 10.75 };
  let store: PlacesStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(PlacesStore);
  });

  it('saves and removes places', () => {
    store.toggleSaved(oslo);
    expect(store.isSaved(oslo)).toBe(true);
    store.toggleSaved(oslo);
    expect(store.isSaved(oslo)).toBe(false);
  });

  it('persists saved places in localStorage', () => {
    store.toggleSaved(oslo);
    TestBed.tick();
    expect(JSON.parse(localStorage.getItem('weatherscope:saved-places')!)).toEqual([oslo]);
  });

  it('selects a place and asks the map to move there', () => {
    store.explore(oslo, 9);
    expect(store.selected()).toEqual(oslo);
    expect(store.focusRequest()).toMatchObject({ place: oslo, zoom: 9 });
  });

  it('toggles the temperature unit', () => {
    expect(store.unit()).toBe('celsius');
    store.toggleUnit();
    expect(store.unit()).toBe('fahrenheit');
  });
});
