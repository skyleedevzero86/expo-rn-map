package com.sleekydz86.location.global.config

import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class JpaConfig {

    @Bean
    fun hibernatePropertiesCustomizer(): HibernatePropertiesCustomizer {
        return HibernatePropertiesCustomizer { it.remove("hibernate.dialect") }
    }
}
