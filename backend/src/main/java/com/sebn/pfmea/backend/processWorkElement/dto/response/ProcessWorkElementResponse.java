package com.sebn.pfmea.backend.processWorkElement.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProcessWorkElementResponse(
        UUID id,
        UUID processStepId,
        Integer elementNumber,
        String name,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
