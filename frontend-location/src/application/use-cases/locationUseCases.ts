import type { IBackendApi } from '@/application/ports/IBackendApi'
import type { LocationResponse, LocationsResponse } from '@/domain/types'

export async function getCurrentLocation(api: IBackendApi): Promise<LocationResponse | null> {
  return api.getLocation().catch(() => null)
}

export async function getLocations(api: IBackendApi, limit?: number): Promise<LocationsResponse> {
  return api.getLocations(limit)
}

export async function updateLocationAndGetMessages(
  api: IBackendApi,
  latitude: number,
  longitude: number
) {
  const res = await api.postLocationAndGetMessages(latitude, longitude)
  return res.message
}
