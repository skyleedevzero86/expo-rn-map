export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export function createCoordinates(latitude: number, longitude: number): Coordinates {
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new RangeError('잘못된 좌표입니다.');
  }
  return { latitude, longitude };
}
