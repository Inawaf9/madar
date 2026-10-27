package com.example.madar.Model;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "credit_transaction", uniqueConstraints = {
                @UniqueConstraint(name = "uk_credit_transaction_reference", columnNames = {"reference_type", "reference_id"})
        }
)
public class CreditTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 40)
    private String type;

    // Positive for credits added, negative for credits spent.
    @Column(nullable = false)
    private Integer amount;

    @Column(nullable = false)
    private Integer balanceAfter;

    @Column(name = "reference_type", nullable = false, length = 50)
    private String referenceType;

    @Column(name = "reference_id", nullable = false, length = 100)
    private String referenceId;

    @Column(length = 255)
    private String description;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    @JsonIgnore
    private CreditWallet wallet;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
