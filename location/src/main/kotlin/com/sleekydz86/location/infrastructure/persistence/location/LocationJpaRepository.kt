package com.sleekydz86.location.infrastructure.persistence.location

import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface LocationJpaRepository : JpaRepository<LocationJpaEntity, Long> {

    fun findFirstByOrderByNoDesc(): LocationJpaEntity?

    fun findTopByOrderByNoDesc(pageable: Pageable): List<LocationJpaEntity>
}
