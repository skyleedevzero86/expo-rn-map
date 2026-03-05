import * as Notifications from 'expo-notifications';
import type { INotificationService } from '@application/ports/INotificationService';
import type { Message } from '@domain/entities/Message';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function formatNotificationBody(message: Message): string {
  const dateStr = message.sendDate ? new Date(message.sendDate).toLocaleString() : '';
  return `${message.message} - ${dateStr}`;
}

export const ExpoNotificationService: INotificationService = {
  async showMessageNotification(message: Message): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${message.sender}님의 메시지`,
        body: formatNotificationBody(message),
        data: { messageNo: message.no },
      },
      trigger: null,
    });
  },
};
