package com.sleekydz86.location.interfaces.dto

import com.fasterxml.jackson.annotation.JsonProperty
import java.time.Instant

data class LocationResponse(
    val no: Long,
    val latitude: Double,
    val longitude: Double,
    val uploadDate: Instant,
    val sender: String? = null,
    val message: String? = null,
    @JsonProperty("status")
    val status: Int = 1
)
