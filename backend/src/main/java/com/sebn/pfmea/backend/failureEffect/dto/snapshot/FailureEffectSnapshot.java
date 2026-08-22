package com.sebn.pfmea.backend.failureEffect.dto.snapshot;

import java.util.UUID;

public record FailureEffectSnapshot(
        UUID id,
        UUID failureModeId,
        String ourPlant,
        String shipToPlant,
        String endUser,
        Integer severity
) {
}