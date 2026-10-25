package com.example.madar.DTO.In.Auth;

import jakarta.validation.constraints.*;

public record VerifyResetCodeRequest(
        @NotBlank @Email String email,
        @NotBlank @Pattern(regexp = "\\d{6}") String code
) {}