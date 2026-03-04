package com.sleekydz86.location.application.location

import com.sleekydz86.location.domain.location.Location
import com.sleekydz86.location.domain.location.LocationRepositoryPort
import org.springframework.stereotype.Service

@Service
class GetLocationsUseCase(
    private val locationRepository: LocationRepositoryPort
) {
    fun execute(limit: Int = 100): List<Location> = locationRepository.findRecent(limit)
}
