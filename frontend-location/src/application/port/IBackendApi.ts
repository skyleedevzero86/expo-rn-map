import type {
  LocationResponse,
  LocationsResponse,
  MessageItem,
  MessagesResponse,
  MessagesPageResponse,
} from '@/domain/types'

export interface IBackendApi {
  getLocation(): Promise<LocationResponse | null>
  getLocations(limit?: number): Promise<LocationsResponse>
  postLocationAndGetMessages(latitude: number, longitude: number): Promise<MessagesResponse>
  getMessages(page: number, pageSize?: number): Promise<MessagesPageResponse>
  sendMessage(sender: string, message: string): Promise<MessageItem>
}
