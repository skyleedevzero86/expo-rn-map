<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useLocation } from '@/presentation/hooks/useLocation'
import { useMessages } from '@/presentation/hooks/useMessages'
import { locationUseCases } from '@/composition'
import { formatDateTime } from '@/presentation/utils/format'
import type { MessageItem, LocationResponse } from '@/domain/types'

const BACKEND_UNREACHABLE_MSG =
  '백엔드 서버에 연결할 수 없습니다. location 폴더에서 gradlew bootRun (Windows: gradlew.bat bootRun)으로 서버를 실행해 주세요.'

const isBackendUnreachable = (msg: string | null) =>
  msg != null && msg.trim() === BACKEND_UNREACHABLE_MSG.trim()

const mapContainer = ref<HTMLDivElement | null>(null)
const { location, loading: locationLoading, error: locationError, fetchLocation, updateLocation } = useLocation()
const {
  messages,
  total,
  page,
  totalPages,
  loading: messagesLoading,
  error: messagesError,
  fetchPage,
  sendMessage,
  markAsRead,
} = useMessages()

const sender = ref('')
const messageContent = ref('')
const showMessageModal = ref(false)
const unreadFromLocation = ref<MessageItem[]>([])
const locationsList = ref<LocationResponse[]>([])
const locationsLoading = ref(false)
const locationsLoadError = ref<string | null>(null)
const kakaoMapKey = ref(import.meta.env.VITE_KAKAO_MAP_KEY ?? '')

const showBackendUnreachableBanner = computed(
  () =>
    isBackendUnreachable(locationError.value) ||
    isBackendUnreachable(messagesError.value) ||
    isBackendUnreachable(locationsLoadError.value)
)

let mapInstance: ReturnType<Window['kakao']['maps']['Map']> | null = null
const markersRef = ref<ReturnType<Window['kakao']['maps']['Marker']>[]>([])
let currentOverlay: ReturnType<Window['kakao']['maps']['CustomOverlay']> | null = null

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

function getKakao() {
  return typeof window !== 'undefined' ? window.kakao : undefined
}

function overlayContent(
  title: string,
  uploadDate: string,
  lat: number,
  lng: number,
  bodySecondLine?: string
) {
  const escape = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const escapedTitle = escape(title)
  const escapedDate = escape(uploadDate)
  const secondLine =
    bodySecondLine != null && bodySecondLine !== ''
      ? escape(bodySecondLine)
      : `위도 ${lat.toFixed(5)}, 경도 ${lng.toFixed(5)}`
  return (
    '<div class="kakao-overlay wrap">' +
    '  <div class="info">' +
    '    <div class="title">' +
    `      ${escapedTitle}` +
    '      <div class="close" onclick="window.__closeKakaoOverlay && window.__closeKakaoOverlay()" title="닫기"></div>' +
    '    </div>' +
    '    <div class="body">' +
    '      <div class="desc">' +
    `        <div class="ellipsis">갱신 시각: ${escapedDate}</div>` +
    `        <div class="jibun ellipsis">${secondLine}</div>` +
    '      </div>' +
    '    </div>' +
    '  </div>' +
    '</div>'
  )
}

function closeOverlay() {
  if (currentOverlay && getKakao()) {
    currentOverlay.setMap(null)
    currentOverlay = null
  }
}

const SPRITE_MARKER_URL =
  'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markers_sprites2.png'
const MARKER_W = 33
const MARKER_H = 36
const SPRITE_GAP = 10
const SPRITE_W = 126
const SPRITE_H = 146

function createSpriteMarkerImage(
  kakao: { maps: { Size: (w: number, h: number) => unknown; Point: (x: number, y: number) => unknown; MarkerImage: new (url: string, size: unknown, opts?: unknown) => unknown } },
  rowIndex: number
) {
  const Size = kakao.maps.Size
  const Point = kakao.maps.Point
  const MarkerImage = kakao.maps.MarkerImage
  const markerSize = new Size(MARKER_W, MARKER_H)
  const offset = new Point(12, MARKER_H)
  const originY = (MARKER_H + SPRITE_GAP) * rowIndex
  const spriteOrigin = new Point(0, originY)
  const spriteSize = new Size(SPRITE_W, SPRITE_H)
  return new MarkerImage(SPRITE_MARKER_URL, markerSize, {
    offset,
    spriteOrigin,
    spriteSize,
  })
}

