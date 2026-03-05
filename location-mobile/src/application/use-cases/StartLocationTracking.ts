import type { ILocationService } from '../ports/ILocationService';
import type { IMessageApi } from '../ports/IMessageApi';
import type { INotificationService } from '../ports/INotificationService';

export function createStartLocationTracking(
  locationService: ILocationService,
  messageApi: IMessageApi,
  notificationService: INotificationService
) {
  return async function startLocationTracking(): Promise<void> {
    await locationService.startWatching(async (coords) => {
      const messages = await messageApi.uploadLocationAndGetMessages(coords);
      for (const message of messages.message) {
        await notificationService.showMessageNotification(message);
      }
    });
  };
}
