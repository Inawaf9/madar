package com.example.madar.DTO.Out.Moving;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MovingTaskDTO {

    private Integer id;
    private String title;
    private String source;
    private Boolean done;
}