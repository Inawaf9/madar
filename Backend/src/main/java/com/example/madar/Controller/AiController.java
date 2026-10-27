package com.example.madar.Controller;

import com.example.madar.Security.CurrentUserAccess;

import com.example.madar.Api.ApiResponse;
import com.example.madar.DTO.In.ChatRequestDTO;
import com.example.madar.Service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final CurrentUserAccess currentUserAccess;
    private final AiService aiService;

    //AI explains my match summary and my place in the market
    @GetMapping("/explain-match")
    public ResponseEntity<?> explainMatch(){
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(aiService.explainMatch(userId));
    }

    //chatbot about housing, uses our real data
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody @Valid ChatRequestDTO request){
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(aiService.chatWithCredits(userId, request.getMessage()));
    }
    //start a new chat (forget old messages)
    @DeleteMapping("/chat")
    public ResponseEntity<?> clearChat(){
        Integer userId = currentUserAccess.getCurrentUserId();

        aiService.clearChat(userId);
        return ResponseEntity.status(200).body(new ApiResponse("Chat cleared"));
    }
}