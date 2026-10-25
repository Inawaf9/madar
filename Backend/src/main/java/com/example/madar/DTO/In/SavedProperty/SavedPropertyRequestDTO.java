package com.example.madar.DTO.In.SavedProperty;

import com.example.madar.DTO.In.Security.StrictResourceRequest;
import com.example.madar.Model.SavedProperty;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SavedPropertyRequestDTO extends StrictResourceRequest {
    @NotEmpty(message = "External property ID is required")
    private String externalPropertyId;

    @NotEmpty(message = "Property source is required")
    private String source;

    public SavedProperty toEntity() {
        SavedProperty saved = new SavedProperty();
        saved.setExternalPropertyId(externalPropertyId);
        saved.setSource(source);
        return saved;
    }
}
