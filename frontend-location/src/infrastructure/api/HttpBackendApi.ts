import type { IBackendApi } from '@/application/ports/IBackendApi'
import type {
  LocationResponse,
  LocationsResponse,
  MessagesResponse,
  MessagesPageResponse,
  MessageItem,
} from '@/domain/types'

function getApiBase(): string {
  const env = import.meta.env.VITE_API_BASE_URL
  if (env && typeof env === 'string') {
    const base = env.trim().replace(/\/+$/, '')
    return base ? `${base}/api` : '/api'
  }
  return '/api'
}

const BASE = getApiBase()

const BACKEND_UNREACHABLE_MSG =
  '백엔드 서버에 연결할 수 없습니다. location 폴더에서 gradlew bootRun (Windows: gradlew.bat bootRun)으로 서버를 실행해 주세요.'

function parseErrorBody(body: unknown, status: number): string {
  if (body != null && typeof body === 'object' && 'details' in body) {
    const d = (body as { details?: unknown }).details
    if (typeof d === 'string') return d
    if (d != null && typeof d === 'object') return JSON.stringify(d)
  }
  if (status === 500 || status === 502 || status === 503) {
    return BACKEND_UNREACHABLE_MSG
  }
  return '요청에 실패했습니다.'
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('/') ? `${BASE}${path}` : `${BASE}/${path}`
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      ...init,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed') || msg.includes('ECONNREFUSED') || msg.includes('refused')) {
      throw new Error(BACKEND_UNREACHABLE_MSG)
    }
    throw new Error('요청에 실패했습니다.')
  }
  if (res.status === 204) return undefined as T
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(parseErrorBody(err, res.status))
  }
  try {
    return await res.json()
  } catch {
    throw new Error('응답을 읽을 수 없습니다.')
  }
}

export function createHttpBackendApi(): IBackendApi {
  return {
    getLocation(): Promise<LocationResponse | null> {
      return request<LocationResponse | null | undefined>('/mylocation')
        .then((r) => r ?? null)
        .catch(() => null)
    },

    getLocations(limit = 100): Promise<LocationsResponse> {
      const limitVal = Math.min(500, Math.max(1, limit))
      return request<LocationsResponse>(
        `/locations?limit=${limitVal}&_t=${Date.now()}`,
        { cache: 'no-store', headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' } }
      )
    },

    postLocationAndGetMessages(latitude: number, longitude: number): Promise<MessagesResponse> {
      return request<MessagesResponse>('/message', {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude, source: 'web' }),
      })
    },

    getMessages(page: number, pageSize?: number): Promise<MessagesPageResponse> {
      const params = new URLSearchParams({ page: String(page) })
      if (pageSize != null) params.set('pageSize', String(pageSize))
      return request<MessagesPageResponse>(`/messages?${params}`)
    },

    sendMessage(sender: string, message: string): Promise<MessageItem> {
      return request<MessageItem>('/messages', {
        method: 'POST',
        body: JSON.stringify({ sender, message }),
      })
    },

    markMessageAsRead(messageNo: number): Promise<void> {
      return request<void>(`/messages/read/${messageNo}`, { method: 'POST' })
    },
  }
}
