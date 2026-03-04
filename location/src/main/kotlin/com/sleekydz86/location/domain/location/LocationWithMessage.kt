package com.sleekydz86.location.domain.location

import java.time.Instant

data class LocationWithMessage(
    val id: Long,
    val coordinates: Coordinates,
    val uploadedAt: Instant,
    val sender: String?,
    val message: String?
)
