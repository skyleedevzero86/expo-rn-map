/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, unknown>
  export default component
}

interface KakaoMaps {
  maps: {
    load?: (callback?: () => void) => void
    LatLng: new (lat: number, lng: number) => { getLat: () => number; getLng: () => number }
    Map: new (container: HTMLElement, options: { center: unknown; level: number }) => {
      setCenter: (latlng: unknown) => void
      getCenter: () => unknown
    }
    Marker: new (options: { map: unknown; position: unknown; title?: string; image?: unknown }) => {
      getPosition: () => unknown
      setMap: (map: unknown) => void
      setImage: (image: unknown) => void
    }
    Point: new (x: number, y: number) => unknown
    MarkerImage: new (src: string, size: unknown) => unknown
    Size: new (width: number, height: number) => unknown
    CustomOverlay: new (options: {
      content: string
      map?: unknown
      position: unknown
      xAnchor?: number
      yAnchor?: number
      zIndex?: number
    }) => {
      setMap: (map: unknown) => void
      setContent: (content: string) => void
      setPosition: (position: unknown) => void
    }
    Polyline: new (options: {
      map?: unknown
      path: unknown[]
      strokeWeight?: number
      strokeColor?: string
      strokeOpacity?: number
      strokeStyle?: string
    }) => {
      setMap: (map: unknown) => void
      setPath: (path: unknown[]) => void
      getPath: () => unknown[]
      getLength: () => number
    }
    event: {
      addListener: (target: unknown, type: string, handler: () => void) => void
    }
  }
}
declare global {
  interface Window {
    kakao?: KakaoMaps
  }
}
export {}
