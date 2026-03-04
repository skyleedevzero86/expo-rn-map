package com.sleekydz86.location.application.location

import com.sleekydz86.location.domain.location.LocationRepositoryPort
import com.sleekydz86.location.domain.location.LocationWithMessage
import org.springframework.stereotype.Service

@Service
class GetLocationsWithMessagesUseCase(
    private val locationRepository: LocationRepositoryPort
) {
   
    fun execute(limit: Int = 100): List<LocationWithMessage> =
        locationRepository.findRecentWithLatestMessage(limit)
}
