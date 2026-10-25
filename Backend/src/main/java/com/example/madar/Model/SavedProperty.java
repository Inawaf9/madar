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
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "source", "external_property_id"}))
public class SavedProperty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotEmpty(message = "External property ID is required")
    @Column(name = "external_property_id", nullable = false, length = 150)
    private String externalPropertyId;

    @NotEmpty(message = "Property source is required")
    @Column(nullable = false, length = 50)
    private String source;

    @Column(length = 200)
    private String titleSnapshot;
    @Column(length = 200)
    private String titleSnapshotAr;
    @Column(length = 200)
    private String titleSnapshotEn;
    //the last price we saw from Kite, to find price changes (n8n checks it every day)
    private Integer lastKnownPrice;

    @Column(nullable = false, updatable = false)
    private LocalDateTime savedAt;

    @PrePersist
    public void onSave() {
        this.savedAt = LocalDateTime.now();
    }

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;
}