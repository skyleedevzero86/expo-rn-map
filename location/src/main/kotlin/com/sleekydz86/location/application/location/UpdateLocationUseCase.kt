package com.sleekydz86.location.application.location

import com.sleekydz86.location.domain.location.Coordinates
import com.sleekydz86.location.domain.location.LocationRepositoryPort
import org.springframework.stereotype.Service

@Service
class UpdateLocationUseCase(
    private val locationRepository: LocationRepositoryPort
) {
    fun execute(latitude: Double, longitude: Double, source: String? = null) {
        val src = source?.take(20)?.takeIf { it in listOf("web", "mobile") } ?: "web"
        locationRepository.replaceCurrent(Coordinates(latitude, longitude), src)
    }
}
