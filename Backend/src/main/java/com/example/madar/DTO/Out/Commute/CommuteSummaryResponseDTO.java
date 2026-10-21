package com.example.madar.DTO.Out.Commute;


import java.util.List;

public record CommuteSummaryResponseDTO(
        List<CommuteResponseDTO> commutes,
        Double totalWeeklyMinutes,
        Double totalWeeklyHours,
        Double commuteScore

) {
}