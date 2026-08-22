package com.sebn.pfmea.backend.failureCause.dto.snapshot;

import java.util.UUID;

public record FailureCauseSnapshot(
        UUID id,
        UUID failureModeId,
        String description
) {
}