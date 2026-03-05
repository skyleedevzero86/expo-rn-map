package com.sleekydz86.location.application.message

import com.sleekydz86.location.domain.message.MessageRepositoryPort
import org.springframework.stereotype.Service

@Service
class MarkMessageAsReadUseCase(
    private val messageRepository: MessageRepositoryPort
) {
    
    fun execute(messageNo: Long): Boolean = messageRepository.markAsRead(messageNo)
}
