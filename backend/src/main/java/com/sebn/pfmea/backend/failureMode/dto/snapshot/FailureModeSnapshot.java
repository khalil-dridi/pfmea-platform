package com.sebn.pfmea.backend.failureMode.dto.snapshot;

import java.util.UUID;

public record FailureModeSnapshot(
        UUID id,
        UUID processStepId,
        String description,
        String failureCode
) {
}
