package com.example.madar.DTO.Out.N8n;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PriceChangeDTO {

    private String title;
    private Integer oldPrice;
    private Integer newPrice;
    private String direction; //DOWN or UP
    private String propertyUrl;
}