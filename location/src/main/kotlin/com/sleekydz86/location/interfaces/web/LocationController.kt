package com.sleekydz86.location.interfaces.web

import com.sleekydz86.location.application.location.GetCurrentLocationUseCase
import com.sleekydz86.location.application.location.GetLocationsWithMessagesUseCase
import com.sleekydz86.location.application.location.UpdateLocationUseCase
import com.sleekydz86.location.application.message.GetUnreadMessagesUseCase
import com.sleekydz86.location.interfaces.dto.LocationResponse
import com.sleekydz86.location.interfaces.dto.MessageResponse
import com.sleekydz86.location.interfaces.dto.MessagesResponse
import com.sleekydz86.location.interfaces.dto.PostLocationRequest
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.slf4j.LoggerFactory

@RestController
@RequestMapping("/api")
class LocationController(
    private val getCurrentLocationUseCase: GetCurrentLocationUseCase,
    private val getLocationsWithMessagesUseCase: GetLocationsWithMessagesUseCase,
    private val updateLocationUseCase: UpdateLocationUseCase,
    private val getUnreadMessagesUseCase: GetUnreadMessagesUseCase
) {
    private val log = LoggerFactory.getLogger(LocationController::class.java)

    @GetMapping("/health")
    fun health(): ResponseEntity<Map<String, String>> =
        ResponseEntity.ok(mapOf("status" to "ok"))

    @GetMapping("/mylocation")
    fun getMyLocation(): ResponseEntity<*> {
        val location = getCurrentLocationUseCase.execute()
        return if (location != null) {
            ResponseEntity.ok(
                LocationResponse(
                    no = location.id,
                    latitude = location.coordinates.latitude,
                    longitude = location.coordinates.longitude,
                    uploadDate = location.uploadedAt
                )
            )
        } else {
            ResponseEntity.noContent().build<Any>()
        }
    }

    @GetMapping("/locations")
    fun getLocations(@RequestParam(defaultValue = "100") limit: Int): ResponseEntity<Any> {
        val safeLimit = limit.coerceIn(1, 500)
        val list = getLocationsWithMessagesUseCase.execute(safeLimit).map { loc ->
            mapOf(
                "no" to loc.id,
                "latitude" to loc.coordinates.latitude,
                "longitude" to loc.coordinates.longitude,
                "uploadDate" to loc.uploadedAt,
                "sender" to loc.sender,
                "message" to loc.message,
                "status" to loc.status,
                "source" to (loc.source.takeIf { it.isNotBlank() } ?: "web")
            )
        }
        return ResponseEntity.ok(mapOf("locations" to list))
    }

    @PostMapping("/message")
    fun postLocationAndGetUnreadMessages(
        @Validated @RequestBody body: PostLocationRequest,
        @RequestHeader(name = "X-Source", required = false) sourceHeader: String?
    ): ResponseEntity<MessagesResponse> {
        val rawSource = sourceHeader ?: body.source
        val source = rawSource?.trim()?.lowercase()?.takeIf { it in listOf("web", "mobile") } ?: "web"
        log.info("[POST /api/message] X-Source={}, body.source={}, 사용 source={}", sourceHeader, body.source, source)
        updateLocationUseCase.execute(body.latitude, body.longitude, source)
        val messages = getUnreadMessagesUseCase.execute()
        val list = messages.map { m ->
            MessageResponse(
                no = m.id,
                sender = m.sender,
                message = m.content,
                sendDate = m.sentAt,
                status = MessageResponse.statusToInt(m.status)
            )
        }
        return ResponseEntity.ok(MessagesResponse(message = list))
    }
}
