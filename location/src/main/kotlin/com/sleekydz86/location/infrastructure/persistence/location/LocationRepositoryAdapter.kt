package com.sleekydz86.location.infrastructure.persistence.location

import com.sleekydz86.location.domain.location.Coordinates
import com.sleekydz86.location.domain.location.Location
import com.sleekydz86.location.domain.location.LocationRepositoryPort
import com.sleekydz86.location.domain.location.LocationWithMessage
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Primary
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Component
@Primary
class LocationRepositoryAdapter(
    private val jpaRepository: LocationJpaRepository,
    @PersistenceContext private val entityManager: EntityManager
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
       
        val sql = """
            SELECT l.no, l.latitude, l.longitude, l.upload_date, latest.sender, latest.`message`, CAST(latest.status AS SIGNED)
            FROM location l
            INNER JOIN (
                SELECT m.location_no, m.sender, m.`message`, m.status, m.send_date,
                    ROW_NUMBER() OVER (PARTITION BY m.location_no ORDER BY m.send_date DESC) AS rn
                FROM message m
                WHERE m.location_no IS NOT NULL
            ) latest ON latest.location_no = l.no AND latest.rn = 1
            ORDER BY latest.send_date DESC
            LIMIT $safeLimit
            """
        @Suppress("UNCHECKED_CAST")
        val rows = entityManager.createNativeQuery(sql).resultList as List<Array<Any>>
        log.info("[location] findRecentWithLatestMessage(limit={}) -> 위치(최신메시지1개씩) {} 건", safeLimit, rows.size)
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
            val status = (if (row.size > 6) row[6] else null)?.let { (it as? Number)?.toInt() ?: 1 } ?: 1
            LocationWithMessage(
                id = no,
                coordinates = Coordinates(lat, lng),
                uploadedAt = uploadDate,
                sender = sender,
                message = message,
                status = status
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
