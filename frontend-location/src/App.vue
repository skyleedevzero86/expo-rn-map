<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useLocation } from '@/presentation/hooks/useLocation'
import { useMessages } from '@/presentation/hooks/useMessages'
import { locationUseCases } from '@/composition'
import { formatDateTime } from '@/presentation/utils/format'
import type { MessageItem, LocationResponse } from '@/domain/types'

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
} = useMessages()

const sender = ref('')
const messageContent = ref('')
const unreadFromLocation = ref<MessageItem[]>([])
const locationsList = ref<LocationResponse[]>([])
const locationsLoading = ref(false)
const locationsLoadError = ref<string | null>(null)
const kakaoMapKey = ref(import.meta.env.VITE_KAKAO_MAP_KEY ?? '')

let mapInstance: ReturnType<Window['kakao']['maps']['Map']> | null = null
const markersRef = ref<ReturnType<Window['kakao']['maps']['Marker']>[]>([])
let currentOverlay: ReturnType<Window['kakao']['maps']['CustomOverlay']> | null = null

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

function getKakao() {
  return typeof window !== 'undefined' ? window.kakao : undefined
}

function overlayContent(title: string, uploadDate: string, lat: number, lng: number) {
  const escapedTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const escapedDate = uploadDate.replace(/</g, '&lt;').replace(/>/g, '&gt;')
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
    `        <div class="jibun ellipsis">위도 ${lat.toFixed(5)}, 경도 ${lng.toFixed(5)}</div>` +
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

function drawKakaoMap(positions: { title: string; lat: number; lng: number; uploadDate: string }[]) {
  const kakao = getKakao()
  if (!mapContainer.value || !kakao?.maps) return

  const { Map, LatLng, Marker, MarkerImage, Size, CustomOverlay, event } = kakao.maps

  if (!mapInstance) {
    const center = positions.length
      ? new LatLng(positions[0].lat, positions[0].lng)
      : new LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)
    mapInstance = new Map(mapContainer.value, {
      center,
      level: 14,
    })
  }

  markersRef.value.forEach((m) => m.setMap(null))
  markersRef.value = []
  closeOverlay()

  const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'
  const imageSize = new Size(24, 35)
  const markerImage = new MarkerImage(imageSrc, imageSize)

  positions.forEach((pos, i) => {
    const latlng = new LatLng(pos.lat, pos.lng)
    const marker = new Marker({
      map: mapInstance,
      position: latlng,
      title: pos.title,
      image: markerImage,
    })
    markersRef.value.push(marker)

    const content = overlayContent(pos.title, pos.uploadDate, pos.lat, pos.lng)
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

  if (positions.length > 0) {
    mapInstance.setCenter(new LatLng(positions[0].lat, positions[0].lng))
  }
}

async function loadLocationsAndDrawMap() {
  const kakao = getKakao()
  if (!kakao?.maps) return

  locationsLoading.value = true
  locationsLoadError.value = null
  try {
    const res = await locationUseCases.getLocations(100)
    const list = res?.locations ?? []
    locationsList.value = list

    const positions = list.map((loc) => ({
      title: `위치 #${loc.no} · ${formatDateTime(loc.uploadDate)}`,
      lat: Number(loc.latitude),
      lng: Number(loc.longitude),
      uploadDate: formatDateTime(loc.uploadDate),
    }))

    if (positions.length === 0 && location.value) {
      positions.push({
        title: '내 위치',
        lat: location.value.latitude,
        lng: location.value.longitude,
        uploadDate: formatDateTime(location.value.uploadDate),
      })
    }

    try {
      drawKakaoMap(positions)
    } catch (e) {
      locationsLoadError.value = e instanceof Error ? e.message : '지도를 그리는 중 오류가 발생했습니다.'
    }
  } catch (e) {
    locationsLoadError.value = e instanceof Error ? e.message : '위치 목록을 불러올 수 없습니다.'
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
  if (kakaoMapKey.value) {
    if (getKakao()?.maps) {
      loadLocationsAndDrawMap()
      return
    }
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapKey.value}`
    script.async = true
    script.onload = () => {
      const k = getKakao()
      if (k?.maps?.load) {
        k.maps.load(() => {
          loadLocationsAndDrawMap()
          if (location.value) fetchLocation()
        })
      } else {
        loadLocationsAndDrawMap()
        if (location.value) fetchLocation()
      }
    }
    script.onerror = () => {
      locationsLoadError.value = '지도 스크립트를 불러올 수 없습니다.'
    }
    document.head.appendChild(script)
  } else {
    locationsLoadError.value = '지도를 사용하려면 .env에 VITE_KAKAO_MAP_KEY를 설정하세요.'
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
    <p v-if="locationError" class="error">{{ locationError }}</p>
    <p v-if="locationsLoadError" class="error">{{ locationsLoadError }}</p>
    <p v-if="location" class="info">
      마지막 갱신: {{ formatDateTime(location.uploadDate) }} · 위도: {{ location.latitude }}, 경도:
      {{ location.longitude }}
    </p>
    <div ref="mapContainer" class="map"></div>

    <h2>메시지 목록</h2>
    <p v-if="messagesError" class="error">{{ messagesError }}</p>
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
          <td>{{ msg.status === 0 ? '안읽음' : '읽음' }}</td>
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

    <h2>메시지 보내기</h2>
    <p class="hint">메시지 전달 후 화면을 새로고침하면 상태를 갱신할 수 있습니다.</p>
    <form class="form" @submit="onSubmitMessage">
      <div class="field">
        <label for="sender">작성자</label>
        <input id="sender" v-model="sender" type="text" maxlength="1000" />
      </div>
      <div class="field">
        <label for="message">내용</label>
        <textarea id="message" v-model="messageContent" rows="5" maxlength="5000"></textarea>
      </div>
      <button type="submit" class="btn" :disabled="messagesLoading">확인</button>
    </form>
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
h2 {
  margin: 32px 0 12px;
  font-size: 1.25rem;
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
  height: 400px;
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
