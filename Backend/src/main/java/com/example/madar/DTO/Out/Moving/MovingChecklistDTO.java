package com.example.madar.DTO.Out.Moving;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MovingChecklistDTO {

    private Integer done;
    private Integer total;
    private List<MovingTaskDTO> movingTasks; //FIXED tasks
    private String note;                     //about ownerChecks only
    private List<MovingTaskDTO> ownerChecks; //AI tasks: things to check with the owner
}