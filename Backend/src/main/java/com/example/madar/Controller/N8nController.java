package com.example.madar.Controller;

import com.example.madar.Service.N8nService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/n8n")
@RequiredArgsConstructor
public class N8nController {

    private final N8nService n8nService;

    //called by n8n every day: finds price changes of saved properties
    //Todo: protect this endpoint with Spring Security (only n8n can call it)
    @PostMapping("/price-changes")
    public ResponseEntity<?> priceChanges(){
        return ResponseEntity.status(200).body(n8nService.checkSavedPrices());
    }
}