package com.example.madar.DTO.Out.Credit;


import java.time.LocalDateTime;

public record CreditTransactionDTO(
        Integer id,
        String type,
        Integer amount,
        Integer balanceAfter,
        String description,
        LocalDateTime createdAt
) {
}