package com.example.madar.Service;



import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
public class InternalApiKeyService {

    private final byte[] expectedKey;

    public InternalApiKeyService(@Value("${MADAR_N8N_API_KEY}") String apiKey) {

        if (apiKey == null || apiKey.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("MADAR_N8N_API_KEY must be at least 32 bytes");
        }

        this.expectedKey = apiKey.getBytes(StandardCharsets.UTF_8);
    }

    public void validate(String providedKey) {

        if (providedKey == null || !MessageDigest.isEqual(expectedKey, providedKey.getBytes(StandardCharsets.UTF_8))) {

            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal API key");
        }
    }
}
