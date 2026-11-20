import { Injectable } from '@angular/core';

import { Coordinates } from '../models/location.model';

/** Error with a user-friendly message, thrown when the browser location is not available. */
export class GeolocationError extends Error {}

/** Thin wrapper around the browser Geolocation API. */
@Injectable({ providedIn: 'root' })
export class GeolocationService {
  /** `true` when the browser offers the Geolocation API. */
  get isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
  }

  /**
   * Asks the browser for the user's position (the browser may show a permission prompt).
   *
   * @returns Promise with the coordinates.
   * @throws {GeolocationError} When permission is denied, the position is unavailable or it times out.
   */
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

/** Turns a browser geolocation error code into a message we can show to the user. */
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