function drawKakaoMap(
  positions: {
    title: string
    lat: number
    lng: number
    uploadDate: string
    isMyLocation?: boolean
    bodySecondLine?: string
    status?: number
  }[],
  currentLocation?: { latitude: number; longitude: number; uploadDate: string } | null
) {
  const kakao = getKakao()
  if (!mapContainer.value || !kakao?.maps) return

  const { Map, LatLng, Marker, Size, CustomOverlay, event } = kakao.maps
  const kakaoMaps = kakao.maps as Record<string, unknown>
  const ZoomControlClass = kakaoMaps.ZoomControl as new () => { setMap?: (m: unknown) => void }
  const ControlPosition = kakaoMaps.ControlPosition as { RIGHT: unknown }

  const centerForMap =
    currentLocation != null
      ? new LatLng(currentLocation.latitude, currentLocation.longitude)
      : positions.length > 0
        ? new LatLng(positions[0].lat, positions[0].lng)
        : new LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)

  if (!mapInstance) {
    mapInstance = new Map(mapContainer.value, {
      center: centerForMap,
      level: 14,
    })
    if (ZoomControlClass && ControlPosition?.RIGHT) {
      const zoomControl = new ZoomControlClass()
      mapInstance.addControl(zoomControl, ControlPosition.RIGHT)
    }
  }
  mapInstance.setZoomable(true)
  mapInstance.setDraggable(true)

  markersRef.value.forEach((m) => m.setMap(null))
  markersRef.value = []
  closeOverlay()

  const myMarkerImage = createSpriteMarkerImage(kakao, 0)
  const dbMarkerImage = createSpriteMarkerImage(kakao, 1)

  positions.forEach((pos) => {
    const latlng = new LatLng(pos.lat, pos.lng)
    const image = pos.isMyLocation ? myMarkerImage : dbMarkerImage
    const marker = new Marker({
      map: mapInstance,
      position: latlng,
      title: pos.title,
      image,
    })
    ;(marker as unknown as { normalImage?: unknown }).normalImage = image
    markersRef.value.push(marker)

    const content = overlayContent(
      pos.title,
      pos.uploadDate,
      pos.lat,
      pos.lng,
      pos.bodySecondLine
    )
    const overlay = new CustomOverlay({
      content,
      map: null,
      position: marker.getPosition(),
    })

    event.addListener(marker, 'click', () => {
      closeOverlay()
      overlay.setMap(mapInstance)
      currentOverlay = overlay
    })
  })

  if (typeof window !== 'undefined') {
    ;(window as unknown as { __closeKakaoOverlay?: () => void }).__closeKakaoOverlay = closeOverlay
  }

  mapInstance.setCenter(centerForMap)
}

async function loadLocationsAndDrawMap() {
  const kakao = getKakao()
  if (!kakao?.maps) {
    locationsLoadError.value =
      kakaoMapKey.value
        ? '지도 스크립트가 아직 로드되지 않았습니다. 잠시 후 다시 시도하세요.'
        : '지도를 사용하려면 frontend-location/.env에 VITE_KAKAO_MAP_KEY를 설정하세요.'
    return
  }

  locationsLoading.value = true
  locationsLoadError.value = null
  locationsList.value = []
  let positions: {
    title: string
    lat: number
    lng: number
    uploadDate: string
    isMyLocation: boolean
    bodySecondLine?: string
    status?: number
  }[] = []
  try {
    const res = await locationUseCases.getLocations(500)
    const raw = res?.locations
    const all = Array.isArray(raw) ? raw : []
    const list = all
    const statusZero = all.filter((loc) => Number(loc.status) === 0)

    if (statusZero.length > 0) {
      console.log('[지도 마커] loc.status=0 (안읽음, 마커 제외):', statusZero.map((loc) => ({ no: loc.no, latitude: loc.latitude, longitude: loc.longitude, uploadDate: loc.uploadDate, sender: loc.sender, message: loc.message, status: loc.status })))
    }

   

    locationsList.value = list
    const toLat = (loc: { latitude?: number; lat?: number }) => Number(loc.latitude ?? (loc as { lat?: number }).lat)
    const toLng = (loc: { longitude?: number; lng?: number }) => Number(loc.longitude ?? (loc as { lng?: number }).lng)
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
      }
    })

    const myLat = location.value?.latitude
    const myLng = location.value?.longitude
    const isSameCoord = (p: { lat: number; lng: number }) =>
      myLat != null && myLng != null &&
      Math.abs(p.lat - myLat) < 1e-5 && Math.abs(p.lng - myLng) < 1e-5
    if (myLat != null && myLng != null) {
      positions = positions.filter((p) => !isSameCoord(p))
      positions = [
        {
          title: '내 위치',
          lat: myLat,
          lng: myLng,
          uploadDate: location.value ? formatDateTime(location.value.uploadDate) : '',
          isMyLocation: true,
          status: 1,
        },
        ...positions,
      ]
    } else if (positions.length === 0) {
      positions = []
    }
    console.log('[지도 마커] 그릴 마커 개수:', positions.length)
    console.log('[지도 마커] 그릴 마커 전체:', positions.map((p, i) => ({ index: i, title: p.title, lat: p.lat, lng: p.lng, uploadDate: p.uploadDate, isMyLocation: p.isMyLocation, bodySecondLine: p.bodySecondLine })))
  } catch (e) {
    locationsLoadError.value = e instanceof Error ? e.message : '위치 목록을 불러올 수 없습니다.'
  }

  try {
    drawKakaoMap(positions, location.value ?? undefined)
  } catch (e) {
    locationsLoadError.value = e instanceof Error ? e.message : '지도를 그리는 중 오류가 발생했습니다.'
  } finally {
    locationsLoading.value = false
  }
}

