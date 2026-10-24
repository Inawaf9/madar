package com.example.madar.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(uniqueConstraints = @UniqueConstraint(
        name = "uk_preference_interest_code",
        columnNames = {"housing_preference_id", "code"}))
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LifestyleInterest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank
    @Column(nullable = false, length = 60)
    private String code;

    @Column(nullable = false, length = 60)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SearchType searchType;

    @Column(length = 100)
    private String googlePlaceType;

    @Column(length = 200)
    private String searchQuery;

    @Column(nullable = false)
    private Boolean active;


    @ManyToOne
    @JoinColumn(name = "housing_preference_id", nullable = false)
    @JsonIgnore
    private HousingPreference housingPreference;

    public enum SearchType {
        NEARBY,
        TEXT
    }
}
