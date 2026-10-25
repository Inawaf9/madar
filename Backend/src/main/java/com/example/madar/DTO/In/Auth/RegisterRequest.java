package com.example.madar.DTO.In.Auth;

import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 100)
        String fullName,

        @NotBlank @Email
        String email,

        @NotBlank
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s])\\S{8,64}$",
                message = "Password must contain uppercase, lowercase, number and special character"
        )
        String password
) {}