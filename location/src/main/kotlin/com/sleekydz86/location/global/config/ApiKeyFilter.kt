package com.sleekydz86.location.global.config

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
@Order(1)
class ApiKeyFilter(
    @Value("\${app.api-key:}") private val expectedApiKey: String
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        if (expectedApiKey.isBlank()) {
            filterChain.doFilter(request, response)
            return
        }
        val provided = request.getHeader("X-API-Key")?.trim()
        if (provided != expectedApiKey) {
            response.status = HttpServletResponse.SC_UNAUTHORIZED
            response.contentType = "application/json;charset=UTF-8"
            response.writer.write("""{"code":"UNAUTHORIZED","details":"유효한 API 키가 필요합니다."}""")
            return
        }
        filterChain.doFilter(request, response)
    }

    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        return !request.requestURI.startsWith("/api/")
    }
}
