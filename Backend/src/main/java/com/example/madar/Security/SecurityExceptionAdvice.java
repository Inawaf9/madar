package com.example.madar.Security;

import com.example.madar.Api.ApiResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// Security exceptions must precede the existing generic RuntimeException -> 400 advice.
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityExceptionAdvice {
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse> unauthorized(AuthenticationException exception) {
        return ResponseEntity.status(401).header("WWW-Authenticate", "Bearer")
                .header("Cache-Control", "no-store").body(new ApiResponse("Unauthorized"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse> forbidden(AccessDeniedException exception) {
        return ResponseEntity.status(403).header("Cache-Control", "no-store")
                .body(new ApiResponse("Forbidden"));
    }
}
