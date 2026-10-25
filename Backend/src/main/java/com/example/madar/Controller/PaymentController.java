package com.example.madar.Controller;

import com.example.madar.Security.CurrentUserAccess;
import com.example.madar.Security.ResourceOwnershipAccess;

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
    private final CurrentUserAccess currentUserAccess;
    private final ResourceOwnershipAccess resourceOwnershipAccess;
    private final PaymentService paymentService;

    @PostMapping("/me/checkout")
    public ResponseEntity<?> checkout(@RequestBody @Valid CheckoutRequestDTO request,
                                      @RequestHeader("Idempotency-Key") String checkoutKey) {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(201).header("Cache-Control", "no-store")
                .body(paymentService.checkout(userId, request.getServiceType(), checkoutKey));
    }

    @GetMapping("/me/{paymentId}/verify")
    public ResponseEntity<?> verify(@PathVariable Integer paymentId) {
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requirePayment(paymentId);

        return ResponseEntity.status(200).body(paymentService.verify(userId, paymentId));
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> webhook(@RequestBody MoyasarWebhookDTO event) {
        paymentService.processWebhook(event);
        return ResponseEntity.status(200).body(new ApiResponse("Payment notification processed successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getHistory(@RequestParam(required = false) String status) {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(paymentService.getHistory(userId, status));
    }

    @GetMapping("/me/access/{serviceType}")
    public ResponseEntity<?> getAccess(@PathVariable String serviceType) {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(paymentService.getAccess(userId, serviceType));
    }
}
