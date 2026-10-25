package com.example.madar.Controller;

import com.example.madar.Api.ApiResponse;
import com.example.madar.Service.MovingChecklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/moving-checklist")
@RequiredArgsConstructor
public class MovingChecklistController {

    private final MovingChecklistService movingChecklistService;

    //build my moving checklist once (fixed tasks + AI tasks from my home listing)
    @PostMapping("/generate/{userId}")
    public ResponseEntity<?> generateChecklist(@PathVariable Integer userId){
        movingChecklistService.generateChecklist(userId);
        return ResponseEntity.status(200).body(new ApiResponse("Moving checklist created successfully"));
    }

    //get my checklist with done and total
    @GetMapping("/get/{userId}")
    public ResponseEntity<?> getChecklist(@PathVariable Integer userId, @RequestParam(defaultValue = "ar") String lang){
        return ResponseEntity.status(200).body(movingChecklistService.getChecklist(userId, lang));
    }

    //check or uncheck a task
    @PutMapping("/toggle/{userId}/{taskId}")
    public ResponseEntity<?> toggleTask(@PathVariable Integer userId, @PathVariable Integer taskId){
        movingChecklistService.toggleTask(userId, taskId);
        return ResponseEntity.status(200).body(new ApiResponse("Task updated successfully"));
    }

    //delete my checklist to generate a new one
    @DeleteMapping("/reset/{userId}")
    public ResponseEntity<?> resetChecklist(@PathVariable Integer userId){
        movingChecklistService.resetChecklist(userId);
        return ResponseEntity.status(200).body(new ApiResponse("Moving checklist deleted successfully"));
    }
}