import type { IMessageApi } from '@application/ports/IMessageApi';
import type { Coordinates } from '@domain/value-objects/Coordinates';
import { createMessage } from '@domain/entities/Message';
import { createMessages } from '@domain/entities/Messages';

declare const process: { env?: { EXPO_PUBLIC_API_BASE_URL?: string } };

function getApiBaseUrl(): string {
  const url = process.env?.EXPO_PUBLIC_API_BASE_URL;
  if (url && typeof url === 'string') {
    return url.trim().replace(/\/+$/, '');
  }
  return 'http://localhost:8080';
}

interface MessageResponseItem {
  no: number;
  sender: string;
  message: string;
  sendDate: string;
  status: number;
}

interface MessagesApiResponse {
  message: MessageResponseItem[];
}

export function createMessageApiAdapter(): IMessageApi {
  return {
    async uploadLocationAndGetMessages(coords: Coordinates): Promise<ReturnType<typeof createMessages>> {
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/api/message`;
      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: coords.latitude,
            longitude: coords.longitude,
            source: 'mobile',
          }),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
          throw new Error('네트워크 연결을 확인해 주세요.');
        }
        throw new Error('서버에 연결할 수 없습니다.');
      }

      if (!res.ok) {
        const text = await res.text();
        let message = `API 오류 ${res.status}`;
        try {
          const json = JSON.parse(text) as { details?: unknown };
          if (json.details != null) message = String(json.details);
        } catch {
          if (text) message = text.slice(0, 200);
        }
        throw new Error(message);
      }

      let data: MessagesApiResponse;
      try {
        data = (await res.json()) as MessagesApiResponse;
      } catch {
        throw new Error('응답을 읽을 수 없습니다.');
      }
      const list = Array.isArray(data?.message) ? data.message : [];
      const messages = list.map((item: MessageResponseItem) =>
        createMessage({
          no: item.no,
          sender: item.sender ?? '',
          message: item.message ?? '',
          sendDate: typeof item.sendDate === 'string' ? item.sendDate : String(item.sendDate ?? ''),
          status: typeof item.status === 'number' ? item.status : 0,
        })
      );
      return createMessages({ message: messages });
    },
  };
}
