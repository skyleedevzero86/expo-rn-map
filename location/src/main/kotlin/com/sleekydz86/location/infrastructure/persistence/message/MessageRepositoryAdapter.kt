package com.sleekydz86.location.infrastructure.persistence.message

import com.sleekydz86.location.domain.message.Message
import com.sleekydz86.location.domain.message.MessageRepositoryPort
import com.sleekydz86.location.domain.message.MessageStatus
import org.springframework.context.annotation.Primary
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
@Primary
class MessageRepositoryAdapter(
    private val jpaRepository: MessageJpaRepository
) : MessageRepositoryPort {

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

    @Transactional
    override fun findUnreadAndMarkAsRead(): List<Message> {
        val unread = jpaRepository.findByStatusOrderByNoDesc(MessageStatus.UNREAD)
        if (unread.isNotEmpty()) {
            jpaRepository.markAllUnreadAsRead(MessageStatus.READ, MessageStatus.UNREAD)
            jpaRepository.flush()
        }
        return unread.map { it.toDomain() }
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
