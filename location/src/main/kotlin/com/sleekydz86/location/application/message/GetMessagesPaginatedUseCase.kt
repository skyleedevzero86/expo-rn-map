package com.sleekydz86.location.application.message

import com.sleekydz86.location.domain.message.Message
import com.sleekydz86.location.domain.message.MessageRepositoryPort
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class GetMessagesPaginatedUseCase(
    private val messageRepository: MessageRepositoryPort,
    @Value("\${api.default-page-size:10}") private val defaultPageSize: Int
) {
    fun execute(page: Int, pageSize: Int?): Pair<List<Message>, Long> {
        val size = pageSize?.takeIf { it > 0 } ?: defaultPageSize
        val safePage = maxOf(1, page)
        val messages = messageRepository.findAllPaginated(safePage, size)
        val total = messageRepository.countAll()
        return messages to total
    }
}
