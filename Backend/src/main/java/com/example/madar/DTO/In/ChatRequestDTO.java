package com.example.madar.DTO.In;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChatRequestDTO {

    @NotEmpty(message = "Message is required")
    @Size(max = 500, message = "Message must be less than 500 characters")
    private String message;
}