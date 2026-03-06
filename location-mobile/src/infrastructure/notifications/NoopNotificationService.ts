import type { INotificationService } from '@application/ports/INotificationService';
import type { Message } from '@domain/entities/Message';

export const NoopNotificationService: INotificationService = {
  async requestPermission(): Promise<boolean> {
    return false;
  },
  async showMessageNotification(_message: Message): Promise<void> {},
};
