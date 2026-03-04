import { ref, computed } from 'vue'
import { messageUseCases } from '@/composition'
import type { MessageItem } from '@/domain/types'

const PAGE_SIZE = 10

export function useMessages() {
  const messages = ref<MessageItem[]>([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

  async function fetchPage(p: number = 1) {
    loading.value = true
    error.value = null
    try {
      const res = await messageUseCases.getMessagesPage(p, PAGE_SIZE)
      messages.value = res.messages
      total.value = res.total
      page.value = res.page
    } catch (e) {
      error.value = e instanceof Error ? e.message : '메시지 목록을 불러올 수 없습니다.'
    } finally {
      loading.value = false
    }
  }

  async function sendMessage(sender: string, content: string) {
    loading.value = true
    error.value = null
    try {
      await messageUseCases.sendMessage(sender, content)
      await fetchPage(1)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '메시지 전송에 실패했습니다.'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    messages,
    total,
    page,
    totalPages,
    loading,
    error,
    fetchPage,
    sendMessage,
  }
}
