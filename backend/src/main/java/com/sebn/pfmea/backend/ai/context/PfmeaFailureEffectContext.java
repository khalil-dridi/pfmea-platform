package com.sebn.pfmea.backend.ai.context;

import java.util.UUID;

public record PfmeaFailureEffectContext(
        UUID id,
        UUID failureModeId,
        String ourPlant,
        String shipToPlant,
        String endUser,
        Integer severity
) {
}