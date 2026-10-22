package com.example.madar.Config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "madar.paid-services")
public class PaidServiceProperties {
    private Map<String, Definition> services = new LinkedHashMap<>();

    @Getter
    @Setter
    public static class Definition {
        private boolean enabled;
        private Integer amountHalalas;
        private String currency;
        private Integer accessHours;
    }
}
