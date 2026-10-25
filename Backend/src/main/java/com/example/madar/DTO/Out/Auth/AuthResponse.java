package com.example.madar.DTO.Out.Auth;

public record AuthResponse(
        String accessToken,
        String tokenType,
        Integer userId,
        String email,
        String role,
        String refreshToken
) {
    @Override
    public String toString() {
        return "AuthResponse[redacted]";
    }
}
