package com.example.madar.DTO.Out.User;



import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class WeeklyReportRecipientDTO {

    private Integer userId;
    private String fullName;
    private String email;
}