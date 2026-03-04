import { ref, onMounted } from 'vue'
import { locationUseCases } from '@/composition'
import type { LocationResponse } from '@/domain/types'

export function useLocation() {
  const location = ref<LocationResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchLocation() {
    loading.value = true
    error.value = null
    try {
      location.value = await locationUseCases.getCurrentLocation()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '위치를 불러올 수 없습니다.'
    } finally {
      loading.value = false
    }
  }

  async function updateLocation(lat: number, lng: number) {
    loading.value = true
    error.value = null
    try {
      const messages = await locationUseCases.updateLocationAndGetMessages(lat, lng)
      location.value = {
        no: 0,
        latitude: lat,
        longitude: lng,
        uploadDate: new Date().toISOString(),
      }
      return messages
    } catch (e) {
      error.value = e instanceof Error ? e.message : '위치 갱신에 실패했습니다.'
      return []
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchLocation)

  return { location, loading, error, fetchLocation, updateLocation }
}
