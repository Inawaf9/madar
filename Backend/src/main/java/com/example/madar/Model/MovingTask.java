package com.example.madar.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MovingTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 200)
    private String titleAr;

    @Column(nullable = false, length = 200)
    private String titleEn;

    //FIXED = same for everyone, AI = from the listing description
    @Column(nullable = false, length = 20)
    private String source;

    @Column(nullable = false)
    private Boolean done = false;

    @Column(nullable = false)
    private Integer sortOrder;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;
}