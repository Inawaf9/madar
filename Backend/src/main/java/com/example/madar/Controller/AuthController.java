package com.example.madar.Controller;

import com.example.madar.Api.ApiResponse;
import com.example.madar.DTO.In.Auth.*;
import com.example.madar.DTO.Out.Auth.AuthResponse;
import com.example.madar.DTO.Out.Auth.ResetVerificationResponse;
import com.example.madar.Service.AuthService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @ModelAttribute
    public void preventTokenCaching(HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Pragma", "no-cache");
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(201).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.status(200).body(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.status(200).body(new ApiResponse("If the account is eligible, the reset request has been accepted"));
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<ResetVerificationResponse> verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        return ResponseEntity.status(200).body(new ResetVerificationResponse(authService.verifyResetCode(request)));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.status(200).body(new ApiResponse("Password reset successfully"));
    }

    @PatchMapping("/change-password")
    public ResponseEntity<ApiResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.status(200).body(new ApiResponse("Password changed successfully"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.status(200).body(authService.refresh(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request);
        return ResponseEntity.status(200).body(new ApiResponse("Logged out successfully"));
    }

    @PostMapping("/logout-all")
    public ResponseEntity<ApiResponse> logoutAll() {
        authService.logoutAll();
        return ResponseEntity.status(200).body(new ApiResponse("Logged out from all sessions successfully"));
    }
}
