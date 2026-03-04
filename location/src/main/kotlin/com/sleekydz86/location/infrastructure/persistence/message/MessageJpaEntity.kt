package com.sleekydz86.location.infrastructure.persistence.message

import com.sleekydz86.location.domain.message.MessageStatus
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "message")
class MessageJpaEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val no: Long = 0,

    @Column(length = 1000)
    var sender: String = "",

    @Column(name = "message", length = 5000)
    var content: String = "",

    @Column(name = "send_date", nullable = false)
    var sendDate: Instant = Instant.now(),

    @Column(nullable = false)
    @Enumerated(EnumType.ORDINAL)
    var status: MessageStatus = MessageStatus.UNREAD,

    @Column(name = "location_no")
    var locationNo: Long? = null
) {
    companion object {
        private const val READ_ORDINAL = 1
        private const val UNREAD_ORDINAL = 0
    }

    fun isRead(): Boolean = status == MessageStatus.READ
}
