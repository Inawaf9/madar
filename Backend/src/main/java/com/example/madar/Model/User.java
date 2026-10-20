package com.example.madar.Model;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotEmpty(message = "Full name is required")
    @Size(min = 3, max = 100)
    @Column(columnDefinition = "varchar(100) not null")
    private String fullName;

    @NotEmpty(message = "Email is required")
    @Email(message = "Invalid email format")
    @Column(columnDefinition = "varchar(100) not null unique")
    private String email;

    @NotEmpty(message = "Password is required")
    @Size(min = 8, max = 64, message = "Password must be between 8 and 64 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s])\\S{8,64}$", message = "Password must contain uppercase, lowercase, number, and special character")
    @Column(columnDefinition = "varchar(255) not null")
    private String password;

    @NotEmpty(message = "role is required")
    @Pattern(regexp = "^(ADMIN|USER)$", message = "Role must be ADMIN or USER")
    @Column(columnDefinition = "varchar(20) not null check (role in ('ADMIN','USER'))")
    private String role;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private HousingPreference housingPreference;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private Set<PlacePreference> placePreferences;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private Set<SavedProperty> savedProperties;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private CurrentHome currentHome;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private Set<Payment> payments;

    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<PropertyComparison> propertyComparisons;



    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}