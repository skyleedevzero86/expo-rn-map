import type { Message } from '@domain/entities/Message';

export interface INotificationService {
  requestPermission(): Promise<boolean>;
  showMessageNotification(message: Message): Promise<void>;
}
