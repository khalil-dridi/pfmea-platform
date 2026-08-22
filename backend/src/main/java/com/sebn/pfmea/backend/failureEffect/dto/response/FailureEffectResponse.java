package com.sebn.pfmea.backend.failureEffect.dto.response;


import java.util.UUID;

public record FailureEffectResponse(
        UUID id,
        UUID failureModeId,
        String ourPlant,
        String shipToPlant,
        String endUser,
        Integer severity
) {
}