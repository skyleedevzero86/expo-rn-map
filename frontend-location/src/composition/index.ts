import { createHttpBackendApi } from '@/infrastructure/api/HttpBackendApi'
import { getCurrentLocation, getLocations, updateLocationAndGetMessages } from '@/application/use-cases/locationUseCases'
import { getMessagesPage, sendMessage } from '@/application/use-cases/messageUseCases'

const api = createHttpBackendApi()

export const locationUseCases = {
  getCurrentLocation: () => getCurrentLocation(api),
  getLocations: (limit?: number) => getLocations(api, limit),
  updateLocationAndGetMessages: (latitude: number, longitude: number) =>
    updateLocationAndGetMessages(api, latitude, longitude),
}

export const messageUseCases = {
  getMessagesPage: (page: number, pageSize: number) => getMessagesPage(api, page, pageSize),
  sendMessage: (sender: string, message: string) => sendMessage(api, sender, message),
}
