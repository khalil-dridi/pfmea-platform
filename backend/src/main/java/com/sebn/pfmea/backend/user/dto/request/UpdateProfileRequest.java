package com.sebn.pfmea.backend.user.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(

        @Size(max = 100)
        String firstName,

        @Size(max = 100)
        String lastName
) {
}