package com.example.madar.DTO.In.Security;

import com.fasterxml.jackson.annotation.JsonAnySetter;

/** Owner-scoped inputs explicitly allow only their declared editable fields. */
public abstract class StrictResourceRequest {
    @JsonAnySetter
    public final void rejectUnknownField(String name, Object value) {
        throw new IllegalArgumentException("Unsupported request field");
    }
}
