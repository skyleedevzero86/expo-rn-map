package com.sleekydz86.location.interfaces.dto

import java.time.Instant

data class LocationResponse(
    val no: Long,
    val latitude: Double,
    val longitude: Double,
    val uploadDate: Instant
)
