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

function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { 'X-Source': 'mobile', ...extra };
  const base = getApiBaseUrl();
  if (base.includes('ngrok-free.app') || base.includes('ngrok.io')) {
    h['ngrok-skip-browser-warning'] = 'true';
  }
  return h;
}

function isHtmlResponse(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t.startsWith('<!doctype') || t.startsWith('<html');
}

function toUserFriendlyError(body: string, status: number, fallback: string): string {
  if (!body || !body.trim()) return fallback;
  if (isHtmlResponse(body)) {
    const base = getApiBaseUrl();
    if (base.includes('ngrok-free.app') || base.includes('ngrok.io')) {
      return '서버가 예상한 응답이 아닙니다. .env의 EXPO_PUBLIC_API_BASE_URL이 터널 주소와 같은지 확인한 뒤, 앱을 완전히 종료했다가 다시 실행해 주세요.';
    }
    return '서버가 HTML을 반환했습니다. 연결 주소와 백엔드 실행 여부를 확인해 주세요.';
  }
  try {
    const j = JSON.parse(body) as { details?: unknown };
    if (j.details != null && typeof j.details === 'string') return j.details;
  } catch {
  }
  if (body.length > 200) return body.slice(0, 200);
  return body;
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
          headers: apiHeaders({ 'Content-Type': 'application/json' }),
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
          const isLan = /^http:\/\/192\.168\.|^http:\/\/10\./.test(base);
          const tip = isLan
            ? 'start:tunnel 사용 중이면 pnpm run tunnel:api 후 .env에 https 주소 넣고 앱 재시작.'
            : '백엔드 실행 중인지, .env 주소가 맞는지 확인 후 앱 재시작.';
          throw new Error(`서버 응답 없음(타임아웃). 주소: ${base}. ${tip}`);
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
          const isLan = /^http:\/\/192\.168\.|^http:\/\/10\./.test(base);
          const tip = isLan
            ? 'start:tunnel로 앱 띄웠으면 휴대폰이 192.168.x.x에 접속 불가. 다른 터미널에서 pnpm run tunnel:api 실행 후 나온 https 주소를 .env의 EXPO_PUBLIC_API_BASE_URL에 넣고 앱 재시작.'
            : '백엔드(location 폴더 gradlew bootRun) 실행 중인지, .env 주소가 맞는지 확인.';
          throw new Error(`위치 전송 실패. 주소: ${base}. ${tip}`);
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
        const message = toUserFriendlyError(text, res.status, `API 오류 ${res.status}`);
        throw new Error(message);
      }

      let data: MessagesApiResponse;
      try {
        data = JSON.parse(text) as MessagesApiResponse;
      } catch {
        if (isHtmlResponse(text)) {
          throw new Error(
            '서버가 HTML을 반환했습니다. ngrok 사용 시 앱을 완전히 종료한 뒤 다시 실행하고, 터널 주소가 .env와 일치하는지 확인해 주세요.'
          );
        }
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

    async getUnreadMessages(): Promise<ReturnType<typeof createMessages>> {
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/api/messages/unread`;
      const res = await fetch(url, { headers: apiHeaders() });
      const textUnread = await res.text().catch(() => '');
      if (!res.ok) {
        throw new Error(toUserFriendlyError(textUnread, res.status, `미읽음 목록 조회 실패 ${res.status}`));
      }
      let data: MessagesApiResponse;
      try {
        data = JSON.parse(textUnread) as MessagesApiResponse;
      } catch {
        if (isHtmlResponse(textUnread)) {
          throw new Error('서버가 HTML을 반환했습니다. ngrok 사용 시 앱을 재시작하고 .env 터널 주소를 확인해 주세요.');
        }
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

    async markMessageAsRead(no: number): Promise<void> {
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/api/messages/read/${no}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: apiHeaders(),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(toUserFriendlyError(t, res.status, `읽음 처리 실패 ${res.status}`));
      }
    },
  };
}
