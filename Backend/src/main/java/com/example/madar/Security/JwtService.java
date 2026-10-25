package com.example.madar.Security;

import com.example.madar.Model.User;
import com.example.madar.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final UserRepository userRepository;


    public String generateAccessToken(User user, Instant absoluteExpiresAt) {

        Instant now = Instant.now();
        Instant expiresAt = now.plus(15, ChronoUnit.MINUTES);
        if (absoluteExpiresAt != null && absoluteExpiresAt.isBefore(expiresAt)) {
            expiresAt = absoluteExpiresAt;
        }
        if (!expiresAt.isAfter(now)) {
            throw new org.springframework.security.authentication.BadCredentialsException("Unauthorized");
        }

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("madar")
                .issuedAt(now)
                .expiresAt(expiresAt)
                .subject(user.getId().toString())
                .claim("role", user.getRole())
                .claim("tokenVersion", user.getTokenVersion())
                .build();

        return jwtEncoder.encode(
                JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)
        ).getTokenValue();
    }

    @Transactional
    public void invalidateUserTokens(Integer userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        user.setTokenVersion(user.getTokenVersion() + 1);

        userRepository.save(user);
    }
}
