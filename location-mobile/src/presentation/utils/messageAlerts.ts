import { Alert } from 'react-native';
import { getMessageApi } from '@application/composition/useCases';
import type { Message } from '@domain/entities/Message';

export function formatMessage(msg: Message): string {
  const sender = msg.sender?.trim() || '알 수 없음';
  const body = msg.message?.trim() || '(내용 없음)';
  return `${sender}: ${body}`;
}

function showNextMessage(list: Message[], index: number): void {
  if (index >= list.length) return;
  const msg = list[index];
  const api = getMessageApi();
  Alert.alert('새 메시지', formatMessage(msg), [
    {
      text: 'OK',
      onPress: () => {
        api.markMessageAsRead(msg.no).catch(() => {});
        setTimeout(() => showNextMessage(list, index + 1), 0);
      },
    },
  ]);
}

export function showUnreadMessagesOneByOne(list: Message[]): void {
  const unread = list.filter((m) => m.status === 0);
  if (!unread.length) return;
  showNextMessage(unread, 0);
}
