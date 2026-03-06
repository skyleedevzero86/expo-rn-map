import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { INotificationService } from '@application/ports/INotificationService';
import type { Message } from '@domain/entities/Message';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

const ANDROID_CHANNEL_ID = 'location-messages';

async function ensurePermissionsAndChannel(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return false;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: '메시지 알림',
        importance: Notifications.AndroidImportance.HIGH,
        sound: true,
      });
    }
    return true;
  } catch {
    return false;
  }
}

function formatNotificationBody(message: Message): string {
  const text = message.message != null && String(message.message).trim() !== '' ? String(message.message).trim() : '(내용 없음)';
  const dateStr = message.sendDate ? new Date(message.sendDate).toLocaleString() : '';
  return dateStr ? `${text} · ${dateStr}` : text;
}

function buildTitle(message: Message): string {
  const sender = message.sender != null && String(message.sender).trim() !== '' ? String(message.sender).trim() : '알 수 없음';
  return `${sender}님의 메시지`;
}

export const ExpoNotificationService: INotificationService = {
  async requestPermission(): Promise<boolean> {
    return ensurePermissionsAndChannel();
  },
  async showMessageNotification(message: Message): Promise<void> {
    try {
      const ok = await ensurePermissionsAndChannel();
      if (!ok) return;
      const title = buildTitle(message);
      const body = formatNotificationBody(message);
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { messageNo: message.no },
          sound: true,
          ...(Platform.OS === 'android' && { channelId: ANDROID_CHANNEL_ID }),
        },
        trigger: null,
      });
    } catch {
    }
  },
};
