import { ref, type Ref } from 'vue'
import {
  getKakao,
  overlayContent,
  getTimeHTML,
  createSpriteMarkerImage,
  createMyLocationMarkerImages,
  createRedMarkerImage,
} from '@/presentation/utils/kakaoMap'
import type { MapPosition } from '@/domain/types'

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

export function useMap(selectedSender: Ref<string | null>) {
  const mapContainer = ref<HTMLDivElement | null>(null)
  let mapInstance: ReturnType<Window['kakao']['maps']['Map']> | null = null
  const markersRef = ref<ReturnType<Window['kakao']['maps']['Marker']>[]>([])
  let currentOverlay: ReturnType<Window['kakao']['maps']['CustomOverlay']> | null = null
  let pathOverlays: {
    polyline: ReturnType<Window['kakao']['maps']['Polyline']>
    overlays: ReturnType<Window['kakao']['maps']['CustomOverlay']>[]
  }[] = []
  let selectedMyMarker: ReturnType<Window['kakao']['maps']['Marker']> | null = null

  function closeOverlay() {
    if (currentOverlay && getKakao()) {
      currentOverlay.setMap(null)
      currentOverlay = null
    }
    if (selectedMyMarker) {
      const m = selectedMyMarker as unknown as { normalImage?: unknown; setImage?: (img: unknown) => void }
      if (m.normalImage && m.setImage) m.setImage(m.normalImage)
      selectedMyMarker = null
    }
  }

  function drawKakaoMap(
    positions: MapPosition[],
    currentLocation?: { latitude: number; longitude: number; uploadDate: string } | null,
    pathGroups?: { lat: number; lng: number }[][]
  ) {
    const kakao = getKakao()
    if (!mapContainer.value || !kakao?.maps) return

    const { Map, LatLng, Marker, CustomOverlay, Polyline, event } = kakao.maps
    const kakaoMaps = kakao.maps as Record<string, unknown>
    const ZoomControlClass = kakaoMaps.ZoomControl as new () => { setMap?: (m: unknown) => void }
    const ControlPosition = kakaoMaps.ControlPosition as { RIGHT: unknown }

    selectedMyMarker = null
    pathOverlays.forEach(({ polyline, overlays }) => {
      polyline.setMap(null)
      overlays.forEach((o) => o.setMap(null))
    })
    pathOverlays = []

    const senderHighlight = selectedSender.value?.trim() ?? ''
    const firstHighlighted = positions.find(
      (p) => !p.isMyLocation && senderHighlight !== '' && (p.sender ?? '').trim() === senderHighlight
    )
    const firstDbPosition = positions.find((p) => !p.isMyLocation)
    const centerForMap =
      firstHighlighted != null
        ? new LatLng(firstHighlighted.lat, firstHighlighted.lng)
        : senderHighlight !== ''
          ? firstDbPosition != null
            ? new LatLng(firstDbPosition.lat, firstDbPosition.lng)
            : new LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)
          : currentLocation != null
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

    const myLocationImages = createMyLocationMarkerImages(kakao)
    const dbMarkerImage = createSpriteMarkerImage(kakao, 1)
    const highlightedMarkerImage = createRedMarkerImage(kakao)

    positions.forEach((pos) => {
      const latlng = new LatLng(pos.lat, pos.lng)
      const isMy = !!pos.isMyLocation
      const isHighlighted =
        !isMy && senderHighlight !== '' && (pos.sender ?? '').trim() === senderHighlight
      const image = isMy ? myLocationImages.normalImage : isHighlighted ? highlightedMarkerImage : dbMarkerImage
      const marker = new Marker({
        map: mapInstance,
        position: latlng,
        title: pos.title,
        image,
      })
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

      if (isMy) {
        ;(marker as unknown as { normalImage?: unknown; setImage?: (img: unknown) => void }).normalImage =
          myLocationImages.normalImage
        event.addListener(marker, 'mouseover', () => {
          if (selectedMyMarker !== marker) {
            ;(marker as unknown as { setImage?: (img: unknown) => void }).setImage(myLocationImages.overImage)
          }
        })
        event.addListener(marker, 'mouseout', () => {
          if (selectedMyMarker !== marker) {
            ;(marker as unknown as { setImage?: (img: unknown) => void }).setImage(myLocationImages.normalImage)
          }
        })
        event.addListener(marker, 'click', () => {
          if (selectedMyMarker && selectedMyMarker !== marker) {
            const prev = selectedMyMarker as unknown as {
              normalImage?: unknown
              setImage?: (img: unknown) => void
            }
            if (prev.normalImage && prev.setImage) prev.setImage(prev.normalImage)
          }
          ;(marker as unknown as { setImage?: (img: unknown) => void }).setImage(myLocationImages.clickImage)
          selectedMyMarker = marker
          closeOverlay()
          overlay.setMap(mapInstance)
          currentOverlay = overlay
        })
      } else {
        event.addListener(marker, 'click', () => {
          closeOverlay()
          overlay.setMap(mapInstance)
          currentOverlay = overlay
        })
      }
      markersRef.value.push(marker)
    })

    if (pathGroups?.length && mapInstance) {
      pathGroups.forEach((pathGroup) => {
        if (pathGroup.length < 2) return
        const path = pathGroup.map((p) => new LatLng(p.lat, p.lng))
        const polyline = new Polyline({
          map: mapInstance,
          path,
          strokeWeight: 3,
          strokeColor: '#db4040',
          strokeOpacity: 1,
          strokeStyle: 'solid',
        })
        const overlays: ReturnType<Window['kakao']['maps']['CustomOverlay']>[] = []
        path.forEach((position, i) => {
          const circleOverlay = new CustomOverlay({
            content: '<span class="dot path-dot"></span>',
            position,
            zIndex: 2,
          })
          circleOverlay.setMap(mapInstance)
          overlays.push(circleOverlay)
          if (i > 0 && i < path.length - 1) {
            const segPath = path.slice(0, i + 1)
            const segPoly = new Polyline({ path: segPath })
            const distance = Math.round(segPoly.getLength())
            const distanceOverlay = new CustomOverlay({
              content:
                '<div class="dotOverlay dotOverlay-side">거리 <span class="number">' +
                distance +
                '</span>m</div>',
              position,
              yAnchor: 0.5,
              xAnchor: 0,
              zIndex: 1,
            })
            distanceOverlay.setMap(mapInstance)
            overlays.push(distanceOverlay)
          }
        })
        const totalDistance = Math.round(polyline.getLength())
        const lastPos = path[path.length - 1]
        const totalOverlay = new CustomOverlay({
          content: '<div class="dotOverlay-side">' + getTimeHTML(totalDistance) + '</div>',
          position: lastPos,
          xAnchor: 0,
          yAnchor: 0.5,
          zIndex: 1,
        })
        totalOverlay.setMap(mapInstance)
        overlays.push(totalOverlay)
        pathOverlays.push({ polyline, overlays })
      })
    }

    if (typeof window !== 'undefined') {
      ;(window as unknown as { __closeKakaoOverlay?: () => void }).__closeKakaoOverlay = closeOverlay
    }

    mapInstance.setCenter(centerForMap)
  }

  function dispose() {
    closeOverlay()
    pathOverlays.forEach(({ polyline, overlays }) => {
      polyline.setMap(null)
      overlays.forEach((o) => o.setMap(null))
    })
    pathOverlays = []
    markersRef.value = []
    mapInstance = null
  }

  return { mapContainer, drawKakaoMap, closeOverlay, getKakao, dispose }
}
