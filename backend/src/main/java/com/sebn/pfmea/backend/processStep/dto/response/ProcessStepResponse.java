package com.sebn.pfmea.backend.processStep.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProcessStepResponse(
        UUID id,
        UUID processId,
        Integer stepNumber,
        String name,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
