package com.sleekydz86.location.infrastructure.persistence.location

import com.sleekydz86.location.domain.location.Coordinates
import com.sleekydz86.location.domain.location.Location
import com.sleekydz86.location.domain.location.LocationRepositoryPort
import com.sleekydz86.location.domain.location.LocationWithMessage
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Primary
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import java.time.Instant
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
@Primary
class LocationRepositoryAdapter(
    private val jpaRepository: LocationJpaRepository
) : LocationRepositoryPort {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun findLatest(): Location? =
        jpaRepository.findFirstByOrderByNoDesc()?.toDomain()

    override fun findRecent(limit: Int): List<Location> {
        val safeLimit = limit.coerceAtLeast(1).coerceAtMost(500)
        val pageable = PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "no"))
        val list = jpaRepository.findAllByOrderByNoDesc(pageable).map { it.toDomain() }
        log.info("[location] findRecent(limit={}) -> DB 조회 결과 {} 건", safeLimit, list.size)
        return list
    }

    override fun findRecentWithLatestMessage(limit: Int): List<LocationWithMessage> {
        val safeLimit = limit.coerceAtLeast(1).coerceAtMost(500)
        val pageable = PageRequest.of(0, safeLimit)
        val readStatus = 1
        val rows = jpaRepository.findRecentWithLatestMessage(pageable, readStatus)
        return rows.map { row ->
            val no = (row[0] as Number).toLong()
            val lat = (row[1] as Number).toDouble()
            val lng = (row[2] as Number).toDouble()
            val uploadDate = when (val d = row[3]) {
                is java.sql.Timestamp -> d.toInstant()
                is java.time.Instant -> d
                else -> Instant.now()
            }
            val sender = (if (row.size > 4) row[4] else null)?.toString()?.takeIf { it.isNotBlank() }
            val message = (if (row.size > 5) row[5] else null)?.toString()?.takeIf { it.isNotBlank() }
            LocationWithMessage(
                id = no,
                coordinates = Coordinates(lat, lng),
                uploadedAt = uploadDate,
                sender = sender,
                message = message
            )
        }.also { list ->
            log.info(
                "[location] findRecentWithLatestMessage(limit={}, readStatus=1) -> {} 건, location_no 목록: {}",
                safeLimit,
                list.size,
                list.map { it.id }
            )
        }
    }

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
