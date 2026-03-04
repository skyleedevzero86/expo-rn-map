package com.sleekydz86.location.global.exception

import org.slf4j.LoggerFactory
import org.springframework.dao.DataAccessException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(ex: MethodArgumentNotValidException): ResponseEntity<ErrorBody> {
        val errors: Map<String, String> = ex.bindingResult.allErrors.associate { err ->
            ((err as? FieldError)?.field ?: "알수없음") to (err.defaultMessage ?: "잘못된 값")
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorBody("검증_오류", errors))
    }

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgument(ex: IllegalArgumentException): ResponseEntity<ErrorBody> {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorBody("잘못된_요청", ex.message ?: "잘못된 인자입니다."))
    }

    @ExceptionHandler(MissingServletRequestParameterException::class)
    fun handleMissingParam(ex: MissingServletRequestParameterException): ResponseEntity<ErrorBody> {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorBody("파라미터_누락", ex.message ?: "필수 파라미터가 없습니다."))
    }

    @ExceptionHandler(DataAccessException::class)
    fun handleDataAccess(ex: DataAccessException): ResponseEntity<ErrorBody> {
        log.warn("DataAccessException", ex)
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(ErrorBody("DB_오류", "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."))
    }

    @ExceptionHandler(Exception::class)
    fun handleException(ex: Exception): ResponseEntity<ErrorBody> {
        log.error("Unhandled exception", ex)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ErrorBody("서버_오류", "요청 처리 중 오류가 발생했습니다."))
    }

    data class ErrorBody(val code: String, val details: Any)
}
