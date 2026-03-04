export interface LocationResponse {
  no: number
  latitude: number
  longitude: number
  uploadDate: string
  sender?: string | null
  message?: string | null
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
