package com.sleekydz86.location.infrastructure.persistence.location

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface LocationJpaRepository : JpaRepository<LocationJpaEntity, Long> {

    fun findFirstByOrderByNoDesc(): LocationJpaEntity?

    @Query(value = "SELECT * FROM location ORDER BY no DESC LIMIT :limit", nativeQuery = true)
    fun findAllOrderByNoDescLimit(@Param("limit") limit: Int): List<LocationJpaEntity>
}
