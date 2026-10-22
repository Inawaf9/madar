package com.example.madar.DTO.In.Payment;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MoyasarWebhookDTO {
    private String id;
    private String type;
    @JsonProperty(value = "secret_token", access = JsonProperty.Access.WRITE_ONLY)
    private String secretToken;
    private Data data;

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Data {
        private String id;
        private String description;
    }
}
