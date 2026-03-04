package com.sleekydz86.location.interfaces.web

import com.sleekydz86.location.application.message.GetMessagesPaginatedUseCase
import com.sleekydz86.location.application.message.SendMessageUseCase
import com.sleekydz86.location.interfaces.dto.MessageResponse
import com.sleekydz86.location.interfaces.dto.SendMessageRequest
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class MessageController(
    private val getMessagesPaginatedUseCase: GetMessagesPaginatedUseCase,
    private val sendMessageUseCase: SendMessageUseCase
) {

    @GetMapping("/messages")
    fun getMessages(
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(required = false) pageSize: Int?
    ): ResponseEntity<MessagesPageResponse> {
        val safePage = page.coerceAtLeast(1)
        val safePageSize = (pageSize ?: 10).coerceIn(1, 100)
        val (messages, total) = getMessagesPaginatedUseCase.execute(safePage, safePageSize)
        val items = messages.map { m ->
            MessageResponse(
                no = m.id,
                sender = m.sender,
                message = m.content,
                sendDate = m.sentAt,
                status = MessageResponse.statusToInt(m.status)
            )
        }
        return ResponseEntity.ok(
            MessagesPageResponse(
                messages = items,
                total = total,
                page = safePage
            )
        )
    }

    @PostMapping("/messages")
    fun sendMessage(@Validated @RequestBody request: SendMessageRequest): ResponseEntity<MessageResponse> {
        val message = sendMessageUseCase.execute(request.sender, request.message)
        return ResponseEntity.ok(
            MessageResponse(
                no = message.id,
                sender = message.sender,
                message = message.content,
                sendDate = message.sentAt,
                status = MessageResponse.statusToInt(message.status)
            )
        )
    }

    data class MessagesPageResponse(
        val messages: List<MessageResponse>,
        val total: Long,
        val page: Int
    )
}
