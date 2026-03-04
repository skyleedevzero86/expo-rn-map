package com.sleekydz86.location.application.location

import com.sleekydz86.location.domain.location.Location
import com.sleekydz86.location.domain.location.LocationRepositoryPort
import org.springframework.stereotype.Service

@Service
class GetCurrentLocationUseCase(
    private val locationRepository: LocationRepositoryPort
) {
    fun execute(): Location? = locationRepository.findLatest()
}