watch(
  location,
  (loc) => {
    if (loc && locationsList.value.length === 0) loadLocationsAndDrawMap()
  },
  { immediate: true }
)

onMounted(() => {
  fetchPage(1)
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
  closeOverlay()
  markersRef.value = []
  mapInstance = null
})

async function onSubmitMessage(e: Event) {
  e.preventDefault()
  const s = sender.value.trim()
  const m = messageContent.value.trim()
  if (!s) {
    alert('작성자를 입력하세요.')
    return
  }
  if (!m) {
    alert('내용을 입력하세요.')
    return
  }
  try {
    await sendMessage(s, m)
    sender.value = ''
    messageContent.value = ''
    showMessageModal.value = false
  } catch {
    if (messagesError.value) alert(messagesError.value)
  }
}

function geolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return '위치 사용이 거부되었습니다.'
    case 2:
      return '위치를 사용할 수 없습니다.'
    case 3:
      return '위치 요청 시간이 초과되었습니다.'
    default:
      return '위치를 가져올 수 없습니다.'
  }
}

async function onRefreshLocation() {
  if (!navigator.geolocation) {
    alert('이 브라우저는 위치 기능을 지원하지 않습니다.')
    return
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      try {
        const newMessages = await updateLocation(lat, lng)
        unreadFromLocation.value = newMessages ?? []
        await loadLocationsAndDrawMap()
      } catch {
        if (locationError.value) alert(locationError.value)
      }
    },
    (err) => alert(geolocationErrorMessage(err?.code ?? 0))
  )
}
</script>

<template>
  <div class="app">
    <p v-if="showBackendUnreachableBanner" class="error banner">{{ BACKEND_UNREACHABLE_MSG }}</p>
    <h1>현재 위치 (카카오맵)</h1>
    <p class="hint">아래 버튼으로 위치를 갱신하면 최신 위치가 저장되고, 읽지 않은 메시지를 받아옵니다. 지도에서 마커를 클릭하면 상세 정보가 뜨고, 닫기로 숨길 수 있습니다.</p>
    <button type="button" class="btn" :disabled="locationLoading" @click="onRefreshLocation">
      위치 갱신
    </button>
    <button type="button" class="btn secondary" :disabled="locationLoading" @click="fetchLocation">
      최신 위치 불러오기
    </button>
    <button type="button" class="btn secondary" :disabled="locationsLoading" @click="loadLocationsAndDrawMap">
      지도 마커 새로고침
    </button>
    <p v-if="locationError && !isBackendUnreachable(locationError)" class="error">{{ locationError }}</p>
    <p
      v-if="locationsLoadError && !isBackendUnreachable(locationsLoadError)"
      :class="locationsLoadError.includes('저장된 위치가 없습니다') || locationsLoadError.includes('DB에 location이 없습니다') ? 'hint' : 'error'"
    >
      {{ locationsLoadError }}
    </p>
    <p v-if="location" class="info">
      마지막 갱신: {{ formatDateTime(location.uploadDate) }} · 위도: {{ location.latitude }}, 경도:
      {{ location.longitude }}
    </p>
    <p v-if="locationsList.length > 0" class="hint">지도 마커: {{ locationsList.length }}개 (DB 저장 위치) · 내 위치는 별도 마커로 표시됩니다.</p>
    <div ref="mapContainer" class="map"></div>

    <div class="message-list-header">
      <h2>메시지 목록</h2>
      <button type="button" class="btn" @click="showMessageModal = true">메시지 보내기</button>
    </div>
    <p v-if="messagesError && !isBackendUnreachable(messagesError)" class="error">{{ messagesError }}</p>
    <table class="table">
      <thead>
        <tr>
          <th>번호</th>
          <th>메시지</th>
          <th>작성자</th>
          <th>작성일자</th>
          <th>상태</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="msg in messages" :key="msg.no">
          <td>{{ msg.no }}</td>
          <td>{{ msg.message }}</td>
          <td>{{ msg.sender }}</td>
          <td>{{ formatDateTime(msg.sendDate) }}</td>
          <td>
            <button
              v-if="msg.status === 0"
              type="button"
              class="btn small"
              :disabled="messagesLoading"
              @click="markAsRead(msg.no)"
            >
              안읽음
            </button>
            <template v-else>읽음</template>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="5" class="pager">
            <button
              type="button"
              class="btn small"
              :disabled="page <= 1 || messagesLoading"
              @click="fetchPage(page - 1)"
            >
              이전
            </button>
            <span class="page-info"> {{ page }} / {{ totalPages }} (총 {{ total }}건) </span>
            <button
              type="button"
              class="btn small"
              :disabled="page >= totalPages || messagesLoading"
              @click="fetchPage(page + 1)"
            >
              다음
            </button>
          </td>
        </tr>
      </tfoot>
    </table>

    <div v-if="showMessageModal" class="modal-overlay" @click.self="showMessageModal = false">
      <div class="modal-panel">
        <div class="modal-header">
          <h2>메시지 보내기</h2>
          <button type="button" class="modal-close" aria-label="닫기" @click="showMessageModal = false">&times;</button>
        </div>
        <p class="hint">메시지 전달 후 화면을 새로고침하면 상태를 갱신할 수 있습니다.</p>
        <form class="form" @submit="onSubmitMessage">
          <div class="field">
            <label for="modal-sender">작성자</label>
            <input id="modal-sender" v-model="sender" type="text" maxlength="1000" />
          </div>
          <div class="field">
            <label for="modal-message">내용</label>
            <textarea id="modal-message" v-model="messageContent" rows="5" maxlength="5000"></textarea>
          </div>
          <button type="submit" class="btn" :disabled="messagesLoading">확인</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style>
