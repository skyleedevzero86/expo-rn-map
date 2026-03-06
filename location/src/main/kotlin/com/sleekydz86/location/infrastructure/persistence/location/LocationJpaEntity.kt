package com.sleekydz86.location.infrastructure.persistence.location

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "location")
class LocationJpaEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val no: Long = 0,

    @Column(nullable = false)
    var latitude: Double = 0.0,

    @Column(nullable = false)
    var longitude: Double = 0.0,

    @Column(name = "upload_date", nullable = false)
    var uploadDate: Instant = Instant.now(),

    @Column(name = "source", length = 20)
    var source: String? = null 
)
