import type { Coordinates } from '@domain/value-objects/Coordinates';

export type LocationCallback = (coords: Coordinates) => void;

export interface ILocationService {
  startWatching(callback: LocationCallback): Promise<void>;
  stopWatching(): void;
}
