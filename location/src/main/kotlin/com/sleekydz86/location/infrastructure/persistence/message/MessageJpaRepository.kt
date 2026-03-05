package com.sleekydz86.location.infrastructure.persistence.message

import com.sleekydz86.location.domain.message.MessageStatus
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface MessageJpaRepository : JpaRepository<MessageJpaEntity, Long> {

    fun findByOrderByNoDesc(pageable: Pageable): List<MessageJpaEntity>

    fun findByStatusOrderByNoDesc(status: MessageStatus): List<MessageJpaEntity>

    fun findByLocationNoInOrderBySendDateDesc(locationIds: List<Long>): List<MessageJpaEntity>

    @Modifying
    @Query("UPDATE MessageJpaEntity m SET m.status = :readStatus WHERE m.status = :unreadStatus")
    fun markAllUnreadAsRead(
        @Param("readStatus") readStatus: MessageStatus,
        @Param("unreadStatus") unreadStatus: MessageStatus
    )

    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE message SET status = 1 WHERE no = :no", nativeQuery = true)
    fun markAsReadByNo(@Param("no") no: Long): Int
}
