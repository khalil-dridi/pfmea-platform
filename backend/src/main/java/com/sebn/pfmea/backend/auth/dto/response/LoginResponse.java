package com.sebn.pfmea.backend.auth.dto.response;

import com.sebn.pfmea.backend.user.enums.Role;
import java.util.UUID;

public record LoginResponse(
        String accessToken,
        String tokenType,
        UUID userId,
        String email,
        Role role
) {
}