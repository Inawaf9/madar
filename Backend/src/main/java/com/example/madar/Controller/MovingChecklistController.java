
package com.example.madar.Controller;

import com.example.madar.Api.ApiResponse;
import com.example.madar.Security.CurrentUserAccess;
import com.example.madar.Service.MovingChecklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/moving-checklist")
@RequiredArgsConstructor
public class MovingChecklistController {

    private final MovingChecklistService movingChecklistService;
    private final CurrentUserAccess currentUserAccess;

    //build my moving checklist once (fixed tasks + AI tasks from my home listing)
    @PostMapping("/generate")
    public ResponseEntity<?> generateChecklist(){
        Integer userId = currentUserAccess.getCurrentUserId();
        movingChecklistService.generateChecklist(userId);
        return ResponseEntity.status(200).body(new ApiResponse("Moving checklist created successfully"));
    }

    //get my checklist with done and total
    @GetMapping("/get")
    public ResponseEntity<?> getChecklist(@RequestParam(defaultValue = "ar") String lang){
        Integer userId = currentUserAccess.getCurrentUserId();
        return ResponseEntity.status(200).body(movingChecklistService.getChecklist(userId, lang));
    }

    //check or uncheck a task
    @PutMapping("/toggle/{taskId}")
    public ResponseEntity<?> toggleTask(@PathVariable Integer taskId){
        Integer userId = currentUserAccess.getCurrentUserId();
        movingChecklistService.toggleTask(userId, taskId);
        return ResponseEntity.status(200).body(new ApiResponse("Task updated successfully"));
    }

    //delete my checklist to generate a new one
    @DeleteMapping("/reset")
    public ResponseEntity<?> resetChecklist(){
        Integer userId = currentUserAccess.getCurrentUserId();
        movingChecklistService.resetChecklist(userId);
        return ResponseEntity.status(200).body(new ApiResponse("Moving checklist deleted successfully"));
    }
}
