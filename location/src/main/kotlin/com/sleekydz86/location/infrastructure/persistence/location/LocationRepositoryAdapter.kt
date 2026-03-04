package com.sleekydz86.location.infrastructure.persistence.location

import com.sleekydz86.location.domain.location.Coordinates
import com.sleekydz86.location.domain.location.Location
import com.sleekydz86.location.domain.location.LocationRepositoryPort
import org.springframework.context.annotation.Primary
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
@Primary
class LocationRepositoryAdapter(
    private val jpaRepository: LocationJpaRepository
) : LocationRepositoryPort {

    override fun findLatest(): Location? =
        jpaRepository.findFirstByOrderByNoDesc()?.toDomain()

    override fun findRecent(limit: Int): List<Location> =
        jpaRepository.findAllOrderByNoDescLimit(limit.coerceAtLeast(1).coerceAtMost(500))
            .map { it.toDomain() }

    @Transactional
    override fun replaceCurrent(coordinates: Coordinates) {
        jpaRepository.save(
            LocationJpaEntity(
                latitude = coordinates.latitude,
                longitude = coordinates.longitude
            )
        )
    }
}

private fun LocationJpaEntity.toDomain(): Location = Location(
    id = no,
    coordinates = Coordinates(latitude, longitude),
    uploadedAt = uploadDate
)
