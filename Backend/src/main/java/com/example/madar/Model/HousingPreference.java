package com.example.madar.Model;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

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


    // Interests are stored in a separate table without creating an Interest entity.
    // Supported nearby-service category identifiers, managed with the housing preference.
    @ElementCollection
    @CollectionTable(name = "housing_interests", joinColumns = @JoinColumn(name = "housing_preference_id"),
            uniqueConstraints = @UniqueConstraint(columnNames = {"housing_preference_id", "interest"}))
    @Column(name = "interest", nullable = false)
    private Set<String> interests = new HashSet<>();

    @OneToOne
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    @JsonIgnore
    private User user;
}
