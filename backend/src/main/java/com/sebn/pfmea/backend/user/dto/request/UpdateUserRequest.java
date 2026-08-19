package com.sebn.pfmea.backend.user.dto.request;

import com.sebn.pfmea.backend.user.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Email
        @Size(max = 254)
        String email,

        @Size(max = 100)
        String firstName,

        @Size(max = 100)
        String lastName,

        Role role
) {
}