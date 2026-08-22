package com.sebn.pfmea.backend.processWorkElement.dto.snapshot;

import java.util.UUID;

public record ProcessWorkElementSnapshot(
        UUID id,
        UUID processStepId,
        Integer elementNumber,
        String name,
        String description
) {
}
