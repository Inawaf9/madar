package com.example.madar.Controller;

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

    private final AiService aiService;

    //AI explains my match summary and my place in the market
    @GetMapping("/explain-match/{userId}")
    public ResponseEntity<?> explainMatch(@PathVariable Integer userId){
        return ResponseEntity.status(200).body(aiService.explainMatch(userId));
    }

    //chatbot about housing, uses our real data
    @PostMapping("/chat/{userId}")
    public ResponseEntity<?> chat(@PathVariable Integer userId, @RequestBody @Valid ChatRequestDTO request){
        return ResponseEntity.status(200).body(aiService.chat(userId, request.getMessage()));
    }
    //start a new chat (forget old messages)
    @DeleteMapping("/chat/{userId}")
    public ResponseEntity<?> clearChat(@PathVariable Integer userId){
        aiService.clearChat(userId);
        return ResponseEntity.status(200).body(new ApiResponse("Chat cleared"));
    }
}