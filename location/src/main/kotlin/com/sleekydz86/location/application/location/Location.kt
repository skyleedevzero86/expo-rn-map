package com.sleekydz86.location.application.location

import java.time.Instant

data class Location(
    val id: Long,
    val coordinates: Coordinates,
    val uploadedAt: Instant
)
