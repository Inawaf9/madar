package com.example.madar.Model;


import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class HousingPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotEmpty(message = "Region is required")
    @Column(columnDefinition = "varchar(100) not null")
    private String region;

    //عدلتها على بيانات ال kite
    @NotEmpty(message = "City is required")
    @Pattern(regexp = "^[a-z-]+$", message = "City must be in English lowercase like riyadh or jeddah")
    private String city;

    @Size(max = 100, message = "District must be less than 100 characters")
    @Column(columnDefinition = "varchar(100)")
    private String district;

    @NotNull(message = "Budget is required")
    @DecimalMin(value = "1.0", message = "Budget must be greater than zero")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal maxBudget;

    //عدلتها
    @NotEmpty(message = "Property type is required")
    @Pattern(regexp = "^(apartment|villa|floor|duplex|building)$", message = "Property type must be apartment, villa, floor, duplex or building")
    @Column(columnDefinition = "varchar(30) not null")
    private String propertyType;

    @NotEmpty(message = "Listing type is required")
    @Pattern(regexp = "^(rent|sale)$", message = "Listing type must be rent or sale")
    @Column(columnDefinition = "varchar(10) not null")
    private String listingType;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;
}