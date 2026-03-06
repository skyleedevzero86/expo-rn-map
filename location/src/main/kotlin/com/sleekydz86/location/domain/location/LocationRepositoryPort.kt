package com.sleekydz86.location.domain.location

interface LocationRepositoryPort {

    fun findLatest(): Location?
    fun findRecent(limit: Int): List<Location>

    fun findRecentWithLatestMessage(limit: Int): List<LocationWithMessage>

    fun replaceCurrent(coordinates: Coordinates, source: String? = null)
}
