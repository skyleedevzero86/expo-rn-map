package com.sleekydz86.location.application.location

interface LocationRepositoryPort {

    fun findLatest(): Location?
    fun findRecent(limit: Int): List<Location>

    fun replaceCurrent(coordinates: Coordinates)
}
