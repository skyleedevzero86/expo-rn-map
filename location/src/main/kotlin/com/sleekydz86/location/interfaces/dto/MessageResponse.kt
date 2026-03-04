package com.sleekydz86.location.interfaces.dto

import com.sleekydz86.location.domain.message.MessageStatus
import java.time.Instant

data class MessageResponse(
    val no: Long,
    val sender: String,
    val message: String,
    val sendDate: Instant,
    val status: Int
) {
    companion object {
        fun statusToInt(status: MessageStatus): Int = when (status) {
            MessageStatus.UNREAD -> 0
            MessageStatus.READ -> 1
        }
    }
}
