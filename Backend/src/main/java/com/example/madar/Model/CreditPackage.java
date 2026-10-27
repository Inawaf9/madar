package com.example.madar.Model;


import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "credit_package")
public class CreditPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotEmpty(message = "Package code is required")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @NotEmpty(message = "Package name is required")
    @Column(nullable = false, length = 100)
    private String name;

    @NotNull(message = "Credits are required")
    @Min(value = 1, message = "Credits must be greater than zero")
    @Column(nullable = false)
    private Integer credits;

    // Original price in halalas
    @NotNull(message = "Price is required")
    @Min(value = 100, message = "Minimum price is 1 SAR")
    @Column(nullable = false)
    private Integer priceHalalas;

    @NotNull
    @Min(0)
    @Max(100)
    @Column(nullable = false)
    private Integer discountPercent = 0;

    @Column(nullable = false)
    private Boolean active = true;
}