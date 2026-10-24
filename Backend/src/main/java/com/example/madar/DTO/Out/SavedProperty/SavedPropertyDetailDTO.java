package com.example.madar.DTO.Out.SavedProperty;

import com.example.madar.DTO.Out.Property.PropertyDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SavedPropertyDetailDTO {
    //same fields as before, so the frontend does not break
    private Integer id;
    private String externalPropertyId;
    private String source;
    private String titleSnapshot;
    private String titleSnapshotAr;
    private String titleSnapshotEn;
    private LocalDateTime savedAt;

    //new: live listing from Kite in both languages
    private Boolean available;     // false = the listing was removed from Kite
    private PropertyDTO property;  // null if not available
}