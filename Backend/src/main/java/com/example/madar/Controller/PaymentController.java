package com.example.madar.Controller;

import com.example.madar.Api.ApiResponse;
import com.example.madar.DTO.In.Payment.CheckoutRequestDTO;
import com.example.madar.DTO.In.Payment.MoyasarWebhookDTO;
import com.example.madar.Service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;

    @PostMapping("/{userId}/checkout")
    public ResponseEntity<?> checkout(@PathVariable Integer userId, @RequestBody @Valid CheckoutRequestDTO request,
                                      @RequestHeader("Idempotency-Key") String checkoutKey) {
        return ResponseEntity.status(201).header("Cache-Control", "no-store")
                .body(paymentService.checkout(userId, request.getServiceType(), checkoutKey));
    }

    @GetMapping("/{userId}/{paymentId}/verify")
    public ResponseEntity<?> verify(@PathVariable Integer userId, @PathVariable Integer paymentId) {
        return ResponseEntity.status(200).body(paymentService.verify(userId, paymentId));
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> webhook(@RequestBody MoyasarWebhookDTO event) {
        paymentService.processWebhook(event);
        return ResponseEntity.status(200).body(new ApiResponse("Payment notification processed successfully"));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getHistory(@PathVariable Integer userId, @RequestParam(required = false) String status) {
        return ResponseEntity.status(200).body(paymentService.getHistory(userId, status));
    }

    @GetMapping("/{userId}/access/{serviceType}")
    public ResponseEntity<?> getAccess(@PathVariable Integer userId, @PathVariable String serviceType) {
        return ResponseEntity.status(200).body(paymentService.getAccess(userId, serviceType));
    }
}
