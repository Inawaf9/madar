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
public class PropertyComparison {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotEmpty(message = "First property ID is required")
    @Column(nullable = false, length = 150)
    private String firstPropertyId;

    @NotEmpty(message = "Second property ID is required")
    @Column(nullable = false, length = 150)
    private String secondPropertyId;

    @NotEmpty(message = "First property source is required")
    @Column(nullable = false, length = 50)
    private String firstPropertySource;

    @NotEmpty(message = "Second property source is required")
    @Column(nullable = false, length = 50)
    private String secondPropertySource;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;
}