package com.example.madar.DTO.Out;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.example.madar.DTO.Out.Property.PropertyDTO;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatReplyDTO {

    private String reply;
    private List<PropertyDTO> properties;
}