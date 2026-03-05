import type { Message } from '@domain/entities/Message';

export interface INotificationService {
  showMessageNotification(message: Message): Promise<void>;
}
