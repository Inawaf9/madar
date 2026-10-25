package com.example.madar.Security;

import com.example.madar.Api.ApiResponse;
import com.example.madar.Controller.AuthController;
import jakarta.persistence.PersistenceException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.transaction.TransactionException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = AuthController.class)
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class AuthInfrastructureExceptionAdvice {
    @ExceptionHandler({DataAccessException.class, PersistenceException.class,
            TransactionException.class, JwtException.class})
    public ResponseEntity<ApiResponse> unavailable(Exception exception) {
        return ResponseEntity.status(503).header("Cache-Control", "no-store")
                .body(new ApiResponse("Authentication temporarily unavailable"));
    }
}
