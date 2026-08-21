package com.sebn.pfmea.backend.process.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProcessResponse(
        UUID id,
        String name,
        String processNumber,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
