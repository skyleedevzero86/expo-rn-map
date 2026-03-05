import { createStartLocationTracking } from '../use-cases/StartLocationTracking';
import { createStopLocationTracking } from '../use-cases/StopLocationTracking';
import { ExpoLocationService } from '@infrastructure/location/ExpoLocationService';
import { createMessageApiAdapter } from '@infrastructure/http/MessageApiAdapter';
import { ExpoNotificationService } from '@infrastructure/notifications/ExpoNotificationService';

const messageApi = createMessageApiAdapter();
const startTracking = createStartLocationTracking(
  ExpoLocationService,
  messageApi,
  ExpoNotificationService
);
const stopTracking = createStopLocationTracking(ExpoLocationService);

export const startLocationTracking = startTracking;
export const stopLocationTracking = stopTracking;
