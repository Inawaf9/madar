package com.example.madar.Security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserAccess {
    public void requireOwner(Integer requestedUserId) {
        if (!getCurrentUserId().equals(requestedUserId)) {
            throw new AccessDeniedException("Forbidden");
        }
    }

    public void requireNewResource(Integer suppliedId) {
        if (suppliedId != null) {
            throw new AccessDeniedException("Forbidden");
        }
    }

    public void requireAdmin(Integer requestedAdminId) {
        requireAdmin();
        requireOwner(requestedAdminId);
    }

    public void requireAdmin() {
        getCurrentUserId();
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getAuthorities().stream()
                .noneMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()))) {
            throw new AccessDeniedException("Forbidden");
        }
    }

    public Integer getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof JwtAuthenticationToken token) || !token.isAuthenticated()) {
            throw new InsufficientAuthenticationException("Unauthorized");
        }
        try {
            return parseSubject(token.getToken().getSubject());
        } catch (IllegalArgumentException e) {
            throw new InsufficientAuthenticationException("Unauthorized");
        }
    }

    static Integer parseSubject(String subject) {
        if (subject == null || !subject.matches("[1-9][0-9]{0,9}")) {
            throw new IllegalArgumentException("Invalid subject");
        }
        return Integer.valueOf(subject);
    }
}
