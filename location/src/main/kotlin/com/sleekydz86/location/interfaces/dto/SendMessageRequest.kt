package com.sleekydz86.location.interfaces.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class SendMessageRequest(
    @field:NotBlank(message = "작성자를 입력하세요.")
    @field:Size(max = 1000)
    val sender: String,

    @field:NotBlank(message = "내용을 입력하세요.")
    @field:Size(max = 5000)
    val message: String
)
