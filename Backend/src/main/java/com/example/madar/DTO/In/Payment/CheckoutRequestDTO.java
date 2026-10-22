package com.example.madar.DTO.In.Payment;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CheckoutRequestDTO {
    @NotEmpty(message = "Service type is required")
    @Size(max = 50)
    private String serviceType;
}
