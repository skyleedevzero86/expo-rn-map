package com.sleekydz86.location.interfaces.dto

import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotNull

data class PostLocationRequest(
    @field:NotNull(message = "위도는 필수입니다.")
    @field:DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다.")
    @field:DecimalMax(value = "90.0", message = "위도는 90 이하여야 합니다.")
    val latitude: Double,

    @field:NotNull(message = "경도는 필수입니다.")
    @field:DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다.")
    @field:DecimalMax(value = "180.0", message = "경도는 180 이하여야 합니다.")
    val longitude: Double,

    val source: String? = null
)