.kakao-overlay.wrap {
  position: absolute;
  left: 0;
  bottom: 40px;
  width: 288px;
  margin-left: -144px;
  text-align: left;
  overflow: hidden;
  font-size: 12px;
  font-family: 'Malgun Gothic', dotum, '돋움', sans-serif;
  line-height: 1.5;
}
.kakao-overlay.wrap * {
  padding: 0;
  margin: 0;
}
.kakao-overlay .info {
  width: 286px;
  min-height: 80px;
  border-radius: 5px;
  border-bottom: 2px solid #ccc;
  border-right: 1px solid #ccc;
  overflow: hidden;
  background: #fff;
  box-shadow: 0px 1px 2px #888;
}
.kakao-overlay .info .title {
  padding: 5px 0 0 10px;
  height: 30px;
  background: #eee;
  border-bottom: 1px solid #ddd;
  font-size: 14px;
  font-weight: bold;
}
.kakao-overlay .info .close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 17px;
  height: 17px;
  background: url('https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/overlay_close.png');
  cursor: pointer;
}
.kakao-overlay .info .body {
  position: relative;
  overflow: hidden;
}
.kakao-overlay .info .desc {
  position: relative;
  margin: 13px 10px;
  height: auto;
}
.kakao-overlay .desc .ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.kakao-overlay .desc .jibun {
  font-size: 11px;
  color: #888;
  margin-top: 4px;
}
.kakao-overlay .info:after {
  content: '';
  position: absolute;
  margin-left: -12px;
  left: 50%;
  bottom: 0;
  width: 22px;
  height: 12px;
  background: url('https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/vertex_white.png');
}
</style>

<style scoped>
* {
  box-sizing: border-box;
}
.app {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
  background: #fff;
  min-height: 100vh;
}
h1 {
  margin: 0 0 8px;
  font-size: 1.5rem;
}
.message-list-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 32px 0 12px;
}
.message-list-header h2 {
  margin: 0;
  font-size: 1.25rem;
}
h2 {
  margin: 32px 0 12px;
  font-size: 1.25rem;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-panel {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  max-width: 480px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}
.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: #666;
  padding: 0 4px;
}
.modal-close:hover {
  color: #000;
}
.hint {
  color: #666;
  margin: 0 0 12px;
}
.info {
  color: #333;
  margin: 0 0 12px;
}
.error {
  color: #c00;
  margin: 0 0 8px;
}
.error.banner {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #fff0f0;
  border-radius: 6px;
}
.btn {
  padding: 8px 16px;
  margin-right: 8px;
  margin-bottom: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}
.btn:hover:not(:disabled) {
  background: #f0f0f0;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn.secondary {
  background: #f0f0f0;
}
.btn.small {
  padding: 4px 12px;
  font-size: 13px;
}
.map {
  width: 100%;
  height: 560px;
  background: #e0e0e0;
  margin: 12px 0;
  border-radius: 8px;
}
.table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
}
.table th,
.table td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}
.table th {
  background: #f8f8f8;
  font-weight: 600;
}
.table .pager {
  text-align: center;
  background: #fafafa;
}
.page-info {
  margin: 0 12px;
}
.form {
  margin-top: 12px;
}
.field {
  margin-bottom: 12px;
}
.field label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}
.field input,
.field textarea {
  width: 100%;
  max-width: 600px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}
.field textarea {
  resize: vertical;
}
</style>
