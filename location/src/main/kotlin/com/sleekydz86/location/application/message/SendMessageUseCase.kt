package com.sleekydz86.location.application.message

import com.sleekydz86.location.domain.message.Message
import com.sleekydz86.location.domain.message.MessageRepositoryPort
import com.sleekydz86.location.domain.message.MessageStatus
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class SendMessageUseCase(
    private val messageRepository: MessageRepositoryPort
) {
    fun execute(sender: String, content: String): Message {
        val message = Message(
            id = 0L,
            sender = sender.trim(),
            content = content.trim(),
            sentAt = Instant.now(),
            status = MessageStatus.UNREAD
        )
        return messageRepository.save(message)
    }
}
