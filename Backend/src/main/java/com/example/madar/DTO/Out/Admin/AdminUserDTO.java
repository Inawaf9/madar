package com.example.madar.DTO.Out.Admin;



public record AdminUserDTO(
        Integer id,
        String fullName,
        String email,
        String role,
        Boolean active,
        Boolean suspendedByAdmin
) {
}

