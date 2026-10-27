package com.example.madar.Model;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotEmpty(message = "Service type is required")
    @Column(nullable = false, length = 50)
    private String serviceType;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    @Column(nullable = false)
    private Integer amount;

    @NotEmpty(message = "Payment status is required")
    @Pattern(regexp = "^(PENDING|PAID|FAILED|REFUNDED)$", message = "Invalid payment status")
    @Column(nullable = false, length = 20)
    private String status;

    @Column(unique = true, length = 150)
    private String providerPaymentId;

    // New checkout amounts use the smallest currency unit. Legacy rows remain unset.
    @Column(length = 3)
    private String currency;

    @Column(unique = true, length = 150)
    private String providerIntentId;

    @Column(unique = true, length = 100)
    private String localReference;

    @JsonIgnore
    @Column(unique = true, length = 100)
    private String checkoutKey;

    private Integer accessDurationHours;

    private LocalDateTime accessExpiresAt;

    private Integer refundedAmount;

    // Snapshot of purchased credit package.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_package_id")
    @JsonIgnore
    private CreditPackage creditPackage;

    // Credits agreed at checkout time.
    @Column(name = "purchased_credits")
    private Integer purchasedCredits;

    @Column(name = "refunded_credits")
    private Integer refundedCredits = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime paidAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;
}