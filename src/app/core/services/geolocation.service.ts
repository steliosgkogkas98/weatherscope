import { Injectable } from '@angular/core';

import { Coordinates } from '../models/location.model';

export class GeolocationError extends Error {}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  get isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
  }

  /** Wraps the callback-based browser API in a Promise with user-friendly errors. */
  getCurrentPosition(): Promise<Coordinates> {
    if (!this.isSupported) {
      return Promise.reject(new GeolocationError('Your browser does not support geolocation.'));
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
        (error) => reject(new GeolocationError(messageFor(error))),
        // Weather does not need GPS accuracy; a cached position up to 10 min old is fine.
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60 * 1000 },
      );
    });
  }
}

function messageFor(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access was denied. You can still search for any place.';
    case error.POSITION_UNAVAILABLE:
      return 'Your location is currently unavailable.';
    case error.TIMEOUT:
      return 'Finding your location took too long. Please try again.';
    default:
      return 'Could not get your location.';
  }
}
