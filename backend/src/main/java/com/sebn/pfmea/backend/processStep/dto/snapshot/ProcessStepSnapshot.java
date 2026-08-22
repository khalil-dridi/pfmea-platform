package com.sebn.pfmea.backend.processStep.dto.snapshot;

import java.util.UUID;

public record ProcessStepSnapshot(
        UUID id,
        UUID processId,
        Integer stepNumber,
        String name,
        String description
) {
}
