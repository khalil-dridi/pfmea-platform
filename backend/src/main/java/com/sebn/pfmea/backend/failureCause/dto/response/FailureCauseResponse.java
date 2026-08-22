package com.sebn.pfmea.backend.failureCause.dto.response;

import java.util.UUID;

public record FailureCauseResponse(
        UUID id,
        UUID failureModeId,
        String description
) {
}