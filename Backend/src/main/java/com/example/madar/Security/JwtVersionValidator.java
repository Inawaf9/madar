package com.example.madar.Security;

import com.example.madar.Model.User;
import com.example.madar.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JwtVersionValidator
        implements OAuth2TokenValidator<Jwt> {

    private final UserRepository userRepository;

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {

        try {
            Integer userId = CurrentUserAccess.parseSubject(jwt.getSubject());

            Object roleClaim = jwt.getClaims().get("role");
            if (!(roleClaim instanceof String role)
                    || !("USER".equals(role) || "ADMIN".equals(role))
                    || jwt.getExpiresAt() == null) {
                return invalid();
            }

            User user = userRepository.findById(userId)
                    .orElse(null);

            Object versionClaim = jwt.getClaims().get("tokenVersion");
            if (!(versionClaim instanceof Integer || versionClaim instanceof Long)) {
                return invalid();
            }
            long tokenVersion = ((Number) versionClaim).longValue();

            if (user == null
                    || !Boolean.TRUE.equals(user.getActive())
                    || Boolean.TRUE.equals(user.getSuspendedByAdmin())
                    || tokenVersion < 0
                    || user.getTokenVersion() == null
                    || tokenVersion != user.getTokenVersion().longValue()
                    || !role.equals(user.getRole())) {

                return invalid();
            }

            return OAuth2TokenValidatorResult.success();

        } catch (RuntimeException ex) {
            return invalid();
        }
    }

    private OAuth2TokenValidatorResult invalid() {
        return OAuth2TokenValidatorResult.failure(
                new OAuth2Error(
                        "invalid_token",
                        "Token is invalid or revoked",
                        null
                )
        );
    }
}
