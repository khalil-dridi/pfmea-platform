package com.sebn.pfmea.backend.failureEffect.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record FailureEffectCreateRequest(

        @NotNull
        UUID failureModeId,

        @Size(max = 1000)
        String ourPlant,

        @Size(max = 1000)
        String shipToPlant,

        @Size(max = 1000)
        String endUser,

        @NotNull
        Integer severity
) {
}