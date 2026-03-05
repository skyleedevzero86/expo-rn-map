import type { ILocationService } from '../ports/ILocationService';

export function createStopLocationTracking(locationService: ILocationService) {
  return function stopLocationTracking(): void {
    locationService.stopWatching();
  };
}
