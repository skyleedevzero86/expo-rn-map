export interface LocationResponse {
  no: number
  latitude: number
  longitude: number
  uploadDate: string
  sender?: string | null
  message?: string | null
  status?: number
}

export interface LocationsResponse {
  locations: LocationResponse[]
}

export interface MessageItem {
  no: number
  sender: string
  message: string
  sendDate: string
  status: number
}

export interface MessagesResponse {
  message: MessageItem[]
}

export interface MessagesPageResponse {
  messages: MessageItem[]
  total: number
  page: number
}

export interface SendMessageRequest {
  sender: string
  message: string
}

export interface MapPosition {
  title: string
  lat: number
  lng: number
  uploadDate: string
  isMyLocation: boolean
  bodySecondLine?: string
  status?: number
  sender?: string
}

export type PathGroup = { lat: number; lng: number }[]
