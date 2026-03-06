package com.sleekydz86.location.global.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter

@Configuration
class WebConfig {

    @Value("\${app.cors.allowed-origins:}")
    private lateinit var allowedOriginsConfig: String

    @Bean
    fun corsFilter(): CorsFilter {
        val source = UrlBasedCorsConfigurationSource()
        val config = CorsConfiguration().apply {
            allowCredentials = true
            addAllowedOriginPattern("http://localhost:*")
            addAllowedOriginPattern("http://127.0.0.1:*")
            addAllowedOriginPattern("http://10.0.2.2:*")
            addAllowedOriginPattern("http://0.0.0.0:*")
            addAllowedOriginPattern("exp://*")
            addAllowedOriginPattern("exp://127.0.0.1:*")
            addAllowedOriginPattern("http://192.168.*.*:*")
            addAllowedOriginPattern("http://10.*.*.*:*")
            addAllowedOriginPattern("https://*.ngrok-free.app")
            addAllowedOriginPattern("https://*.ngrok.io")
            val origins = allowedOriginsConfig.split(",").map { it.trim() }.filter { it.isNotEmpty() }
            origins.forEach { addAllowedOrigin(it) }
            addAllowedHeader("*")
            addAllowedMethod("*")
        }
        source.registerCorsConfiguration("/api/**", config)
        return CorsFilter(source)
    }
}