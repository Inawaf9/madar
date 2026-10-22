package com.example.madar.DTO.Out;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import com.example.madar.DTO.Out.Property.MatchSummaryDTO;
import com.example.madar.DTO.Out.Property.PriceStatsDTO;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AiExplanationDTO {

    private String title;
    private String summary;
    private List<String> highlights;
    private String advice;
    private String budgetPosition;
    private Boolean generatedByAi;
    private MatchSummaryDTO matchSummary;
    private PriceStatsDTO marketStats;
}