package com.sleekydz86.location.application.location

data class Coordinates(
    val latitude: Double,
    val longitude: Double
) {
    init {
        require(latitude in -90.0..90.0) { "위도는 -90에서 90 사이여야 합니다." }
        require(longitude in -180.0..180.0) { "경도는 -180에서 180 사이여야 합니다." }
    }
}
