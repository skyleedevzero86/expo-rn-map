package com.sleekydz86.location.infrastructure.persistence.message

import com.sleekydz86.location.domain.message.MessageStatus
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query

interface MessageJpaRepository : JpaRepository<MessageJpaEntity, Long> {

    fun findByOrderByNoDesc(pageable: Pageable): List<MessageJpaEntity>

    fun findByStatusOrderByNoDesc(status: MessageStatus): List<MessageJpaEntity>

    @Modifying
    @Query("UPDATE MessageJpaEntity m SET m.status = com.example.location.domain.message.MessageStatus.READ WHERE m.status = com.example.location.domain.message.MessageStatus.UNREAD")
    fun markAllUnreadAsRead()
}
