export const SPRITE_MARKER_URL =
  'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markers_sprites2.png'
export const RED_MARKER_URL = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png'

export const MARKER_W = 33
export const MARKER_H = 36
export const OFFSET_X = 12
export const OFFSET_Y = MARKER_H
export const OVER_MARKER_W = 40
export const OVER_MARKER_H = 42
export const OVER_OFFSET_X = 13
export const OVER_OFFSET_Y = OVER_MARKER_H
export const SPRITE_GAP = 10
export const SPRITE_W = 126
export const SPRITE_H = 146
export const MY_MARKER_ROW = 2

export function getKakao() {
  return typeof window !== 'undefined' ? window.kakao : undefined
}

export function overlayContent(
  title: string,
  uploadDate: string,
  lat: number,
  lng: number,
  bodySecondLine?: string
): string {
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

export function getTimeHTML(distance: number): string {
  const walkTime = Math.floor(distance / 67)
  let walkHour = ''
  const walkMin = '<span class="number">' + (walkTime % 60) + '</span>분'
  if (walkTime > 60) {
    walkHour = '<span class="number">' + Math.floor(walkTime / 60) + '</span>시간 '
  }
  const bycicleTime = Math.floor(distance / 227)
  let bycicleHour = ''
  const bycicleMin = '<span class="number">' + (bycicleTime % 60) + '</span>분'
  if (bycicleTime > 60) {
    bycicleHour = '<span class="number">' + Math.floor(bycicleTime / 60) + '</span>시간 '
  }
  let content = '<ul class="dotOverlay distanceInfo">'
  content += '<li><span class="label">총거리</span><span class="number">' + distance + '</span>m</li>'
  content += '<li><span class="label">도보</span>' + walkHour + walkMin + '</li>'
  content += '<li><span class="label">자전거</span>' + bycicleHour + bycicleMin + '</li>'
  content += '</ul>'
  return content
}

type KakaoMaps = {
  maps: {
    Size: (w: number, h: number) => unknown
    Point: (x: number, y: number) => unknown
    MarkerImage: new (url: string, size: unknown, opts?: unknown) => unknown
  }
}

export function createSpriteMarkerImage(kakao: KakaoMaps, rowIndex: number): unknown {
  const Size = kakao.maps.Size as new (w: number, h: number) => unknown
  const Point = kakao.maps.Point as new (x: number, y: number) => unknown
  const MarkerImage = kakao.maps.MarkerImage as new (
    url: string,
    size: unknown,
    opts?: unknown
  ) => unknown
  const markerSize = new Size(MARKER_W, MARKER_H)
  const offset = new Point(OFFSET_X, OFFSET_Y)
  const originY = (MARKER_H + SPRITE_GAP) * rowIndex
  const spriteOrigin = new Point(0, originY)
  const spriteSize = new Size(SPRITE_W, SPRITE_H)
  return new MarkerImage(SPRITE_MARKER_URL, markerSize, {
    offset,
    spriteOrigin,
    spriteSize,
  })
}

export function createRedMarkerImage(kakao: KakaoMaps): unknown {
  const Size = kakao.maps.Size as new (w: number, h: number) => unknown
  const Point = kakao.maps.Point as new (x: number, y: number) => unknown
  const MarkerImage = kakao.maps.MarkerImage as new (
    url: string,
    size: unknown,
    opts?: unknown
  ) => unknown
  const size = new Size(64, 69)
  const offset = new Point(27, 69)
  return new MarkerImage(RED_MARKER_URL, size, { offset })
}

export function createMyLocationMarkerImages(kakao: KakaoMaps): {
  normalImage: unknown
  overImage: unknown
  clickImage: unknown
} {
  const redImage = createRedMarkerImage(kakao)
  return {
    normalImage: redImage,
    overImage: redImage,
    clickImage: redImage,
  }
}
