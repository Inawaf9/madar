package com.example.madar.DTO.Out.Moving;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MovingAiDTO {

    private List<AiTask> tasks;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AiTask {
        private String titleAr;
        private String titleEn;
    }
}