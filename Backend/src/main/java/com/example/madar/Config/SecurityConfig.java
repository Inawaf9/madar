package com.example.madar.Config;

import com.example.madar.Security.CustomUserDetailsService;
import com.example.madar.Security.JwtVersionValidator;
import com.example.madar.Security.SecurityErrorHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.List;
import java.time.Duration;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtVersionValidator jwtVersionValidator;
    private final SecurityErrorHandler securityErrorHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            PasswordEncoder encoder
    ) {
        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(encoder);

        return new ProviderManager(provider);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        return http
                .csrf(csrf -> csrf.disable())
                .requestCache(cache -> cache.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(securityErrorHandler)
                        .accessDeniedHandler(securityErrorHandler))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/v1/user/register").denyAll()
                        .requestMatchers(HttpMethod.PUT,
                                "/api/v1/user/update/{userId}",
                                "/api/v1/user/reactivate/{userId}"
                        ).denyAll()
                        // n8n internal endpoints
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/n8n/weekly-report/recipients"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/credit-packages/active"
                        ).permitAll()

                        .requestMatchers(
                                "/api/v1/credit-packages",
                                "/api/v1/credit-packages/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/n8n/weekly-report/recommendations/{userId}",
                                "/api/v1/n8n/price-changes"
                        ).permitAll()
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/auth/register",
                                "/api/v1/auth/login",
                                "/api/v1/auth/forgot-password",
                                "/api/v1/auth/verify-reset-code",
                                "/api/v1/auth/reset-password",
                                "/api/v1/auth/refresh",
                                "/api/v1/auth/logout",
                                "/api/v1/payments/webhook"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/locations/cities",
                                "/api/v1/locations/cities/{city}/neighborhoods",
                                "/api/v1/place-preference/nearby-services",
                                "/api/v1/properties/search",
                                "/api/v1/properties/search/{city}/{listingType}/{propertyType}/{maxPrice}",
                                "/api/v1/properties/get/{source}/{externalId}",
                                "/api/v1/properties/near-location/{city}/{listingType}/{propertyType}/{latitude}/{longitude}/{radiusKm}",
                                "/api/v1/properties/by-districts/{city}/{listingType}/{propertyType}/{districts}",
                                "/api/v1/properties/price-range/{city}/{listingType}/{propertyType}/{minPrice}/{maxPrice}",
                                "/api/v1/properties/sort/{city}/{listingType}/{sortBy}",
                                "/api/v1/properties/price-stats/{city}/{listingType}/{propertyType}",
                                "/api/v1/properties/results-count/{city}/{listingType}",
                                "/api/v1/properties/similar/{source}/{externalId}"
                        ).permitAll()

                        // Admin endpoints
                        .requestMatchers("/api/v1/user/admin/**").hasRole("ADMIN")


                        // Moving Checklist - USER only
                        .requestMatchers(
                                "/api/v1/moving-checklist/generate",
                                "/api/v1/moving-checklist/get",
                                "/api/v1/moving-checklist/toggle/{taskId}",
                                "/api/v1/moving-checklist/reset"
                        ).hasRole("USER")
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 ->
                        oauth2.authenticationEntryPoint(securityErrorHandler)
                                .accessDeniedHandler(securityErrorHandler)
                                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                .build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Object role = jwt.getClaims().get("role");
            if (!(role instanceof String value)
                    || !("USER".equals(value) || "ADMIN".equals(value))) {
                throw new OAuth2AuthenticationException(new OAuth2Error("invalid_token"));
            }
            return List.of(new SimpleGrantedAuthority("ROLE_" + value));
        });
        return converter;
    }

    @Bean
    public SecretKey jwtSecretKey(
            @org.springframework.beans.factory.annotation.Value(
                    "${app.jwt.secret}"
            ) String secret
    ) {
        byte[] key = Base64.getDecoder().decode(secret);

        if (key.length < 32) {
            throw new IllegalStateException(
                    "JWT secret must be at least 256 bits"
            );
        }

        return new SecretKeySpec(key, "HmacSHA256");
    }

    @Bean
    public JwtEncoder jwtEncoder(SecretKey key) {
        return new NimbusJwtEncoder(
                new com.nimbusds.jose.jwk.source.ImmutableSecret<>(key)
        );
    }

    @Bean
    public JwtDecoder jwtDecoder(SecretKey key) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key)
                .macAlgorithm(
                        org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256
                )
                .build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer("madar"),
                new JwtTimestampValidator(Duration.ZERO), jwtVersionValidator));
        return decoder;
    }
}
