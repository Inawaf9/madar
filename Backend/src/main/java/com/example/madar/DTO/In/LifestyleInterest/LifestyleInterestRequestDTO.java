package com.example.madar.DTO.In.LifestyleInterest;

import com.example.madar.DTO.In.Security.StrictResourceRequest;
import com.example.madar.Model.LifestyleInterest;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LifestyleInterestRequestDTO extends StrictResourceRequest {
    @NotBlank
    private String code;

    // Interest visibility is editable; this is not User.active or an account flag.
    private Boolean active;

    public LifestyleInterest toEntity() {
        LifestyleInterest interest = new LifestyleInterest();
        interest.setCode(code);
        interest.setActive(active);
        return interest;
    }
}
