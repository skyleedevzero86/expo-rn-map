<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLocation } from '@/presentation/hooks/useLocation'
import { useMessages } from '@/presentation/hooks/useMessages'
import { useLocationsMap } from '@/presentation/hooks/useLocationsMap'
import { formatDateTime } from '@/presentation/utils/format'
import type { MessageItem } from '@/domain/types'

const BACKEND_UNREACHABLE_MSG =
  '백엔드 서버에 연결할 수 없습니다. location 폴더에서 gradlew bootRun (Windows: gradlew.bat bootRun)으로 서버를 실행해 주세요.'

const isBackendUnreachable = (msg: string | null) =>
  msg != null && msg.trim() === BACKEND_UNREACHABLE_MSG.trim()

const sender = ref('')
const messageContent = ref('')
const showMessageModal = ref(false)
const unreadFromLocation = ref<MessageItem[]>([])

const { location, loading: locationLoading, error: locationError, fetchLocation, updateLocation } =
  useLocation()

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

const {
  mapContainer,
  selectedSender,
  highlightedSenderCoords,
  locationsList,
  locationsLoading,
  locationsLoadError,
  loadLocationsAndDrawMap,
  onSelectSender,
} = useLocationsMap(location, fetchLocation)

const showBackendUnreachableBanner = computed(
  () =>
    isBackendUnreachable(locationError.value) ||
    isBackendUnreachable(messagesError.value) ||
    isBackendUnreachable(locationsLoadError.value)
)

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

onMounted(() => {
  fetchPage(1)
})

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
    <p class="hint">DB에 저장하는 것은 <strong>위치 갱신</strong>뿐입니다. 최신 위치 불러오기·지도 마커 새로고침은 DB에 저장하지 않고 읽기만 합니다. 지도에서 마커를 클릭하면 상세 정보가 뜨고, 닫기로 숨길 수 있습니다.</p>
    <button type="button" class="btn" :disabled="locationLoading" @click="onRefreshLocation">
      위치 갱신 (DB 저장)
    </button>
    <button type="button" class="btn secondary" :disabled="locationLoading" @click="fetchLocation">
      최신 위치 불러오기 (저장 안 함)
    </button>
    <button type="button" class="btn secondary" :disabled="locationsLoading" @click="loadLocationsAndDrawMap">
      지도 마커 새로고침 (저장 안 함)
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
    <p v-if="selectedSender && highlightedSenderCoords.length > 0" class="hint">
      선택 작성자 {{ selectedSender }} (DB 저장 위치 {{ highlightedSenderCoords.length }}곳):
      <span v-for="(c, i) in highlightedSenderCoords" :key="i">
        위도 {{ c.lat.toFixed(5) }}, 경도 {{ c.lng.toFixed(5) }}<template v-if="Number(i) < highlightedSenderCoords.length - 1"> · </template>
      </span>
    </p>
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
          <td
            :class="{ 'sender-cell': msg.status === 1 }"
            @click="msg.status === 1 && onSelectSender(msg.sender)"
          >
            {{ msg.sender }}
          </td>
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
