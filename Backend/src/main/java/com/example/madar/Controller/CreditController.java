package com.example.madar.Controller;


import com.example.madar.DTO.Out.Credit.CreditBalanceDTO;
import com.example.madar.DTO.Out.Credit.CreditTransactionDTO;
import com.example.madar.Model.CreditTransaction;
import com.example.madar.Service.CreditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/credits")
@RequiredArgsConstructor
public class CreditController {

    private final CreditService creditService;


    // Get current user's credit balance.
    @GetMapping("/me/balance")
    public ResponseEntity<CreditBalanceDTO> getBalance(@AuthenticationPrincipal Jwt jwt) {

        Integer userId = Integer.valueOf(jwt.getSubject());

        return ResponseEntity.status(200).body(new CreditBalanceDTO(creditService.getBalance(userId)));
    }


    // Get current user's credit transaction history.
    @GetMapping("/me/transactions")
    public ResponseEntity<List<CreditTransactionDTO>> getTransactionHistory(@AuthenticationPrincipal Jwt jwt) {

        Integer userId = Integer.valueOf(jwt.getSubject());

        return ResponseEntity.status(200).body(creditService.getTransactionHistory(userId));
    }


    // Get the cost of all smart services.
    @GetMapping("/prices")
    public ResponseEntity<Map<String, Integer>> getServicePrices() {

        return ResponseEntity.status(200).body(creditService.getAllServicePrices());
    }
}