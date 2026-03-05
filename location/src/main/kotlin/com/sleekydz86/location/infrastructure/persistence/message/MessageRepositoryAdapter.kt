package com.sleekydz86.location.infrastructure.persistence.message

import com.sleekydz86.location.domain.message.Message
import com.sleekydz86.location.domain.message.MessageRepositoryPort
import com.sleekydz86.location.domain.message.MessageStatus
import org.springframework.context.annotation.Primary
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import org.slf4j.LoggerFactory

@Component
@Primary
class MessageRepositoryAdapter(
    private val jpaRepository: MessageJpaRepository
) : MessageRepositoryPort {
    private val log = LoggerFactory.getLogger(javaClass)

    override fun countAll(): Long = jpaRepository.count()

    override fun findAllPaginated(page: Int, pageSize: Int): List<Message> =
        jpaRepository.findByOrderByNoDesc(PageRequest.of(page - 1, pageSize))
            .map { it.toDomain() }

    override fun save(message: Message): Message {
        val entity = MessageJpaEntity(
            sender = message.sender,
            content = message.content,
            sendDate = message.sentAt,
            status = message.status,
            locationNo = message.locationId
        )
        val saved = jpaRepository.save(entity)
        return saved.toDomain()
    }

    override fun findUnread(): List<Message> =
        jpaRepository.findByStatusOrderByNoDesc(MessageStatus.UNREAD).map { it.toDomain() }

    @Transactional
    override fun findUnreadAndMarkAsRead(): List<Message> {
        val unread = jpaRepository.findByStatusOrderByNoDesc(MessageStatus.UNREAD)
        if (unread.isNotEmpty()) {
            jpaRepository.markAllUnreadAsRead(MessageStatus.READ, MessageStatus.UNREAD)
            jpaRepository.flush()
        }
        return unread.map { it.toDomain() }
    }

    override fun findLatestByLocationIds(locationIds: List<Long>): Map<Long, Message> {
        if (locationIds.isEmpty()) return emptyMap()
        val list = jpaRepository.findByLocationNoInOrderBySendDateDesc(locationIds.distinct())
        val map = list
            .filter { it.locationNo != null }
            .distinctBy { it.locationNo!! }
            .associate { it.locationNo!! to it.toDomain() }
        if (list.isEmpty() && locationIds.isNotEmpty()) {
            log.warn("[findLatestByLocationIds] message 테이블에 행이 없습니다. script.sql 의 message INSERT 를 실행하세요.")
        }
        return map
    }

    @Transactional
    override fun markAsRead(messageNo: Long): Boolean {
        val updated = jpaRepository.markAsReadByNo(messageNo)
        if (updated > 0) return true
        return jpaRepository.existsById(messageNo)
    }
}

private fun MessageJpaEntity.toDomain(): Message = Message(
    id = no,
    sender = sender,
    content = content,
    sentAt = sendDate,
    status = status,
    locationId = locationNo
)
