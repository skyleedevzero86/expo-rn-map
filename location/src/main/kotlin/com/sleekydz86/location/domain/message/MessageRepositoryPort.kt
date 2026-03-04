package com.sleekydz86.location.domain.message

interface MessageRepositoryPort {

    fun countAll(): Long

    fun findAllPaginated(page: Int, pageSize: Int): List<Message>

    fun save(message: Message): Message

    fun findUnreadAndMarkAsRead(): List<Message>
    fun findLatestByLocationIds(locationIds: List<Long>): Map<Long, Message>
}
