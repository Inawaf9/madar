package com.example.madar.DTO.Out.CurrentHome;



import java.time.LocalDate;

public record CurrentHomeStatusDTO(
        String status,
        Integer homeId,
        LocalDate movedInAt
) {}
