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
      const timeoutMs = 15000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Source': 'mobile',
          },
          body: JSON.stringify({
            latitude: coords.latitude,
            longitude: coords.longitude,
            source: 'mobile',
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (e) {
        clearTimeout(timeoutId);
        if (e instanceof Error && e.name === 'AbortError') {
          const base = getApiBaseUrl();
          throw new Error(
            '서버 응답이 없습니다(타임아웃). 확인: ① 백엔드(location 폴더에서 gradlew bootRun) 실행 중인지 ② PC와 휴대폰이 같은 Wi‑Fi인지 ③ PC 방화벽에서 8080 포트 허용인지 ④ .env의 EXPO_PUBLIC_API_BASE_URL이 PC 실제 IP인지(현재: ' +
              base +
              '). 주소 수정 후 앱을 완전히 재시작하세요.'
          );
        }
        const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
        const isNetworkFailed =
          msg.indexOf('fetch') !== -1 ||
          msg.indexOf('network') !== -1 ||
          msg.indexOf('failed') !== -1 ||
          msg.indexOf('econnrefused') !== -1 ||
          msg.indexOf('request failed') !== -1;
        if (isNetworkFailed) {
          const base = getApiBaseUrl();
          throw new Error(
            '네트워크 연결 실패(Network request failed). ① PC와 휴대폰 같은 Wi‑Fi인지 ② .env의 EXPO_PUBLIC_API_BASE_URL이 PC IP인지(현재: ' +
              base +
              ') ③ app.config.js 수정 후 개발 빌드 다시 실행(npx expo run:android 또는 run:ios). 연결 주소 수정만 했으면 앱 완전 재시작.'
          );
        }
        throw new Error('서버에 연결할 수 없습니다. ' + (e instanceof Error ? e.message : String(e)));
      }

      let text: string;
      try {
        text = await res.text();
      } catch (e) {
        throw new Error('응답 본문을 읽을 수 없습니다.');
      }

      if (!res.ok) {
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
        data = JSON.parse(text) as MessagesApiResponse;
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
