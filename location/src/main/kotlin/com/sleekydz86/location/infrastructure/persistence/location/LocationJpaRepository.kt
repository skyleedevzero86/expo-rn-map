package com.sleekydz86.location.infrastructure.persistence.location

import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
interface LocationJpaRepository : JpaRepository<LocationJpaEntity, Long> {

    fun findFirstByOrderByNoDesc(): LocationJpaEntity?

    @Query("SELECT e FROM LocationJpaEntity e ORDER BY e.no DESC")
    fun findAllByOrderByNoDesc(pageable: Pageable): List<LocationJpaEntity>

}
