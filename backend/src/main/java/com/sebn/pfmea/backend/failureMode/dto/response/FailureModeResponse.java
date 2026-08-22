package com.sebn.pfmea.backend.failureMode.dto.response;

import java.util.UUID;

public record FailureModeResponse(
        UUID id,
        UUID processStepId,
        String description,
        String failureCode
) {
}