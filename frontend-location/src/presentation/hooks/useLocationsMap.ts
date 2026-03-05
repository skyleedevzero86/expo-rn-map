import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue'
import { locationUseCases } from '@/composition'
import { formatDateTime } from '@/presentation/utils/format'
import { getKakao } from '@/presentation/utils/kakaoMap'
import { useMap } from '@/presentation/hooks/useMap'
import type { LocationResponse, MapPosition } from '@/domain/types'

export function useLocationsMap(
  location: Ref<LocationResponse | null>,
  fetchLocation: () => Promise<void>
) {
  const selectedSender = ref<string | null>(null)
  const highlightedSenderCoords = ref<{ lat: number; lng: number }[]>([])
  const locationsList = ref<LocationResponse[]>([])
  const locationsLoading = ref(false)
  const locationsLoadError = ref<string | null>(null)
  const kakaoMapKey = ref(import.meta.env.VITE_KAKAO_MAP_KEY ?? '')

  const { mapContainer, drawKakaoMap, closeOverlay, dispose } = useMap(selectedSender)

  async function loadLocationsAndDrawMap() {
    const kakao = getKakao()
    if (!kakao?.maps) {
      locationsLoadError.value = kakaoMapKey.value
        ? '지도 스크립트가 아직 로드되지 않았습니다. 잠시 후 다시 시도하세요.'
        : '지도를 사용하려면 frontend-location/.env에 VITE_KAKAO_MAP_KEY를 설정하세요.'
      return
    }

    locationsLoading.value = true
    locationsLoadError.value = null
    locationsList.value = []
    let pathGroups: { lat: number; lng: number }[][] = []
    let positions: MapPosition[] = []

    try {
      const res = await locationUseCases.getLocations(500)
      const raw = res?.locations
      const all = Array.isArray(raw) ? raw : []
      const list = all

      locationsList.value = list
      const toLat = (loc: { latitude?: number; lat?: number }) =>
        Number(loc.latitude ?? (loc as { lat?: number }).lat)
      const toLng = (loc: { longitude?: number; lng?: number }) =>
        Number(loc.longitude ?? (loc as { lng?: number }).lng)

      if (list.length === 0) {
        locationsLoadError.value =
          'DB에 location이 없습니다. MySQL에서 location/src/main/resources/script.sql 의 location INSERT를 실행한 뒤 "지도 마커 새로고침"을 누르세요.'
      }

      const listForMarkers = list.filter((loc) => Number(loc.status) === 1)
      positions = listForMarkers.map((loc) => {
        const messageText =
          (loc as { message?: string; content?: string }).message ??
          (loc as { message?: string; content?: string }).content ??
          ''
        const senderText = loc.sender ?? ''
        const hasAuthorMessage = senderText !== '' || messageText !== ''
        const title = hasAuthorMessage
          ? `작성자 ${senderText || '(알 수 없음)'} : ${messageText.length > 40 ? messageText.slice(0, 40) + '…' : messageText || '(메시지 없음)'}`
          : `위치 #${loc.no} · ${formatDateTime(loc.uploadDate)}`
        return {
          title,
          lat: toLat(loc),
          lng: toLng(loc),
          uploadDate: formatDateTime(loc.uploadDate),
          isMyLocation: false,
          bodySecondLine: messageText !== '' ? messageText : undefined,
          status: loc.status !== undefined && loc.status !== null ? Number(loc.status) : 1,
          sender: (loc.sender ?? '').trim(),
        }
      })

      const groups = new Map<string, LocationResponse[]>()
      listForMarkers.forEach((loc) => {
        const key = (loc.sender ?? '').trim()
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(loc)
      })
      groups.forEach((arr) => {
        arr.sort((a, b) => String(a.uploadDate).localeCompare(String(b.uploadDate)))
        if (arr.length >= 2) {
          pathGroups.push(arr.map((l) => ({ lat: toLat(l), lng: toLng(l) })))
        }
      })
      if (pathGroups.length === 0 && listForMarkers.length >= 2) {
        const sorted = [...listForMarkers].sort((a, b) =>
          String(a.uploadDate).localeCompare(String(b.uploadDate))
        )
        pathGroups.push(sorted.map((l) => ({ lat: toLat(l), lng: toLng(l) })))
      }

      const myLat = location.value?.latitude
      const myLng = location.value?.longitude
      const isSameCoord = (p: { lat: number; lng: number }) =>
        myLat != null &&
        myLng != null &&
        Math.abs(p.lat - myLat) < 1e-5 &&
        Math.abs(p.lng - myLng) < 1e-5
      if (myLat != null && myLng != null) {
        positions = positions.filter((p) => !isSameCoord(p))
        positions = [
          {
            title: '내 위치',
            lat: myLat,
            lng: myLng,
            uploadDate: location.value ? formatDateTime(location.value.uploadDate) : '',
            isMyLocation: true,
            bodySecondLine: `위도 ${myLat.toFixed(5)}, 경도 ${myLng.toFixed(5)}`,
            status: 1,
            sender: '',
          },
          ...positions,
        ]
      }

      const senderTrim = selectedSender.value?.trim() ?? ''
      if (senderTrim) {
        highlightedSenderCoords.value = positions
          .filter((p) => !p.isMyLocation && (p.sender ?? '').trim() === senderTrim)
          .map((p) => ({ lat: p.lat, lng: p.lng }))
      } else {
        highlightedSenderCoords.value = []
      }
    } catch (e) {
      locationsLoadError.value = e instanceof Error ? e.message : '위치 목록을 불러올 수 없습니다.'
    }

    try {
      drawKakaoMap(positions, location.value ?? undefined, pathGroups)
    } catch (e) {
      locationsLoadError.value =
        e instanceof Error ? e.message : '지도를 그리는 중 오류가 발생했습니다.'
    } finally {
      locationsLoading.value = false
    }
  }

  function onSelectSender(sender: string) {
    selectedSender.value = sender
    loadLocationsAndDrawMap()
  }

  watch(
    location,
    (loc) => {
      if (loc && locationsList.value.length === 0) loadLocationsAndDrawMap()
    },
    { immediate: true }
  )

  onMounted(() => {
    if (!kakaoMapKey.value) {
      locationsLoadError.value =
        '지도를 사용하려면 frontend-location/.env에 VITE_KAKAO_MAP_KEY를 설정하세요.'
      return
    }
    const k = getKakao()
    if (!k?.maps) {
      locationsLoadError.value = '지도 스크립트를 불러올 수 없습니다. .env에 키 설정 후 개발 서버를 재시작하세요.'
      return
    }
    if (k.maps.load) {
      k.maps.load(() => {
        loadLocationsAndDrawMap()
        if (location.value) fetchLocation()
      })
    } else {
      loadLocationsAndDrawMap()
      if (location.value) fetchLocation()
    }
  })

  onUnmounted(() => {
    dispose()
  })

  return {
    mapContainer,
    selectedSender,
    highlightedSenderCoords,
    locationsList,
    locationsLoading,
    locationsLoadError,
    kakaoMapKey,
    loadLocationsAndDrawMap,
    onSelectSender,
    closeOverlay,
  }
}
