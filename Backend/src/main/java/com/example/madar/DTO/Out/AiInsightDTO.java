package com.example.madar.DTO.Out;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AiInsightDTO {

    private String title;
    private String summary;
    private List<String> highlights;
    private String advice;
}