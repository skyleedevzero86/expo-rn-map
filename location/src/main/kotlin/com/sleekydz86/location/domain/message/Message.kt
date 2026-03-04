package com.sleekydz86.location.domain.message

import java.time.Instant

data class Message(
    val id: Long,
    val sender: String,
    val content: String,
    val sentAt: Instant,
    val status: MessageStatus,
    val locationId: Long? = null
)
