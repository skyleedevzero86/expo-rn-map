import type { IBackendApi } from '@/application/ports/IBackendApi'
import type { MessageItem, MessagesPageResponse } from '@/domain/types'

export async function getMessagesPage(
  api: IBackendApi,
  page: number,
  pageSize: number
): Promise<MessagesPageResponse> {
  return api.getMessages(page, pageSize)
}

export async function sendMessage(
  api: IBackendApi,
  sender: string,
  message: string
): Promise<MessageItem> {
  return api.sendMessage(sender, message)
}

export async function markMessageAsRead(
  api: IBackendApi,
  messageNo: number
): Promise<void> {
  return api.markMessageAsRead(messageNo)
}
