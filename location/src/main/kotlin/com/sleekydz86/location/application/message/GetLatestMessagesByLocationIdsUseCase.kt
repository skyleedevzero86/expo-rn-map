package com.sleekydz86.location.application.message

import com.sleekydz86.location.domain.message.Message
import com.sleekydz86.location.domain.message.MessageRepositoryPort
import org.springframework.stereotype.Service

@Service
class GetLatestMessagesByLocationIdsUseCase(
    private val messageRepository: MessageRepositoryPort
) {
    fun execute(locationIds: List<Long>): Map<Long, Message> =
        messageRepository.findLatestByLocationIds(locationIds)
}
