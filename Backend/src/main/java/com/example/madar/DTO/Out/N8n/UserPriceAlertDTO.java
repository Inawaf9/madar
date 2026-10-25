package com.example.madar.DTO.Out.N8n;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserPriceAlertDTO {

    private Integer userId;
    private String fullName;
    private String email;
    private List<PriceChangeDTO> changes; //all saved properties of this user that changed price
}