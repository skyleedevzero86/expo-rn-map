package com.sleekydz86.location.infrastructure.persistence.location

import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface LocationJpaRepository : JpaRepository<LocationJpaEntity, Long> {

    fun findFirstByOrderByNoDesc(): LocationJpaEntity?

    @Query("SELECT e FROM LocationJpaEntity e ORDER BY e.no DESC")
    fun findAllByOrderByNoDesc(pageable: Pageable): List<LocationJpaEntity>

    @Query(
        value = """
            SELECT l.no, l.latitude, l.longitude, l.upload_date,
              (SELECT m.sender FROM message m WHERE m.location_no = l.no AND m.status = :readStatus ORDER BY m.send_date DESC LIMIT 1),
              (SELECT m.`message` FROM message m WHERE m.location_no = l.no AND m.status = :readStatus ORDER BY m.send_date DESC LIMIT 1)
            FROM location l
            WHERE EXISTS (SELECT 1 FROM message m WHERE m.location_no = l.no AND m.status = :readStatus)
            ORDER BY l.upload_date DESC
            """,
        nativeQuery = true
    )
    fun findRecentWithLatestMessage(pageable: Pageable, @Param("readStatus") readStatus: Int): List<Array<Any>>
}
