package com.sleekydz86.location.interfaces.web

import com.sleekydz86.location.application.location.GetCurrentLocationUseCase
import com.sleekydz86.location.application.location.GetLocationsUseCase
import com.sleekydz86.location.application.location.UpdateLocationUseCase
import com.sleekydz86.location.application.message.GetUnreadMessagesUseCase
import com.sleekydz86.location.interfaces.dto.LocationResponse
import com.sleekydz86.location.interfaces.dto.LocationsResponse
import com.sleekydz86.location.interfaces.dto.MessageResponse
import com.sleekydz86.location.interfaces.dto.MessagesResponse
import com.sleekydz86.location.interfaces.dto.PostLocationRequest
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
class LocationController(
    private val getCurrentLocationUseCase: GetCurrentLocationUseCase,
    private val getLocationsUseCase: GetLocationsUseCase,
    private val updateLocationUseCase: UpdateLocationUseCase,
    private val getUnreadMessagesUseCase: GetUnreadMessagesUseCase
) {

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
    fun getLocations(@RequestParam(defaultValue = "100") limit: Int): ResponseEntity<LocationsResponse> {
        val safeLimit = limit.coerceIn(1, 500)
        val list = getLocationsUseCase.execute(safeLimit).map { loc ->
            LocationResponse(
                no = loc.id,
                latitude = loc.coordinates.latitude,
                longitude = loc.coordinates.longitude,
                uploadDate = loc.uploadedAt
            )
        }
        return ResponseEntity.ok(LocationsResponse(locations = list))
    }

    @PostMapping("/message")
    fun postLocationAndGetUnreadMessages(
        @Validated @RequestBody body: PostLocationRequest
    ): ResponseEntity<MessagesResponse> {
        updateLocationUseCase.execute(body.latitude, body.longitude)
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
